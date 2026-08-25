import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { customerSchema, customerSearchSchema } from "@/lib/validations/customer";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

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

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
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
    db.customer.count({ where }),
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

    const serviceIds = data.serviceIds || body.serviceIds || [];

    const customer = await db.customer.create({
      data: {
        ...cleaned,
        services: serviceIds.length > 0
          ? { connect: serviceIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        services: { select: { id: true, name: true } },
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "CUSTOMER_CREATED",
      entity: "Customer",
      entityId: customer.id,
      newValues: { ...cleaned, serviceIds },
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
