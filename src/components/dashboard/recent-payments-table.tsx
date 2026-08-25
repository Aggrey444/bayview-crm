import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";

type Payment = {
  id: string;
  amount: { toString(): string };
  method: string;
  status: string;
  reference: string | null;
  createdAt: Date;
  booking: {
    customer: { name: string };
  };
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60",
  SUCCESSFUL: "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60",
  FAILED: "bg-red-100 text-red-700 border-red-200/60 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60",
  REFUNDED: "bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60",
};

export function RecentPaymentsTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
              <CreditCard className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No payments yet</p>
            <p className="mt-1 text-xs text-zinc-500">Payments will appear here once recorded.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions.</CardDescription>
        </div>
        <Link
          href="/dashboard/payments"
          className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
        >
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {payments.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/payments/${p.id}`}
              className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {p.booking.customer.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {p.method.replace("_", " ")}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] border shrink-0 ${statusColors[p.status] || ""}`}
              >
                {p.status}
              </Badge>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                ${p.amount.toString()}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
