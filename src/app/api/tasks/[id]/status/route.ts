import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { taskStatusUpdateSchema } from "@/lib/validations/task";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const authResult = await requirePermission("tasks.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const { status } = taskStatusUpdateSchema.parse(body);

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (
      !authResult.user.role?.viewAllData &&
      existing.assignedToId !== authResult.user.id &&
      existing.createdById !== authResult.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await db.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "TASK_STATUS_CHANGED",
      entity: "Task",
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tasks/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
