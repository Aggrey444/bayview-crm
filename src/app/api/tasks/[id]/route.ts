import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { taskSchema } from "@/lib/validations/task";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { getTaskById } from "@/lib/queries/tasks";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const authResult = await requirePermission("tasks.view");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Check data isolation if user cannot view all data
  if (
    !authResult.user.role?.viewAllData &&
    task.assignedTo?.id !== authResult.user.id &&
    task.createdBy.id !== authResult.user.id
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(task);
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
    const data = taskSchema.partial().parse(body);

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

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (data.status !== "COMPLETED" && existing.status === "COMPLETED") {
        updateData.completedAt = null;
      }
    }
    if (data.assignedToId !== undefined) {
      updateData.assignedToId = data.assignedToId || null;
    }
    if (data.leadId !== undefined) updateData.leadId = data.leadId || null;
    if (data.customerId !== undefined) updateData.customerId = data.customerId || null;
    if (data.bookingId !== undefined) updateData.bookingId = data.bookingId || null;

    const updated = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify new assignee if changed
    if (
      data.assignedToId &&
      data.assignedToId !== existing.assignedToId &&
      data.assignedToId !== authResult.user.id
    ) {
      await db.notification.create({
        data: {
          userId: data.assignedToId,
          type: "TASK_ASSIGNED",
          title: "Task Assigned",
          message: `${authResult.user.name || "A team member"} assigned you the task: "${updated.title}"`,
          link: `/dashboard/tasks`,
          metadata: { taskId: updated.id },
        },
      });
    }

    await auditLog({
      userId: authResult.user.id,
      action: "TASK_UPDATED",
      entity: "Task",
      entityId: id,
      oldValues: existing,
      newValues: updateData,
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const authResult = await requirePermission("tasks.delete");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (
      !authResult.user.role?.viewAllData &&
      existing.createdById !== authResult.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized to delete this task" }, { status: 403 });
    }

    await db.task.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "TASK_DELETED",
      entity: "Task",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
