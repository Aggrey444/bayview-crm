import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { leadSchema, leadStatusUpdateSchema, leadAssignSchema } from "@/lib/validations/lead";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]">
) {
  const authResult = await requirePermission("leads.view");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      source: true,
      status: true,
      assignedTo: { select: { id: true, name: true, image: true } },
      customer: true,
      campaign: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
      },
      followUps: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: { select: { id: true, name: true } } },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]">
) {
  try {
    const authResult = await requirePermission("leads.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = leadSchema.parse(body);

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const cleaned = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      service: data.service || null,
      sourceId: data.sourceId || null,
      statusId: data.statusId || null,
      campaignId: data.campaignId || null,
      assignedToId: data.assignedToId || null,
      customerId: data.customerId || null,
      priority: data.priority,
      notes: data.notes || null,
      budget: data.budget ?? null,
      expectedValue: data.expectedValue ?? null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      utmContent: data.utmContent || null,
      utmTerm: data.utmTerm || null,
    };

    const lead = await db.lead.update({ where: { id }, data: cleaned });

    await auditLog({
      userId: authResult.user.id,
      action: "LEAD_UPDATED",
      entity: "Lead",
      entityId: id,
      oldValues: existing,
      newValues: cleaned,
      request,
    });

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

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]">
) {
  try {
    const authResult = await requirePermission("leads.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (body.statusId) {
      const { statusId } = leadStatusUpdateSchema.parse(body);
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

      return NextResponse.json(lead);
    }

    if (body.assignedToId) {
      const { assignedToId } = leadAssignSchema.parse(body);
      const lead = await db.lead.update({ where: { id }, data: { assignedToId } });

      await auditLog({
        userId: authResult.user.id,
        action: "LEAD_ASSIGNED",
        entity: "Lead",
        entityId: id,
        oldValues: { assignedToId: existing.assignedToId },
        newValues: { assignedToId },
        request,
      });

      return NextResponse.json(lead);
    }

    return NextResponse.json({ error: "Invalid patch data" }, { status: 400 });
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/leads/[id]">
) {
  try {
    const authResult = await requirePermission("leads.delete");
    if (authResult.error) return authResult.error;

    const { id } = await params;

    const existing = await db.lead.findUnique({
      where: { id },
      select: { id: true, _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot delete lead with existing bookings." },
        { status: 400 }
      );
    }

    await db.lead.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "LEAD_DELETED",
      entity: "Lead",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ message: "Lead deleted" });
  } catch (error) {
    console.error("DELETE /api/leads/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
