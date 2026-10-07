import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { GuestQrClient } from "@/components/leads/guest-qr-client";
import { db } from "@/lib/prisma";

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
      <PageHeader
        title="Entrance QR Code"
        description="Print and deploy standees at your entrance gate or reception to capture event guests and visitor contacts for prospecting."
      />
      <GuestQrClient initialGuests={recentGuests} totalScans={totalScans} />
    </div>
  );
}
