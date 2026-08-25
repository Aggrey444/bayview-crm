import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/follow-ups/[id]">
) {
  try {
    const authResult = await requirePermission("followUps.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.followUp.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.completed === "boolean") {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
    }

    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }

    const followUp = await db.followUp.update({
      where: { id },
      data: updateData,
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    auditLog({
      userId: authResult.user.id,
      action: "FOLLOWUP_COMPLETED",
      entity: "FollowUp",
      entityId: id,
      oldValues: existing,
      newValues: updateData,
      request,
    }).catch((err) => console.error("Failed to log follow-up update", err));

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("PATCH /api/follow-ups/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/follow-ups/[id]">
) {
  try {
    const authResult = await requirePermission("followUps.delete");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    const existing = await db.followUp.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    await db.followUp.delete({ where: { id } });

    auditLog({
      userId: authResult.user.id,
      action: "FOLLOWUP_DELETED",
      entity: "FollowUp",
      entityId: id,
      oldValues: existing,
      request,
    }).catch((err) => console.error("Failed to log follow-up deletion", err));

    return NextResponse.json({ message: "Follow-up deleted" });
  } catch (error) {
    console.error("DELETE /api/follow-ups/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
