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
import { CalendarCheck } from "lucide-react";

type Booking = {
  id: string;
  propertyName: string;
  roomNumber: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
  totalAmount: { toString(): string };
  customer: { name: string };
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60",
  CHECKED_IN: "bg-emerald-100 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60",
  CHECKED_OUT: "bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60",
  CANCELLED: "bg-red-100 text-red-700 border-red-200/60 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60",
};

export function RecentBookingsTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest property bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/30">
              <CalendarCheck className="h-5 w-5 text-violet-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No bookings yet</p>
            <p className="mt-1 text-xs text-zinc-500">Bookings will appear here once created.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest property bookings.</CardDescription>
        </div>
        <Link
          href="/dashboard/bookings"
          className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
        >
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/bookings/${b.id}`}
              className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400 shrink-0">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {b.customer.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {b.propertyName}{b.roomNumber ? ` #${b.roomNumber}` : ""}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] border shrink-0 ${statusColors[b.status] || ""}`}
              >
                {b.status.replace("_", " ")}
              </Badge>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 shrink-0">
                ${b.totalAmount.toString()}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
