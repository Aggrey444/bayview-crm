import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/bookings/booking-form";
import { getBookingById } from "@/lib/queries/bookings";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingById(id);
  return { title: booking ? `Edit Booking` : "Booking Not Found" };
}

export default async function EditBookingPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const [customers, staff, leads] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }).then((u) => u.map((s) => ({ id: s.id, name: s.name || "Unknown" }))),
    db.lead.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Booking" description="Update booking details." />
      <BookingForm
        mode="edit"
        bookingId={booking.id}
        customers={customers}
        staff={staff}
        leads={leads}
        defaultValues={{
          customerId: booking.customerId,
          leadId: booking.leadId || "",
          propertyName: booking.propertyName,
          service: booking.service || "",
          roomNumber: booking.roomNumber || "",
          checkInDate: new Date(booking.checkInDate).toISOString().split("T")[0],
          checkOutDate: new Date(booking.checkOutDate).toISOString().split("T")[0],
          guests: booking.guests,
          status: booking.status,
          totalAmount: Number(booking.totalAmount),
          notes: booking.notes || "",
          assignedToId: booking.assignedToId || "",
        }}
      />
    </div>
  );
}
