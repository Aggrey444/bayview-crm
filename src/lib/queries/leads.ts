import { db } from "@/lib/prisma";
import type { LeadSearchParams } from "@/lib/validations/lead";
import {
  type AccessContext,
  scopeFilter,
  mergeScope,
} from "@/lib/queries/access";

export async function getLeads(
  params: LeadSearchParams,
  ctx?: AccessContext,
) {
  const { q, statusId, sourceId, assignedToId, priority, page, limit } =
    params;
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

  const finalWhere = ctx
    ? mergeScope(where, scopeFilter(ctx, "lead"))
    : where;

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where: finalWhere,
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
    db.lead.count({ where: finalWhere }),
  ]);

  return {
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLeadById(id: string, ctx?: AccessContext) {
  const where = ctx
    ? mergeScope({ id }, scopeFilter(ctx, "lead"))
    : { id };

  return db.lead.findFirst({
    where,
    include: {
      source: true,
      status: true,
      assignedTo: { select: { id: true, name: true, image: true } },
      customer: true,
      tasks: true,
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

export async function getPipelineData(ctx?: AccessContext) {
  const statuses = await db.leadStatus.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      leads: {
        where: ctx
          ? { assignedToId: ctx.userId }
          : {},
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
