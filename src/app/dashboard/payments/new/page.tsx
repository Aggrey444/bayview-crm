import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "Record Payment" };

export default async function NewPaymentPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

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
      <PageHeader title="Record Payment" description="Log a new payment transaction." />
      <PaymentForm mode="create" bookings={bookings} />
    </div>
  );
}
