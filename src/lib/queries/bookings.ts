import { db } from "@/lib/prisma";
import type { BookingSearchParams } from "@/lib/validations/booking";
import {
  type AccessContext,
  scopeFilter,
  mergeScope,
} from "@/lib/queries/access";

export async function getBookings(
  params: BookingSearchParams,
  ctx?: AccessContext,
) {
  const { q, status, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { propertyName: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { roomNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  const finalWhere = ctx
    ? mergeScope(where, scopeFilter(ctx, "booking"))
    : where;

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
    }),
    db.booking.count({ where: finalWhere }),
  ]);

  return {
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBookingById(id: string, ctx?: AccessContext) {
  const where = ctx
    ? mergeScope({ id }, scopeFilter(ctx, "booking"))
    : { id };

  return db.booking.findFirst({
    where,
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
