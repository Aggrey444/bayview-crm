import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LeadList } from "@/components/leads/lead-list";
import { getLeads } from "@/lib/queries/leads";
import { db } from "@/lib/prisma";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; statusId?: string; sourceId?: string; priority?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("leads.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q || "";
  const page = Number(params.page) || 1;
  const statusId = params.statusId || "";
  const sourceId = params.sourceId || "";
  const priorityParam = params.priority || "";
  const priority = priorityParam ? (priorityParam as "LOW" | "MEDIUM" | "HIGH" | "URGENT") : undefined;
  const view = (params.view || "list") as "list" | "pipeline";

  const data = await getLeads({ q, page, limit: 10, statusId, sourceId, priority, view });

  const [sources, statuses] = await Promise.all([
    db.leadSource.findMany({ orderBy: { name: "asc" } }),
    db.leadStatus.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description="Manage your sales pipeline." />
      <LeadList
        initialLeads={data.leads.map((l) => ({
          ...l,
          expectedValue: l.expectedValue as unknown as { toString(): string } | null,
          createdAt: l.createdAt,
          lastContactedAt: l.lastContactedAt,
          nextFollowUpAt: l.nextFollowUpAt,
        }))}
        initialTotal={data.total}
        initialPage={data.page}
        initialTotalPages={data.totalPages}
        initialQuery={q}
        initialView={view}
        initialStatusId={statusId}
        initialSourceId={sourceId}
        initialPriority={priority || ""}
        sources={sources}
        statuses={statuses}
      />
    </div>
  );
}
