import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { leadStatusUpdateSchema } from "@/lib/validations/lead";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]/status">
) {
  const authResult = await requirePermission("leads.view");
  if (authResult.error) return authResult.error;
  const { id } = await params;
  const statuses = await db.leadStatus.findMany({ orderBy: { sortOrder: "asc" } });
  const lead = await db.lead.findUnique({ where: { id }, select: { statusId: true } });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ statuses, currentStatusId: lead.statusId });
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]/status">
) {
  try {
    const authResult = await requirePermission("leads.edit");
    if (authResult.error) return authResult.error;
    const { id } = await params;
    const body = await request.json();
    const { statusId } = leadStatusUpdateSchema.parse(body);

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = await db.lead.update({ where: { id }, data: { statusId } });

    await auditLog({
      userId: authResult.user.id,
      action: "LEAD_STATUS_CHANGED",
      entity: "Lead",
      entityId: id,
      oldValues: { statusId: existing.statusId },
      newValues: { statusId },
      request,
    });

    if (statusId !== existing.statusId) {
      const newStatus = await db.leadStatus.findUnique({ where: { id: statusId } });
      const oldStatus = existing.statusId ? await db.leadStatus.findUnique({ where: { id: existing.statusId } }) : null;
      const fallbackUser = await db.user.findFirst({ select: { id: true } });
      await db.activity.create({
        data: {
          type: "NOTE",
          subject: `Status changed from ${oldStatus?.name || "Unknown"} to ${newStatus?.name || "Unknown"}`,
          leadId: id,
          userId: existing.assignedToId || fallbackUser?.id || "",
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
