import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { getPaymentById } from "@/lib/queries/payments";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentById(id);
  return { title: payment ? "Edit Payment" : "Payment Not Found" };
}

export default async function EditPaymentPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const payment = await getPaymentById(id);
  if (!payment) notFound();

  const bookings = await db.booking.findMany({
    select: {
      id: true,
      propertyName: true,
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Payment" description="Update payment details." />
      <PaymentForm
        mode="edit"
        paymentId={payment.id}
        bookings={bookings}
        defaultValues={{
          bookingId: payment.bookingId,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          reference: payment.reference || "",
          paymentProvider: payment.paymentProvider || "",
          paymentDate: payment.paymentDate
            ? new Date(payment.paymentDate).toISOString().split("T")[0]
            : "",
          notes: payment.notes || "",
        }}
      />
    </div>
  );
}
