import { db } from "@/lib/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeadsThisMonth,
    leadsRequiringFollowUp,
    totalCustomers,
    totalBookings,
    activeBookings,
    totalPayments,
    completedPayments,
    convertedLeads,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.followUp.count({
      where: {
        completed: false,
        dueDate: { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.customer.count(),
    db.booking.count(),
    db.booking.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
    }),
    db.payment.count(),
    db.payment.aggregate({ where: { status: "SUCCESSFUL" }, _sum: { amount: true } }),
    db.lead.count({ where: { convertedAt: { not: null } } }),
  ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const totalRevenue =
    completedPayments._sum.amount ?? 0;

  return {
    totalLeads,
    newLeadsThisMonth,
    leadsRequiringFollowUp,
    totalCustomers,
    totalBookings,
    activeBookings,
    totalPayments,
    totalRevenue: Number(totalRevenue),
    conversionRate,
    convertedLeads,
  };
}

export async function getRecentLeads(limit = 5) {
  return db.lead.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { source: true, status: true, assignedTo: true },
  });
}

export async function getFollowUpsDue(limit = 5) {
  return db.followUp.findMany({
    take: limit,
    where: { completed: false },
    orderBy: { dueDate: "asc" },
    include: {
      lead: true,
      assignedTo: true,
    },
  });
}

export async function getRecentBookings(limit = 5) {
  return db.booking.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
}

export async function getRecentPayments(limit = 5) {
  return db.payment.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { customer: true } } },
  });
}

export async function getLeadSourceSummary() {
  const sources = await db.leadSource.findMany({
    include: {
      leads: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const total = sources.reduce((sum, s) => sum + s.leads.length, 0);

  return sources
    .map((s) => ({
      name: s.name,
      count: s.leads.length,
      percentage: total > 0 ? Math.round((s.leads.length / total) * 100) : 0,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
