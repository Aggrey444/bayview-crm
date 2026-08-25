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
import { formatDate } from "@/lib/utils";
import { Search, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";

type Service = { id: string; name: string };
type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  services: Service[];
  _count: { bookings: number; activities: number; leads: number };
};

interface CustomerListProps {
  initialCustomers: Customer[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialServiceId: string;
}

const serviceColors = [
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
  "bg-orange-100 text-orange-800",
  "bg-teal-100 text-teal-800",
  "bg-indigo-100 text-indigo-800",
  "bg-pink-100 text-pink-800",
];

export function CustomerList({
  initialCustomers,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialServiceId,
}: CustomerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState(initialCustomers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [loading, setLoading] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setAllServices(data.filter((s: Service) => !s.id.startsWith("default-")));
      })
      .catch((err) => console.error("Failed to fetch services", err));
  }, []);

  const fetchCustomers = useCallback(
    async (q: string, sid: string, p: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sid) params.set("serviceId", sid);
      params.set("page", String(p));
      params.set("limit", "10");

      try {
        const res = await fetch(`/api/customers?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers);
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
      fetchCustomers(query, serviceId, page);
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      if (serviceId) params.set("serviceId", serviceId);
      else params.delete("serviceId");
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, serviceId, page, fetchCustomers, router, searchParams]);

  const activeServiceName = allServices.find((s) => s.id === serviceId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name, email, phone, or company..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Link href="/dashboard/customers/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-zinc-500">Filter by service:</span>
        <Button
          variant={serviceId === "" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setServiceId("");
            setPage(1);
          }}
        >
          All
        </Button>
        {allServices.map((s) => (
          <Button
            key={s.id}
            variant={serviceId === s.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setServiceId(s.id);
              setPage(1);
            }}
          >
            {s.name}
          </Button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        {total} customer{total !== 1 ? "s" : ""} found
        {activeServiceName && (
          <>
            {" "}in <span className="font-medium">{activeServiceName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-6 px-1"
              onClick={() => {
                setServiceId("");
                setPage(1);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </p>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">
              {query || serviceId ? "No customers match your filters." : "No customers yet."}
            </p>
            {!query && !serviceId && (
              <Link href="/dashboard/customers/new" className={buttonVariants({ variant: "link" })}>
                Add your first customer
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <Link key={c.id} href={`/dashboard/customers/${c.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800">
                    {c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{c.name}</span>
                      {c.company && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {c.company}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {c.email && <span className="truncate">{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                    {c.services.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {c.services.map((s, i) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className={`text-[10px] ${serviceColors[i % serviceColors.length]}`}
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    <span>{c._count.bookings} bookings</span>
                    <span>{c._count.leads} leads</span>
                    <span>{formatDate(c.createdAt)}</span>
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
