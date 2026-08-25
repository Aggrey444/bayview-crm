import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBookingById } from "@/lib/queries/bookings";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { Pencil, Calendar, Users, DollarSign, Building, User } from "lucide-react";
import { BookingStatusChanger } from "@/components/bookings/booking-status-changer";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const booking = await getBookingById(id);
  return { title: booking ? `Booking — ${booking.propertyName}` : "Booking Not Found" };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-emerald-100 text-emerald-700",
  CHECKED_OUT: "bg-zinc-100 text-zinc-600",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-violet-100 text-violet-700",
};

export default async function BookingDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.propertyName}
        description={`Booking for ${booking.customer.name}`}
        actions={
          <Link href={`/dashboard/bookings/${booking.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Building className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <Badge variant="secondary" className={`text-[10px] ${statusColors[booking.status] || ""}`}>
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <DollarSign className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Total Amount</p>
              <p className="text-sm font-medium">{formatCurrency(Number(booking.totalAmount))}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Dates</p>
              <p className="text-sm font-medium">{formatDate(booking.checkInDate)}</p>
              <p className="text-xs text-zinc-400">to {formatDate(booking.checkOutDate)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Users className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Guests</p>
              <p className="text-sm font-medium">{booking.guests}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <User className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Customer</p>
              <Link href={`/dashboard/customers/${booking.customer.id}`} className="text-sm font-medium hover:underline">{booking.customer.name}</Link>
            </div>
          </CardContent>
        </Card>
        {booking.service && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Building className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Service</p><p className="text-sm font-medium">{booking.service}</p></div></CardContent></Card>
        )}
        {booking.roomNumber && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><Building className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Room</p><p className="text-sm font-medium">{booking.roomNumber}</p></div></CardContent></Card>
        )}
        {booking.assignedTo && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><User className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Assigned Staff</p><p className="text-sm font-medium">{booking.assignedTo.name}</p></div></CardContent></Card>
        )}
        {booking.lead && (
          <Card><CardContent className="flex items-center gap-3 pt-4"><User className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Related Lead</p><Link href={`/dashboard/leads/${booking.lead.id}`} className="text-sm font-medium hover:underline">{booking.lead.name}</Link></div></CardContent></Card>
        )}
        <Card><CardContent className="flex items-center gap-3 pt-4"><Calendar className="h-4 w-4 text-zinc-400" /><div><p className="text-xs text-zinc-500">Created</p><p className="text-sm font-medium">{formatDateTime(booking.createdAt)}</p></div></CardContent></Card>
      </div>

      <BookingStatusChanger bookingId={booking.id} currentStatus={booking.status} />

      {booking.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-600 whitespace-pre-wrap">{booking.notes}</p></CardContent>
        </Card>
      )}

      {booking.payments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Payments ({booking.payments.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {booking.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">{formatCurrency(Number(p.amount))}</span>
                    <p className="text-xs text-zinc-500">{p.method.replace("_", " ")} {p.reference && `\u00b7 ${p.reference}`}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
