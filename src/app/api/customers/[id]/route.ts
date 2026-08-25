import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { customerSchema } from "@/lib/validations/customer";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/customers/[id]">
) {
  const authResult = await requirePermission("customers.view");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      services: { select: { id: true, name: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        include: { source: true, status: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        include: {
          payments: true,
          createdBy: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      _count: {
        select: { bookings: true, activities: true, leads: true, messages: true },
      },
    },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/customers/[id]">
) {
  try {
    const authResult = await requirePermission("customers.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = customerSchema.parse(body);

    const existing = await db.customer.findUnique({
      where: { id },
      include: { services: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await db.customer.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 409 }
        );
      }
    }

    const cleaned = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      notes: data.notes || null,
      ...(body.assignedToId !== undefined && {
        assignedToId: body.assignedToId || null,
      }),
    };

    const serviceIds = data.serviceIds || body.serviceIds || [];

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...cleaned,
        services: {
          set: serviceIds.map((sid: string) => ({ id: sid })),
        },
      },
      include: {
        services: { select: { id: true, name: true } },
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "CUSTOMER_UPDATED",
      entity: "Customer",
      entityId: id,
      oldValues: existing,
      newValues: { ...cleaned, serviceIds },
      request,
    });

    return NextResponse.json(customer);
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/customers/[id]">
) {
  try {
    const authResult = await requirePermission("customers.delete");
    if (authResult.error) return authResult.error;

    const { id } = await params;

    const existing = await db.customer.findUnique({
      where: { id },
      select: { id: true, _count: { select: { bookings: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    if (existing._count.bookings > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete customer with existing bookings. Remove bookings first.",
        },
        { status: 400 }
      );
    }

    await db.customer.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "CUSTOMER_DELETED",
      entity: "Customer",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ message: "Customer deleted" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this customer because they have associated records.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
