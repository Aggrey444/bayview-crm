import { db } from "@/lib/prisma";

export interface ReportParams {
  startDate?: string;
  endDate?: string;
}

function getDateRange(params: ReportParams) {
  const start = params.startDate ? new Date(params.startDate) : new Date("2020-01-01");
  const end = params.endDate ? new Date(params.endDate + "T23:59:59.999Z") : new Date();
  return { start, end };
}

export async function getLeadsBySource(params: ReportParams) {
  const { start, end } = getDateRange(params);
  return db.leadSource.findMany({
    orderBy: { name: "asc" },
    include: {
      leads: {
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, convertedAt: true },
      },
    },
  }).then((sources) =>
    sources
      .map((s) => ({
        name: s.name,
        total: s.leads.length,
        converted: s.leads.filter((l) => l.convertedAt !== null).length,
        rate: s.leads.length > 0
          ? Math.round((s.leads.filter((l) => l.convertedAt !== null).length / s.leads.length) * 100)
          : 0,
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)
  );
}

export async function getLeadsByCampaign(params: ReportParams) {
  const { start, end } = getDateRange(params);
  return db.campaign.findMany({
    orderBy: { name: "asc" },
    include: {
      leads: {
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, convertedAt: true },
      },
    },
  }).then((campaigns) =>
    campaigns
      .map((c) => ({
        name: c.name,
        total: c.leads.length,
        converted: c.leads.filter((l) => l.convertedAt !== null).length,
        rate: c.leads.length > 0
          ? Math.round((c.leads.filter((l) => l.convertedAt !== null).length / c.leads.length) * 100)
          : 0,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
  );
}

export async function getLeadsByService(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const leads = await db.lead.groupBy({
    by: ["service"],
    where: {
      createdAt: { gte: start, lte: end },
      service: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return leads.map((l) => ({
    name: l.service || "Unspecified",
    total: l._count.id,
  }));
}

export async function getLeadsByStaff(params: ReportParams) {
  const { start, end } = getDateRange(params);
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      assignedLeads: {
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, convertedAt: true },
      },
    },
  }).then((users) =>
    users
      .map((u) => ({
        name: u.name || "Unknown",
        total: u.assignedLeads.length,
        converted: u.assignedLeads.filter((l) => l.convertedAt !== null).length,
        rate: u.assignedLeads.length > 0
          ? Math.round((u.assignedLeads.filter((l) => l.convertedAt !== null).length / u.assignedLeads.length) * 100)
          : 0,
      }))
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
  );
}

export async function getLeadConversionRate(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const [total, converted] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.lead.count({ where: { createdAt: { gte: start, lte: end }, convertedAt: { not: null } } }),
  ]);

  return {
    total,
    converted,
    rate: total > 0 ? Math.round((converted / total) * 100) : 0,
  };
}

export async function getBookingsReport(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const [total, byStatus] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.booking.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.map((b) => ({
      status: b.status,
      count: b._count.id,
      amount: Number(b._sum.totalAmount || 0),
    })),
  };
}

export async function getPaymentsReport(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const [total, byStatus] = await Promise.all([
    db.payment.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.payment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.map((p) => ({
      status: p.status,
      count: p._count.id,
      amount: Number(p._sum.amount || 0),
    })),
  };
}

export async function getRevenueReport(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const [totalRevenue, successfulPayments] = await Promise.all([
    db.payment.aggregate({
      where: { status: "SUCCESSFUL", createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.payment.findMany({
      where: { status: "SUCCESSFUL", createdAt: { gte: start, lte: end } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Monthly breakdown
  const monthly = new Map<string, number>();
  for (const p of successfulPayments) {
    const month = new Date(p.createdAt).toISOString().slice(0, 7);
    monthly.set(month, (monthly.get(month) || 0) + Number(p.amount));
  }

  return {
    total: Number(totalRevenue._sum.amount || 0),
    count: totalRevenue._count.id,
    monthly: Array.from(monthly.entries()).map(([month, amount]) => ({ month, amount })),
  };
}

export async function getFollowUpPerformance(params: ReportParams) {
  const { start, end } = getDateRange(params);
  const [total, completed, overdue] = await Promise.all([
    db.followUp.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.followUp.count({ where: { createdAt: { gte: start, lte: end }, completed: true } }),
    db.followUp.count({
      where: { createdAt: { gte: start, lte: end }, completed: false, dueDate: { lt: new Date() } },
    }),
  ]);

  return {
    total,
    completed,
    overdue,
    pending: total - completed - overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
