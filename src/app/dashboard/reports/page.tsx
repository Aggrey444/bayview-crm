"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadsBySource {
  name: string;
  total: number;
  converted: number;
  rate: number;
}

interface LeadsByCampaign {
  name: string;
  total: number;
  converted: number;
  rate: number;
}

interface LeadsByService {
  name: string;
  total: number;
}

interface LeadsByStaff {
  name: string;
  total: number;
  converted: number;
  rate: number;
}

interface ConversionRate {
  total: number;
  converted: number;
  rate: number;
}

interface BookingsReport {
  total: number;
  byStatus: { status: string; count: number; amount: number }[];
}

interface PaymentsReport {
  total: number;
  byStatus: { status: string; count: number; amount: number }[];
}

interface RevenueReport {
  total: number;
  count: number;
  monthly: { month: string; amount: number }[];
}

interface FollowUpPerformance {
  total: number;
  completed: number;
  overdue: number;
  pending: number;
  completionRate: number;
}

interface ReportsData {
  leadsBySource: LeadsBySource[];
  leadsByCampaign: LeadsByCampaign[];
  leadsByService: LeadsByService[];
  leadsByStaff: LeadsByStaff[];
  conversionRate: ConversionRate;
  bookings: BookingsReport;
  payments: PaymentsReport;
  revenue: RevenueReport;
  followUps: FollowUpPerformance;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function BarChart({ data }: { data: { name: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-32 text-sm text-right truncate" title={item.name}>{item.name}</span>
          <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary rounded transition-all duration-300"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-16 text-sm text-muted-foreground text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatRow({ label, value, badge }: { label: string; value: string | number; badge?: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
      </div>
    </div>
  );
}

function StatusTable({ data }: { data: { status: string; count: number; amount: number }[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 font-medium">Status</th>
          <th className="text-right py-2 font-medium">Count</th>
          <th className="text-right py-2 font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.status} className="border-b last:border-0">
            <td className="py-2 capitalize">{row.status.replace("_", " ").toLowerCase()}</td>
            <td className="py-2 text-right">{row.count}</td>
            <td className="py-2 text-right">{formatCurrency(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  async function loadReports() {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("report", "all");

    const res = await fetch(`/api/reports?${params.toString()}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then((data: { user?: { permissions?: string[] } }) => {
      const perms = data?.user?.permissions ?? [];
      if (!perms.includes("reports.view")) {
        setHasPermission(false);
        router.push("/dashboard");
      } else {
        setHasPermission(true);
      }
    }).catch(() => {
      setHasPermission(false);
      router.push("/dashboard");
    });
  }, [router]);

  useEffect(() => {
    if (hasPermission) loadReports();
  }, [hasPermission]);

  if (hasPermission === null || loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Analytics and insights" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analytics and insights" />

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={loadReports}>Apply Filters</Button>
            <Button variant="ghost" onClick={() => { setStartDate(""); setEndDate(""); setTimeout(loadReports, 0); }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {!data ? (
        <p className="text-muted-foreground text-sm">Failed to load reports.</p>
      ) : (
        <>
          {/* Row 1: Revenue + Conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatRow label="Total Revenue" value={formatCurrency(data.revenue.total)} badge={`${data.revenue.count} payments`} />
                <Separator className="my-2" />
                {data.revenue.monthly.length > 0 ? (
                  <BarChart data={data.revenue.monthly.map((m) => ({ name: m.month, value: m.amount }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">No revenue data.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Conversion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatRow label="Total Leads" value={data.conversionRate.total} />
                <StatRow label="Converted" value={data.conversionRate.converted} badge={`${data.conversionRate.rate}%`} />
                <Separator className="my-2" />
                <StatRow label="Conversion Rate" value={`${data.conversionRate.rate}%`} />
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Bookings + Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <StatRow label="Total Bookings" value={data.bookings.total} />
                <Separator className="my-2" />
                <StatusTable data={data.bookings.byStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <StatRow label="Total Payments" value={data.payments.total} />
                <Separator className="my-2" />
                <StatusTable data={data.payments.byStatus} />
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Leads by Source + Leads by Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads by Source</CardTitle>
              </CardHeader>
              <CardContent>
                {data.leadsBySource.length > 0 ? (
                  <BarChart data={data.leadsBySource.map((s) => ({ name: s.name, value: s.total }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">No data.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads by Service</CardTitle>
              </CardHeader>
              <CardContent>
                {data.leadsByService.length > 0 ? (
                  <BarChart data={data.leadsByService.map((s) => ({ name: s.name, value: s.total }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">No data.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Leads by Campaign + Leads by Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads by Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                {data.leadsByCampaign.length > 0 ? (
                  <BarChart data={data.leadsByCampaign.map((c) => ({ name: c.name, value: c.total }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">No data.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads by Staff</CardTitle>
              </CardHeader>
              <CardContent>
                {data.leadsByStaff.length > 0 ? (
                  <BarChart data={data.leadsByStaff.map((s) => ({ name: s.name, value: s.total }))} />
                ) : (
                  <p className="text-sm text-muted-foreground">No data.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Follow-up Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-up Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.followUps.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{data.followUps.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{data.followUps.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{data.followUps.overdue}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{data.followUps.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
