import { db } from "@/lib/prisma";
import type { TaskSearchParams } from "@/lib/validations/task";

export interface GetTasksOptions extends TaskSearchParams {
  currentUserId?: string;
  canViewAll?: boolean;
}

export async function getTasks(params: GetTasksOptions) {
  const {
    q,
    status,
    priority,
    assignedToId,
    createdById,
    dueDateStart,
    dueDateEnd,
    page = 1,
    limit = 50,
    currentUserId,
    canViewAll = true,
  } = params;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (!canViewAll && currentUserId) {
    where.OR = [
      { assignedToId: currentUserId },
      { createdById: currentUserId },
    ];
  } else {
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  if (dueDateStart || dueDateEnd) {
    where.dueDate = {};
    if (dueDateStart) (where.dueDate as Record<string, unknown>).gte = new Date(dueDateStart);
    if (dueDateEnd) (where.dueDate as Record<string, unknown>).lte = new Date(dueDateEnd);
  }

  if (q) {
    const qFilter = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: qFilter }];
      delete where.OR;
    } else {
      where.OR = qFilter;
    }
  }

  const [tasks, total] = await Promise.all([
    db.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        assignedTo: { select: { id: true, name: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        booking: { select: { id: true, propertyName: true, roomNumber: true } },
      },
    }),
    db.task.count({ where }),
  ]);

  return {
    tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTaskById(id: string) {
  return db.task.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, image: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      booking: { select: { id: true, propertyName: true, roomNumber: true } },
    },
  });
}

export async function getCalendarTasks(params: {
  start: string;
  end: string;
  assignedToId?: string;
  currentUserId?: string;
  canViewAll?: boolean;
}) {
  const { start, end, assignedToId, currentUserId, canViewAll } = params;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const where: Record<string, unknown> = {
    dueDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (!canViewAll && currentUserId) {
    where.OR = [
      { assignedToId: currentUserId },
      { createdById: currentUserId },
    ];
  } else if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  return db.task.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, image: true } },
      createdBy: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      booking: { select: { id: true, propertyName: true } },
    },
  });
}
