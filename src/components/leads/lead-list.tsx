"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LeadPipelineCard } from "./pipeline-card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Search, Plus, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";

type Option = { id: string; name: string };

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  priority: string;
  expectedValue: { toString(): string } | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  source: { name: string } | null;
  status: { name: string; id: string } | null;
  assignedTo: { name: string | null } | null;
  customer: { name: string } | null;
  _count: { activities: number; followUps: number; bookings: number };
};

interface LeadListProps {
  initialLeads: Lead[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialView: "list" | "pipeline";
  initialStatusId: string;
  initialSourceId: string;
  initialPriority: string;
  sources: Option[];
  statuses: Option[];
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  LOW: "bg-zinc-100 text-zinc-600",
};

export function LeadList({
  initialLeads,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialView,
  initialStatusId,
  initialSourceId,
  initialPriority,
  sources,
  statuses,
}: LeadListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState(initialLeads);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<"list" | "pipeline">(initialView);
  const [statusId, setStatusId] = useState(initialStatusId);
  const [sourceId, setSourceId] = useState(initialSourceId);
  const [priority, setPriority] = useState(initialPriority);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(
    async (q: string, p: number, sid: string, srcId: string, pri: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sid) params.set("statusId", sid);
      if (srcId) params.set("sourceId", srcId);
      if (pri) params.set("priority", pri);
      params.set("page", String(p));
      params.set("limit", "10");

      try {
        const res = await fetch(`/api/leads?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads(query, page, statusId, sourceId, priority);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, statusId, sourceId, priority, fetchLeads]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search leads..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9 h-8"
            />
          </div>
          <select value={statusId} onChange={(e) => { setStatusId(e.target.value); setPage(1); }} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={sourceId} onChange={(e) => { setSourceId(e.target.value); setPage(1); }} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="h-8 rounded-md border border-input bg-transparent px-2 text-sm">
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input">
            <button onClick={() => setView("list")} className={`h-8 px-2 text-sm ${view === "list" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setView("pipeline")} className={`h-8 px-2 text-sm ${view === "pipeline" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
          <Link href="/dashboard/leads/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-1 h-4 w-4" /> Add Lead
          </Link>
        </div>
      </div>

      <p className="text-sm text-zinc-500">{total} lead{total !== 1 ? "s" : ""}</p>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">{query || statusId || sourceId ? "No leads match filters." : "No leads yet."}</p>
            {!query && !statusId && !sourceId && (
              <Link href="/dashboard/leads/new" className={buttonVariants({ variant: "link", size: "sm" })} style={{ marginTop: "0.5rem" }}>
                Create your first lead
              </Link>
            )}
          </CardContent>
        </Card>
      ) : view === "pipeline" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statuses.slice(0, 5).map((s) => {
              const statusLeads = leads.filter((l) => l.status?.id === s.id);
              return (
                <div key={s.id} className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {s.name} ({statusLeads.length})
                  </h3>
                  <div className="space-y-2">
                    {statusLeads.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-4 text-center">No leads</p>
                    ) : (
                      statusLeads.map((lead) => (
                        <LeadPipelineCard key={lead.id} lead={lead} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{lead.name}</span>
                      <Badge variant="secondary" className={`text-[10px] ${priorityColors[lead.priority] || ""}`}>{lead.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      {lead.email && <span className="truncate">{lead.email}</span>}
                      {lead.company && <span className="truncate">{lead.company}</span>}
                      {lead.service && <span className="truncate text-zinc-400">{lead.service}</span>}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-xs text-zinc-500 shrink-0">
                    <span>{lead.source?.name || "—"}</span>
                    <span>{lead.status?.name || "—"}</span>
                    <span>{lead.assignedTo?.name || "Unassigned"}</span>
                    {lead.expectedValue && <span className="font-medium">{formatCurrency(Number(lead.expectedValue))}</span>}
                    <span>{formatDate(lead.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
