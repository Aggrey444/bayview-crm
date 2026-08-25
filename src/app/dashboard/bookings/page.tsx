import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getBookings } from "@/lib/queries/bookings";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/prisma";

export const metadata = { title: "Bookings" };

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-emerald-100 text-emerald-700",
  CHECKED_OUT: "bg-zinc-100 text-zinc-600",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-violet-100 text-violet-700",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("bookings.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const data = await getBookings({
    q: params.q || "",
    status: (params.status as "" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "COMPLETED") || undefined,
    page: Number(params.page) || 1,
    limit: 10,
  });

  const statuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "COMPLETED"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage property bookings and reservations."
        actions={
          <Link href="/dashboard/bookings/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Link
            key={s}
            href={params.status === s ? "/dashboard/bookings" : `/dashboard/bookings?status=${s}`}
            className={buttonVariants({
              variant: params.status === s ? "default" : "outline",
              size: "sm",
            })}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <p className="text-sm text-zinc-500">{data.total} booking{data.total !== 1 ? "s" : ""}</p>

      {data.bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">No bookings found.</p>
            <Link href="/dashboard/bookings/new" className={buttonVariants({ variant: "link", size: "sm" })} style={{ marginTop: "0.5rem" }}>
              Create a booking
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.bookings.map((b) => (
            <Link key={b.id} href={`/dashboard/bookings/${b.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{b.customer.name}</span>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[b.status] || ""}`}>
                        {b.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>{b.propertyName}</span>
                      {b.roomNumber && <span>Room {b.roomNumber}</span>}
                      {b.service && <span className="text-zinc-400">{b.service}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    <span>{formatDate(b.checkInDate)} — {formatDate(b.checkOutDate)}</span>
                    <span className="font-medium">{formatCurrency(Number(b.totalAmount))}</span>
                    <span>{b.assignedTo?.name || "Unassigned"}</span>
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
