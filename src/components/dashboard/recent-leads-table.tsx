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
import { UserPlus } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  priority: string;
  createdAt: Date;
  source: { name: string } | null;
  status: { name: string } | null;
  assignedTo: { name: string | null } | null;
};

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200/60 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900/60",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200/60 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900/60",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60",
  LOW: "bg-zinc-100 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700/60",
};

export function RecentLeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest leads added to the CRM.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
              <UserPlus className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No leads yet</p>
            <p className="mt-1 text-xs text-zinc-500">Leads will appear here once created.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Leads</CardTitle>
          <CardDescription>Latest leads added to the CRM.</CardDescription>
        </div>
        <Link
          href="/dashboard/leads"
          className="text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
        >
          View all &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 text-xs font-bold shrink-0">
                {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {lead.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {lead.source?.name || "No source"} &middot; {lead.status?.name || "No status"}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`text-[10px] border shrink-0 ${priorityColors[lead.priority] || ""}`}
              >
                {lead.priority}
              </Badge>
              <span className="text-[11px] text-zinc-400 shrink-0">
                {formatDate(lead.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
