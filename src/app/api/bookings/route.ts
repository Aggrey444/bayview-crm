import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { bookingSchema, bookingSearchSchema } from "@/lib/validations/booking";
import { notifyBookingCreated } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("bookings.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const params = bookingSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

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

  return NextResponse.json({
    bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("bookings.create");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = bookingSchema.parse(body);

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
      createdById: authResult.user.id,
      assignedToId: data.assignedToId || null,
    };

    const booking = await db.booking.create({ data: cleaned });

    auditLog({
      userId: authResult.user.id,
      action: "BOOKING_CREATED",
      entity: "Booking",
      entityId: booking.id,
      newValues: cleaned,
      request,
    }).catch((err) => console.error("Failed to log booking creation", err));

    // Notify admins/managers
    const customer = await db.customer.findUnique({ where: { id: data.customerId }, select: { name: true } });
    notifyBookingCreated({
      id: booking.id,
      customerName: customer?.name || "Unknown",
      propertyName: booking.propertyName,
    }).catch((err) => console.error("Failed to send booking created notification", err));

    return NextResponse.json(booking, { status: 201 });
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
