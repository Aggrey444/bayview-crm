import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { db } from "@/lib/prisma";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("campaigns.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q || "";
  const status = (params.status as "" | "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED") || undefined;
  const page = Number(params.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { leads: true, messages: true },
        },
      },
    }),
    db.campaign.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Create and manage marketing campaigns."
      />
      <CampaignList
        initialCampaigns={campaigns.map(c => ({
          ...c,
          status: c.status as string,
          startDate: c.startDate?.toISOString() ?? null,
          endDate: c.endDate?.toISOString() ?? null,
          budget: c.budget ? Number(c.budget) : null,
          createdAt: c.createdAt.toISOString(),
        }))}
        initialTotal={total}
        initialPage={page}
        initialTotalPages={Math.ceil(total / limit)}
        initialQuery={q}
        initialStatus={status || ""}
      />
    </div>
  );
}
