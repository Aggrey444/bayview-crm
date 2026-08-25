import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getPaymentById } from "@/lib/queries/payments";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { PaymentStatusChanger } from "@/components/payments/payment-status-changer";
import { Pencil, DollarSign, Building, Calendar, Hash, Globe, CreditCard } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentById(id);
  return { title: payment ? `Payment — ${formatCurrency(Number(payment.amount))}` : "Payment Not Found" };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESSFUL: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

export default async function PaymentDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatCurrency(Number(payment.amount))}
        description={`Payment for ${payment.booking.propertyName}`}
        actions={
          <Link href={`/dashboard/payments/${payment.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <DollarSign className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Amount</p>
              <p className="text-sm font-medium">{formatCurrency(Number(payment.amount))} {payment.currency}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <Badge variant="secondary" className={`text-[10px] ${statusColors[payment.status] || ""}`}>
                {payment.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Building className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Method</p>
              <p className="text-sm font-medium">{payment.method.replace("_", " ")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Created</p>
              <p className="text-sm font-medium">{formatDateTime(payment.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {payment.reference && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Hash className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Reference</p><p className="text-sm font-medium">{payment.reference}</p></div></CardContent></Card>
        )}
        {payment.paymentProvider && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Globe className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Provider</p><p className="text-sm font-medium">{payment.paymentProvider}</p></div></CardContent></Card>
        )}
        {payment.paymentDate && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Calendar className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Payment Date</p><p className="text-sm font-medium">{formatDate(payment.paymentDate)}</p></div></CardContent></Card>
        )}
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Building className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Booking</p>
              <Link href={`/dashboard/bookings/${payment.booking.id}`} className="text-sm font-medium hover:underline">
                {payment.booking.propertyName}
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Building className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Customer</p>
              <Link href={`/dashboard/customers/${payment.booking.customer.id}`} className="text-sm font-medium hover:underline">
                {payment.booking.customer.name}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentStatusChanger paymentId={payment.id} currentStatus={payment.status} />

      {payment.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-600 whitespace-pre-wrap">{payment.notes}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
