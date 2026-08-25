import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { paymentSchema, paymentStatusSchema } from "@/lib/validations/payment";
import { notifyPaymentSuccessful, notifyPaymentFailed } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]">
) {
  const authResult = await requirePermission("payments.view");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const payment = await db.payment.findUnique({
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

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json(payment);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]">
) {
  try {
    const authResult = await requirePermission("payments.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = paymentSchema.parse(body);

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
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

    const payment = await db.payment.update({ where: { id }, data: cleaned });

    auditLog({
      userId: authResult.user.id,
      action: "PAYMENT_UPDATED",
      entity: "Payment",
      entityId: id,
      oldValues: existing,
      newValues: cleaned,
      request,
    }).catch((err) => console.error("Failed to log payment update", err));

    return NextResponse.json(payment);
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
  { params }: RouteContext<"/api/payments/[id]">
) {
  try {
    const authResult = await requirePermission("payments.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const { status } = paymentStatusSchema.parse(body);

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = await db.payment.update({ where: { id }, data: { status } });

    auditLog({
      userId: authResult.user.id,
      action: "PAYMENT_STATUS_CHANGED",
      entity: "Payment",
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
      request,
    }).catch((err) => console.error("Failed to log payment status change", err));

    // Notify based on new status
    if (status === "SUCCESSFUL") {
      const booking = await db.booking.findUnique({ where: { id: existing.bookingId }, select: { customerId: true, propertyName: true } });
      const customer = booking ? await db.customer.findUnique({ where: { id: booking.customerId }, select: { name: true } }) : null;
      notifyPaymentSuccessful({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        bookingId: payment.bookingId,
        customerName: customer?.name,
      }).catch((err) => console.error("Failed to send payment successful notification", err));
    } else if (status === "FAILED") {
      const booking = await db.booking.findUnique({ where: { id: existing.bookingId }, select: { customerId: true, propertyName: true } });
      const customer = booking ? await db.customer.findUnique({ where: { id: booking.customerId }, select: { name: true } }) : null;
      notifyPaymentFailed({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        bookingId: payment.bookingId,
        customerName: customer?.name,
      }).catch((err) => console.error("Failed to send payment failed notification", err));
    }

    return NextResponse.json(payment);
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
  { params }: RouteContext<"/api/payments/[id]">
) {
  try {
    const authResult = await requirePermission("payments.delete");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    const existing = await db.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await db.payment.delete({ where: { id } });

    auditLog({
      userId: authResult.user.id,
      action: "PAYMENT_DELETED",
      entity: "Payment",
      entityId: id,
      oldValues: existing,
      request,
    }).catch((err) => console.error("Failed to log payment deletion", err));

    return NextResponse.json({ message: "Payment deleted" });
  } catch (error) {
    console.error("DELETE /api/payments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
