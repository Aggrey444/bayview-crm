import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getPayments } from "@/lib/queries/payments";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata = { title: "Payments" };

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESSFUL: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("payments.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const data = await getPayments({
    q: params.q || "",
    status: (params.status as "" | "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED") || undefined,
    page: Number(params.page) || 1,
    limit: 10,
  });

  const statuses = ["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track and manage all payment transactions."
        actions={
          <Link href="/dashboard/payments/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={params.status === s ? "/dashboard/payments" : `/dashboard/payments?status=${s}`}
            className={buttonVariants({
              variant: params.status === s ? "default" : "outline",
              size: "sm",
            })}
          >
            {s}
          </Link>
        ))}
      </div>

      <p className="text-sm text-zinc-500">{data.total} payment{data.total !== 1 ? "s" : ""}</p>

      {data.payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">No payments found.</p>
            <Link href="/dashboard/payments/new" className={buttonVariants({ variant: "link", size: "sm" })} style={{ marginTop: "0.5rem" }}>
              Record a payment
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.payments.map((p) => (
            <Link key={p.id} href={`/dashboard/payments/${p.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{p.booking.customer.name}</span>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[p.status] || ""}`}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>{p.booking.propertyName}</span>
                      {p.reference && <span className="text-zinc-400">{p.reference}</span>}
                      {p.paymentProvider && <span className="text-zinc-400">{p.paymentProvider}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    <span className="font-medium">{formatCurrency(Number(p.amount))} {p.currency}</span>
                    <span>{p.method.replace("_", " ")}</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
