import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewQrClient, type RecentReview } from "@/components/leads/review-qr-client";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { QrCode, Star } from "lucide-react";

export const metadata = {
  title: "Service Review QR Code & Customer Feedback",
};

export default async function ReviewQrPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  let totalReviews = 0;
  let averageRating = 5.0;
  const ratingCounts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let recentReviews: RecentReview[] = [];

  try {
    const reviewSource = await db.leadSource.findFirst({
      where: { name: { equals: "Service Review QR Code", mode: "insensitive" } },
    });

    if (reviewSource) {
      const [leads, count] = await Promise.all([
        db.lead.findMany({
          where: { sourceId: reviewSource.id },
          orderBy: { createdAt: "desc" },
          take: 20,
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
        db.lead.count({ where: { sourceId: reviewSource.id } }),
      ]);

      totalReviews = count;

      let sumRating = 0;
      let ratedCount = 0;

      recentReviews = leads.map((l) => {
        let parsedRating: number | undefined = undefined;
        let parsedComments: string | undefined = undefined;

        if (l.notes) {
          const matchRating = l.notes.match(/⭐ (?:Overall Satisfaction|Post-Service Review): (\d)/);
          if (matchRating) {
            parsedRating = parseInt(matchRating[1], 10);
            sumRating += parsedRating;
            ratedCount++;
            if (ratingCounts[parsedRating] !== undefined) {
              ratingCounts[parsedRating]++;
            }
          }

          const matchComments = l.notes.match(/💬 Guest (?:Review & Comments|Feedback): "([^"]+)"/);
          if (matchComments) {
            parsedComments = matchComments[1];
          }
        }

        return {
          id: l.id,
          name: l.name,
          phone: l.phone,
          email: l.email,
          service: l.service,
          createdAt: l.createdAt.toISOString(),
          notes: l.notes,
          rating: parsedRating,
          comments: parsedComments,
        };
      });

      if (ratedCount > 0) {
        averageRating = Number((sumRating / ratedCount).toFixed(1));
      }
    }
  } catch (err) {
    console.error("Failed to fetch review QR leads:", err);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Service Review QR Code"
          description="Deploy tabletop QR codes at tables, pool cabanas, and checkout desks for customers to rate their experience after using your services."
        />
        {/* Quick Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto shrink-0">
          <Link
            href="/dashboard/guest-qr"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
            Entrance QR
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs border border-zinc-200/50 dark:border-zinc-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            Service Review QR
          </span>
        </div>
      </div>

      <ReviewQrClient
        initialReviews={recentReviews}
        totalReviews={totalReviews}
        averageRating={averageRating}
        ratingCounts={ratingCounts}
      />
    </div>
  );
}
