import { db } from "@/lib/prisma";
import type { LeadSearchParams } from "@/lib/validations/lead";

export async function getLeads(params: LeadSearchParams) {
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
        assignedTo: { select: { id: true, name: true, image: true } },
        customer: { select: { id: true, name: true } },
        _count: { select: { activities: true, followUps: true, bookings: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return {
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLeadById(id: string) {
  return db.lead.findUnique({
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
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      },
    },
  });
}

export async function getPipelineData() {
  const statuses = await db.leadStatus.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: {
          source: true,
          assignedTo: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          _count: { select: { followUps: true } },
        },
      },
    },
  });

  return statuses;
}
