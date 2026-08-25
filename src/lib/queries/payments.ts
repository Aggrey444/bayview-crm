import { db } from "@/lib/prisma";
import type { PaymentSearchParams } from "@/lib/validations/payment";

export async function getPayments(params: PaymentSearchParams) {
  const { q, status, bookingId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (bookingId) where.bookingId = bookingId;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { paymentProvider: { contains: q, mode: "insensitive" } },
      { booking: { customer: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            propertyName: true,
            customer: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.payment.count({ where }),
  ]);

  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPaymentById(id: string) {
  return db.payment.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          customer: true,
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
  });
}
