import { db } from "@/lib/prisma";
import {
  type AccessContext,
  scopeFilter,
  mergeScope,
} from "@/lib/queries/access";

export async function getActivities(
  params: {
    leadId?: string;
    customerId?: string;
    type?: string;
    page?: number;
    limit?: number;
  },
  ctx?: AccessContext,
) {
  const { leadId, customerId, type, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (customerId) where.customerId = customerId;
  if (type) where.type = type;

  const finalWhere = ctx
    ? mergeScope(where, scopeFilter(ctx, "activity"))
    : where;

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    }),
    db.activity.count({ where: finalWhere }),
  ]);

  return {
    activities,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFollowUps(
  params: {
    leadId?: string;
    assignedToId?: string;
    completed?: boolean;
    overdue?: boolean;
    page?: number;
    limit?: number;
  },
  ctx?: AccessContext,
) {
  const { leadId, assignedToId, completed, overdue, page = 1, limit = 20 } =
    params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (completed !== undefined) where.completed = completed;
  if (overdue) {
    where.completed = false;
    where.dueDate = { lt: new Date() };
  }

  const finalWhere = ctx
    ? mergeScope(where, scopeFilter(ctx, "followUp"))
    : where;

  const [followUps, total] = await Promise.all([
    db.followUp.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { dueDate: "asc" },
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.followUp.count({ where: finalWhere }),
  ]);

  return {
    followUps,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFollowUpDashboard(ctx?: AccessContext) {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfTomorrow = new Date(now);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  const scope = ctx ? scopeFilter(ctx, "followUp") : {};

  const [overdue, today, upcoming] = await Promise.all([
    db.followUp.findMany({
      where: mergeScope(
        { completed: false, dueDate: { lt: now } },
        scope,
      ),
      orderBy: { dueDate: "asc" },
      take: 20,
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.followUp.findMany({
      where: mergeScope(
        {
          completed: false,
          dueDate: { gte: now, lte: endOfDay },
        },
        scope,
      ),
      orderBy: { dueDate: "asc" },
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.followUp.findMany({
      where: mergeScope(
        {
          completed: false,
          dueDate: { gt: endOfDay, lte: endOfWeek },
        },
        scope,
      ),
      orderBy: { dueDate: "asc" },
      take: 20,
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { overdue, today, upcoming };
}
