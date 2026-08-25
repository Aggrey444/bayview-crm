import { db } from "@/lib/prisma";
import type { CustomerSearchParams } from "@/lib/validations/customer";

export async function getCustomers(params: CustomerSearchParams) {
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

  return {
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomerById(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      services: { select: { id: true, name: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        include: { source: true, status: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
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
        take: 20,
      },
    },
  });
}
