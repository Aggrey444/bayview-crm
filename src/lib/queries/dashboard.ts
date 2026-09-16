import { db } from "@/lib/prisma";
import {
  type AccessContext,
  scopeFilter,
  mergeScope,
} from "@/lib/queries/access";

export async function getDashboardStats(ctx?: AccessContext) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const leadScope = ctx ? scopeFilter(ctx, "lead") : {};
  const customerScope = ctx ? scopeFilter(ctx, "customer") : {};
  const bookingScope = ctx ? scopeFilter(ctx, "booking") : {};
  const paymentScope = ctx ? scopeFilter(ctx, "payment") : {};
  const followUpScope = ctx ? scopeFilter(ctx, "followUp") : {};

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
    db.lead.count({ where: leadScope }),
    db.lead.count({
      where: mergeScope({ createdAt: { gte: startOfMonth } }, leadScope),
    }),
    db.followUp.count({
      where: mergeScope(
        {
          completed: false,
          dueDate: {
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        followUpScope,
      ),
    }),
    db.customer.count({ where: customerScope }),
    db.booking.count({ where: bookingScope }),
    db.booking.count({
      where: mergeScope(
        { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
        bookingScope,
      ),
    }),
    db.payment.count({ where: paymentScope }),
    db.payment.aggregate({
      where: mergeScope({ status: "SUCCESSFUL" }, paymentScope),
      _sum: { amount: true },
    }),
    db.lead.count({
      where: mergeScope({ convertedAt: { not: null } }, leadScope),
    }),
  ]);

  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const totalRevenue = completedPayments._sum.amount ?? 0;

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

export async function getRecentLeads(limit = 5, ctx?: AccessContext) {
  const where = ctx ? scopeFilter(ctx, "lead") : {};

  return db.lead.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { source: true, status: true, assignedTo: true },
  });
}

export async function getFollowUpsDue(limit = 5, ctx?: AccessContext) {
  const where = ctx
    ? mergeScope(
        { completed: false },
        scopeFilter(ctx, "followUp"),
      )
    : { completed: false };

  return db.followUp.findMany({
    where,
    take: limit,
    orderBy: { dueDate: "asc" },
    include: {
      lead: true,
      assignedTo: true,
    },
  });
}

export async function getRecentBookings(limit = 5, ctx?: AccessContext) {
  const where = ctx ? scopeFilter(ctx, "booking") : {};

  return db.booking.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
}

export async function getRecentPayments(limit = 5, ctx?: AccessContext) {
  const where = ctx ? scopeFilter(ctx, "payment") : {};

  return db.payment.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { customer: true } } },
  });
}

export async function getLeadSourceSummary(ctx?: AccessContext) {
  const leadScope = ctx ? scopeFilter(ctx, "lead") : {};

  const sources = await db.leadSource.findMany({
    include: {
      leads: {
        where: leadScope,
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
      percentage:
        total > 0 ? Math.round((s.leads.length / total) * 100) : 0,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
