import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { paymentSchema, paymentSearchSchema } from "@/lib/validations/payment";
import { notifyPaymentSuccessful, notifyPaymentFailed } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("payments.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const params = paymentSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    bookingId: searchParams.get("bookingId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

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

  return NextResponse.json({
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("payments.create");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = paymentSchema.parse(body);

    const booking = await db.booking.findUnique({ where: { id: data.bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const cleaned = {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency || "USD",
      method: data.method,
      status: data.status,
      reference: data.reference || null,
      paymentProvider: data.paymentProvider || null,
      paymentDate: data.paymentDate || null,
      notes: data.notes || null,
    };

    const payment = await db.payment.create({ data: cleaned });

    auditLog({
      userId: authResult.user.id,
      action: "PAYMENT_CREATED",
      entity: "Payment",
      entityId: payment.id,
      newValues: cleaned,
      request,
    }).catch((err) => console.error("Failed to log payment creation", err));

    // Notify based on payment status
    if (cleaned.status === "SUCCESSFUL") {
      const customer = await db.customer.findUnique({ where: { id: booking.customerId }, select: { name: true } });
      notifyPaymentSuccessful({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        bookingId: payment.bookingId,
        customerName: customer?.name,
      }).catch((err) => console.error("Failed to send payment successful notification", err));
    } else if (cleaned.status === "FAILED") {
      const customer = await db.customer.findUnique({ where: { id: booking.customerId }, select: { name: true } });
      notifyPaymentFailed({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        bookingId: payment.bookingId,
        customerName: customer?.name,
      }).catch((err) => console.error("Failed to send payment failed notification", err));
    }

    return NextResponse.json(payment, { status: 201 });
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
