import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "New Booking" };

export default async function NewBookingPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [customers, staff, leads] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }).then((u) => u.map((s) => ({ id: s.id, name: s.name || "Unknown" }))),
    db.lead.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Booking" description="Create a new property booking." />
      <BookingForm mode="create" customers={customers} staff={staff} leads={leads} />
    </div>
  );
}
