"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  service: string | null;
  priority: string;
  expectedValue: { toString(): string } | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  source: { name: string } | null;
  assignedTo: { name: string | null } | null;
  customer: { name: string } | null;
  _count: { followUps: number };
};

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  LOW: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function LeadPipelineCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/dashboard/leads/${lead.id}`}>
      <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium truncate">{lead.name}</span>
            <Badge variant="secondary" className={`text-[10px] shrink-0 ml-1 ${priorityColors[lead.priority] || ""}`}>
              {lead.priority}
            </Badge>
          </div>
          {lead.company && (
            <p className="text-xs text-zinc-500 truncate">{lead.company}</p>
          )}
          {lead.service && (
            <p className="text-xs text-zinc-400 truncate">{lead.service}</p>
          )}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{lead.source?.name || ""}</span>
            {lead.expectedValue && (
              <span className="font-medium text-zinc-600">
                {formatCurrency(Number(lead.expectedValue))}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>{lead.assignedTo?.name || "Unassigned"}</span>
            {lead._count.followUps > 0 && (
              <span>{lead._count.followUps} follow-ups</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
