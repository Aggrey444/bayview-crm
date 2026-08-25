import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { FollowUpList } from "@/components/shared/follow-up-list";
import { getFollowUpDashboard } from "@/lib/queries/activities";
import { db } from "@/lib/prisma";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("followUps.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const { overdue, today, upcoming } = await getFollowUpDashboard();
  const all = [...overdue, ...today, ...upcoming];
  const staff = await db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description={`${overdue.length} overdue, ${today.length} due today, ${upcoming.length} upcoming`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {overdue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-red-600">Overdue ({overdue.length})</h2>
            <FollowUpList
              initialFollowUps={overdue as unknown as { id: string; title: string; description: string | null; dueDate: Date; completed: boolean; completedAt: Date | null; createdAt: Date; lead: { id: string; name: string }; assignedTo: { id: string; name: string | null } }[]}
              staff={staff}
              showLeadName
            />
          </div>
        )}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-blue-600">Due Today ({today.length})</h2>
          <FollowUpList
            initialFollowUps={today as unknown as { id: string; title: string; description: string | null; dueDate: Date; completed: boolean; completedAt: Date | null; createdAt: Date; lead: { id: string; name: string }; assignedTo: { id: string; name: string | null } }[]}
            staff={staff}
            showLeadName
          />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500">Upcoming ({upcoming.length})</h2>
          <FollowUpList
            initialFollowUps={upcoming as unknown as { id: string; title: string; description: string | null; dueDate: Date; completed: boolean; completedAt: Date | null; createdAt: Date; lead: { id: string; name: string }; assignedTo: { id: string; name: string | null } }[]}
            staff={staff}
            showLeadName
          />
        </div>
      </div>
    </div>
  );
}
