import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

type FollowUp = {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  lead: { name: string };
  assignedTo: { name: string | null } | null;
};

function isOverdue(dueDate: Date): boolean {
  return new Date(dueDate) < new Date();
}

export function FollowUpsDue({ followUps }: { followUps: FollowUp[] }) {
  if (followUps.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Follow-ups Due</CardTitle>
          <CardDescription>Pending follow-up tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">All caught up!</p>
            <p className="mt-1 text-xs text-zinc-500">No follow-ups due soon.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Follow-ups Due</CardTitle>
          <CardDescription>Pending follow-up tasks.</CardDescription>
        </div>
        <div className="flex h-6 items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <Clock className="mr-1 h-3 w-3" />
          {followUps.length} pending
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {followUps.map((fu) => {
            const overdue = isOverdue(fu.dueDate);
            return (
              <div
                key={fu.id}
                className={`group flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${
                  overdue
                    ? "border-red-200/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20"
                    : "border-zinc-200/60 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-sm"
                }`}
              >
                <div className="mt-0.5">
                  {overdue ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <CheckCircle2 className="h-3 w-3 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{fu.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {fu.lead.name}
                    {fu.assignedTo?.name && <span className="text-zinc-400"> &middot; {fu.assignedTo.name}</span>}
                  </p>
                </div>
                <span
                  className={`text-xs whitespace-nowrap font-medium ${
                    overdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-400"
                  }`}
                >
                  {formatDate(fu.dueDate)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
