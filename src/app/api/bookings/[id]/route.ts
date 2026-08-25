import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { bookingSchema, bookingStatusSchema } from "@/lib/validations/booking";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/bookings/[id]">
) {
  const authResult = await requirePermission("bookings.view");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/bookings/[id]">
) {
  try {
    const authResult = await requirePermission("bookings.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = bookingSchema.parse(body);

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const cleaned = {
      customerId: data.customerId,
      leadId: data.leadId || null,
      propertyName: data.propertyName,
      service: data.service || null,
      roomNumber: data.roomNumber || null,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      guests: data.guests,
      status: data.status,
      totalAmount: data.totalAmount,
      notes: data.notes || null,
      assignedToId: data.assignedToId || null,
    };

    const booking = await db.booking.update({ where: { id }, data: cleaned });

    auditLog({
      userId: authResult.user.id,
      action: "BOOKING_UPDATED",
      entity: "Booking",
      entityId: id,
      oldValues: existing,
      newValues: cleaned,
      request,
    }).catch((err) => console.error("Failed to log booking update", err));

    return NextResponse.json(booking);
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
  { params }: RouteContext<"/api/bookings/[id]">
) {
  try {
    const authResult = await requirePermission("bookings.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const { status } = bookingStatusSchema.parse(body);

    const existing = await db.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = await db.booking.update({ where: { id }, data: { status } });

    auditLog({
      userId: authResult.user.id,
      action: "BOOKING_STATUS_CHANGED",
      entity: "Booking",
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
      request,
    }).catch((err) => console.error("Failed to log booking status change", err));

    // Notify on confirmation
    if (status === "CONFIRMED") {
      const customer = await db.customer.findUnique({ where: { id: existing.customerId }, select: { name: true } });
      notifyBookingConfirmed({
        id: booking.id,
        customerName: customer?.name || "Unknown",
        propertyName: booking.propertyName,
      }, booking.assignedToId).catch((err) => console.error("Failed to send booking confirmed notification", err));
    }

    return NextResponse.json(booking);
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
  { params }: RouteContext<"/api/bookings/[id]">
) {
  try {
    const authResult = await requirePermission("bookings.delete");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    const existing = await db.booking.findUnique({
      where: { id },
      select: { id: true, _count: { select: { payments: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing._count.payments > 0) {
      return NextResponse.json(
        { error: "Cannot delete booking with existing payments." },
        { status: 400 }
      );
    }

    await db.booking.delete({ where: { id } });

    auditLog({
      userId: authResult.user.id,
      action: "BOOKING_DELETED",
      entity: "Booking",
      entityId: id,
      oldValues: existing,
      request,
    }).catch((err) => console.error("Failed to log booking deletion", err));

    return NextResponse.json({ message: "Booking deleted" });
  } catch (error) {
    console.error("DELETE /api/bookings/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
