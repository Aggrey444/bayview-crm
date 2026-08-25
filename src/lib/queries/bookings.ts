import { db } from "@/lib/prisma";
import type { BookingSearchParams } from "@/lib/validations/booking";

export async function getBookings(params: BookingSearchParams) {
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

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
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
    db.booking.count({ where }),
  ]);

  return {
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBookingById(id: string) {
  return db.booking.findUnique({
    where: { id },
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
