"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
  _count: { leads: number; messages: number };
};

interface CampaignListProps {
  initialCampaigns: Campaign[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialStatus: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-violet-100 text-violet-700",
};

const statuses = ["", "DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];

export function CampaignList({
  initialCampaigns,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialStatus,
}: CampaignListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = useCallback(
    async (q: string, p: number, status: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      params.set("page", String(p));
      params.set("limit", "10");

      try {
        const res = await fetch(`/api/campaigns?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns);
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
      fetchCampaigns(query, page, activeStatus);
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      if (activeStatus) params.set("status", activeStatus);
      else params.delete("status");
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, activeStatus, fetchCampaigns, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <Button
            key={s}
            variant={activeStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveStatus(s);
              setPage(1);
            }}
          >
            {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search campaigns..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Link href="/dashboard/campaigns/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        {total} campaign{total !== 1 ? "s" : ""} found
      </p>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">
              {query || activeStatus ? "No campaigns match your search." : "No campaigns yet."}
            </p>
            {!query && !activeStatus && (
              <Link href="/dashboard/campaigns/new" className={buttonVariants({ variant: "link" })}>
                Create your first campaign
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/dashboard/campaigns/${c.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.name}</span>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[c.status] || ""}`}>
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      {c.startDate && <span>Start: {formatDate(c.startDate)}</span>}
                      {c.endDate && <span>End: {formatDate(c.endDate)}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    {c.budget != null && <span>{formatCurrency(c.budget)}</span>}
                    <span>{c._count.leads} leads</span>
                    <span>{c._count.messages} msgs</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
