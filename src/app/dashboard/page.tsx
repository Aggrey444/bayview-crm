import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentLeadsTable } from "@/components/dashboard/recent-leads-table";
import { FollowUpsDue } from "@/components/dashboard/follow-ups-due";
import { RecentBookingsTable } from "@/components/dashboard/recent-bookings-table";
import { RecentPaymentsTable } from "@/components/dashboard/recent-payments-table";
import { LeadSourceSummary } from "@/components/dashboard/lead-source-summary";
import {
  getDashboardStats,
  getRecentLeads,
  getFollowUpsDue,
  getRecentBookings,
  getRecentPayments,
  getLeadSourceSummary,
} from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/utils";
import {
  UserPlus,
  Users,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [stats, recentLeads, followUps, recentBookings, recentPayments, sourceSummary] =
    await Promise.all([
      getDashboardStats(),
      getRecentLeads(5),
      getFollowUpsDue(5),
      getRecentBookings(5),
      getRecentPayments(5),
      getLeadSourceSummary(),
    ]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 sm:p-8 text-white dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,oklch(0.68_0.15_75/0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,oklch(0.68_0.15_75/0.08),transparent_40%)]" />
        <div className="relative z-10">
          <p className="text-sm text-zinc-400">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Welcome back, {session.user.name || "User"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-lg">
            Here&apos;s what&apos;s happening with your CRM today. Track your leads, bookings, and revenue at a glance.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <UserPlus className="h-4 w-4" />
              New Lead
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/5 hover:border-white/20"
            >
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-fade-in-up animate-delay-1">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            description={`${stats.newLeadsThisMonth} new this month`}
            icon={UserPlus}
            iconColor="text-blue-600"
          />
        </div>
        <div className="animate-fade-in-up animate-delay-2">
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            icon={Users}
            iconColor="text-emerald-600"
          />
        </div>
        <div className="animate-fade-in-up animate-delay-3">
          <StatCard
            title="Active Bookings"
            value={stats.activeBookings}
            description={`${stats.totalBookings} total`}
            icon={CalendarCheck}
            iconColor="text-violet-600"
          />
        </div>
        <div className="animate-fade-in-up animate-delay-4">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            description={`${stats.totalPayments} payments`}
            icon={CreditCard}
            iconColor="text-amber-600"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="animate-fade-in-up animate-delay-2">
          <StatCard
            title="Follow-ups Due"
            value={stats.leadsRequiringFollowUp}
            description="within 7 days"
            icon={Clock}
            iconColor="text-rose-600"
          />
        </div>
        <div className="animate-fade-in-up animate-delay-3">
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            description="leads to customers"
            icon={TrendingUp}
            iconColor="text-emerald-600"
          />
        </div>
        <div className="animate-fade-in-up animate-delay-4">
          <StatCard
            title="Converted Leads"
            value={stats.convertedLeads || 0}
            description={`${stats.totalLeads} total leads`}
            icon={TrendingUp}
            iconColor="text-indigo-600"
          />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentLeadsTable leads={recentLeads} />
        <FollowUpsDue followUps={followUps} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentBookingsTable bookings={recentBookings} />
        <RecentPaymentsTable payments={recentPayments} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadSourceSummary sources={sourceSummary} />
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Lead", href: "/dashboard/leads/new", icon: UserPlus, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400" },
                { label: "New Booking", href: "/dashboard/bookings/new", icon: CalendarCheck, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-400" },
                { label: "View Reports", href: "/dashboard/reports", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400" },
                { label: "Campaigns", href: "/dashboard/campaigns", icon: CreditCard, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-white/5 p-3 transition-all duration-200 hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-sm"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color} transition-transform duration-200 group-hover:scale-110`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
