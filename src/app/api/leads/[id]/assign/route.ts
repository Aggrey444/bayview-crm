import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { notifyLeadAssigned } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]/assign">
) {
  try {
    const authResult = await requirePermission("leads.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();

    if (!body.assignedToId) {
      return NextResponse.json(
        { error: "assignedToId is required" },
        { status: 400 }
      );
    }

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: body.assignedToId } });
    if (!user) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const lead = await db.lead.update({
      where: { id },
      data: { assignedToId: body.assignedToId },
    });

    await db.activity.create({
      data: {
        type: "NOTE",
        subject: `Assigned to ${user.name || "Staff"}`,
        leadId: id,
        userId: body.assignedToId,
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "LEAD_ASSIGNED",
      entity: "Lead",
      entityId: id,
      oldValues: { assignedToId: existing.assignedToId },
      newValues: { assignedToId: body.assignedToId },
      request,
    });

    // Notify the assigned staff member
    notifyLeadAssigned(body.assignedToId, { id: lead.id, name: lead.name }).catch((err) => console.error("Failed to send lead assigned notification", err));

    return NextResponse.json(lead);
  } catch (error) {
    console.error("PUT /api/leads/[id]/assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
