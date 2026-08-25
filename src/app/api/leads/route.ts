import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { leadSchema, leadSearchSchema } from "@/lib/validations/lead";
import { notifyNewLead } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("leads.view");
  if (authResult.error) return authResult.error;
  const { searchParams } = new URL(request.url);
  const params = leadSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    statusId: searchParams.get("statusId") || undefined,
    sourceId: searchParams.get("sourceId") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
    priority: searchParams.get("priority") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

  const { q, statusId, sourceId, assignedToId, priority, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (statusId) where.statusId = statusId;
  if (sourceId) where.sourceId = sourceId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (priority) where.priority = priority;

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        source: true,
        status: true,
        assignedTo: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        _count: { select: { activities: true, followUps: true, bookings: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("leads.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = leadSchema.parse(body);

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

    // Auto-assign "New" status if none specified
    if (!cleaned.statusId) {
      const newStatus = await db.leadStatus.findFirst({
        where: { name: "New" },
      });
      if (newStatus) cleaned.statusId = newStatus.id;
    }

    const lead = await db.lead.create({ data: cleaned });

    await auditLog({
      userId: authResult.user.id,
      action: "LEAD_CREATED",
      entity: "Lead",
      entityId: lead.id,
      newValues: cleaned,
      request,
    });

    // Fire notification (non-blocking)
    notifyNewLead({
      id: lead.id,
      name: lead.name,
      source: null,
      assignedToId: lead.assignedToId,
    }).catch((err) => console.error("Failed to send new lead notification", err));

    return NextResponse.json(lead, { status: 201 });
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
