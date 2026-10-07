import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { customerSchema, customerSearchSchema } from "@/lib/validations/customer";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { buildCtx, scopeFilter, mergeScope } from "@/lib/queries/access";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("customers.view");
  if (authResult.error) return authResult.error;
  const { searchParams } = new URL(request.url);
  const params = customerSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    serviceId: searchParams.get("serviceId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

  const { q, serviceId, page, limit } = params;
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

  if (serviceId) {
    where.services = { some: { id: serviceId } };
  }

  const ctx = buildCtx(authResult.user);
  const finalWhere = mergeScope(where, scopeFilter(ctx, "customer"));

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        services: { select: { id: true, name: true } },
        _count: {
          select: { bookings: true, activities: true, leads: true },
        },
      },
    }),
    db.customer.count({ where: finalWhere }),
  ]);

  return NextResponse.json({
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("customers.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = customerSchema.parse(body);

    const cleaned = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      notes: data.notes || null,
      ...(body.assignedToId && { assignedToId: body.assignedToId }),
    };

    // Non view-all users must be able to see what they created
    if (!authResult.user.role?.viewAllData && !cleaned.assignedToId) {
      cleaned.assignedToId = authResult.user.id;
    }

    if (cleaned.email) {
      const existing = await db.customer.findUnique({
        where: { email: cleaned.email },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 409 }
        );
      }
    }

    const rawServiceIds: string[] = data.serviceIds || body.serviceIds || [];
    const servicePrices: Record<string, number> = data.servicePrices || body.servicePrices || {};

    // Resolve any "default-" services so they have real database records
    const resolvedServiceRecords: Array<{ id: string; name: string; price: number }> = [];
    for (const rawId of rawServiceIds) {
      if (rawId.startsWith("default-")) {
        const serviceName = rawId.replace("default-", "");
        try {
          const upserted = await db.service.upsert({
            where: { name: serviceName },
            update: {},
            create: {
              name: serviceName,
              price: servicePrices[rawId] !== undefined ? servicePrices[rawId] : undefined,
            },
          });
          resolvedServiceRecords.push({
            id: upserted.id,
            name: upserted.name,
            price: servicePrices[rawId] ?? Number(upserted.price ?? 0),
          });
        } catch (err) {
          console.warn("Failed to upsert default service:", serviceName, err);
        }
      } else {
        const dbService = await db.service.findUnique({ where: { id: rawId } });
        if (dbService) {
          resolvedServiceRecords.push({
            id: dbService.id,
            name: dbService.name,
            price: servicePrices[rawId] ?? Number(dbService.price ?? 0),
          });
        }
      }
    }

    const finalServiceIds = resolvedServiceRecords.map((s) => s.id);

    const customer = await db.customer.create({
      data: {
        ...cleaned,
        services: finalServiceIds.length > 0
          ? { connect: finalServiceIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        services: { select: { id: true, name: true } },
      },
    });

    // Calculate total price from selected services
    let totalAmount = 0;
    const serviceBreakdownLines: string[] = [];
    for (const s of resolvedServiceRecords) {
      const price = Number(s.price || 0);
      totalAmount += price;
      serviceBreakdownLines.push(`• ${s.name}: GHS ${price.toFixed(2)}`);
    }

    const serviceBreakdown = serviceBreakdownLines.length > 0
      ? `Subscribed Services:\n${serviceBreakdownLines.join("\n")}`
      : "";

    // Automatically create Booking/Order if services were chosen
    if (resolvedServiceRecords.length > 0) {
      const bDetails = data.bookingDetails;
      const pDetails = data.paymentDetails;

      const serviceNames = resolvedServiceRecords.map((s) => s.name).join(", ");
      const checkInDate = bDetails?.checkInDate ? new Date(bDetails.checkInDate) : new Date();
      const checkOutDate = bDetails?.checkOutDate ? new Date(bDetails.checkOutDate) : new Date();

      const bookingNotes = [
        serviceBreakdown,
        bDetails?.notes ? `Reservation Notes: ${bDetails.notes}` : "",
      ].filter(Boolean).join("\n\n");

      const booking = await db.booking.create({
        data: {
          customerId: customer.id,
          propertyName: bDetails?.propertyName || "Bayview Village",
          service: serviceNames,
          roomNumber: bDetails?.roomNumber || null,
          checkInDate,
          checkOutDate,
          guests: bDetails?.guests ? Number(bDetails.guests) : 1,
          status: pDetails?.paymentStatus === "PAID" ? "CONFIRMED" : "PENDING",
          totalAmount,
          notes: bookingNotes,
          createdById: authResult.user.id,
          assignedToId: cleaned.assignedToId || authResult.user.id,
        },
      });

      // If marked as paid, record immediate Payment
      if (pDetails?.paymentStatus === "PAID") {
        const amountPaid = pDetails.amountPaid !== undefined && pDetails.amountPaid !== null
          ? Number(pDetails.amountPaid)
          : totalAmount;

        await db.payment.create({
          data: {
            bookingId: booking.id,
            amount: amountPaid,
            currency: "GHS",
            method: (pDetails.paymentMethod as any) || "CASH",
            status: "SUCCESSFUL",
            reference: pDetails.paymentReference || `PAY-${Date.now().toString(36).toUpperCase()}`,
            paymentDate: new Date(),
            notes: pDetails.notes || `Initial payment for services: ${serviceNames}`,
          },
        });
      }
    }

    await auditLog({
      userId: authResult.user.id,
      action: "CUSTOMER_CREATED",
      entity: "Customer",
      entityId: customer.id,
      newValues: { ...cleaned, serviceIds: finalServiceIds, totalAmount },
      request,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
