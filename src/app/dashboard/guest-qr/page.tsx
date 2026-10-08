import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { GuestQrClient } from "@/components/leads/guest-qr-client";
import { db } from "@/lib/prisma";

import Link from "next/link";
import { QrCode, Star } from "lucide-react";

export const metadata = {
  title: "Entrance QR Code & Guest Capture",
};

export default async function GuestQrPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  // Fetch entrance QR leads & stats
  let totalScans = 0;
  let recentGuests: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    service: string | null;
    createdAt: string;
    notes: string | null;
  }> = [];

  try {
    const qrSource = await db.leadSource.findFirst({
      where: { name: { equals: "Entrance QR Code", mode: "insensitive" } },
    });

    if (qrSource) {
      const [leads, count] = await Promise.all([
        db.lead.findMany({
          where: { sourceId: qrSource.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            service: true,
            createdAt: true,
            notes: true,
          },
        }),
        db.lead.count({ where: { sourceId: qrSource.id } }),
      ]);

      totalScans = count;
      recentGuests = leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.error("Failed to fetch guest QR leads:", err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Entrance QR Code"
          description="Print and deploy standees at your entrance gate or reception to capture event guests and visitor contacts for prospecting."
        />
        {/* Quick Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs border border-zinc-200/50 dark:border-zinc-700">
            <QrCode className="h-3.5 w-3.5" />
            Entrance QR
          </span>
          <Link
            href="/dashboard/review-qr"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Star className="h-3.5 w-3.5 text-zinc-400" />
            Service Review QR
          </Link>
        </div>
      </div>
      <GuestQrClient initialGuests={recentGuests} totalScans={totalScans} />
    </div>
  );
}
