"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Search, Plus, Shield, Users, ChevronLeft, ChevronRight } from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  viewAllData: boolean;
  createdAt: string;
  _count: { users: number; permissions: number };
};

interface RoleListProps {
  initialRoles: Role[];
  initialQuery: string;
}

export function RoleList({ initialRoles, initialQuery }: RoleListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roles, setRoles] = useState(initialRoles);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);

  const fetchRoles = useCallback(
    async (q: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);

      try {
        const res = await fetch(`/api/roles?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRoles(data.roles);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoles(query);
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchRoles, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search roles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/dashboard/roles/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        {roles.length} role{roles.length !== 1 ? "s" : ""}
      </p>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">
              {query ? "No roles match your search." : "No roles yet."}
            </p>
            {!query && (
              <Link href="/dashboard/roles/new" className={buttonVariants({ variant: "link" })}>
                Create your first role
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <Link key={r.id} href={`/dashboard/roles/${r.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.name}</span>
                      {r.isSystem && (
                        <Badge variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-600">
                          System
                        </Badge>
                      )}
                      {r.viewAllData && (
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                          Full Access
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {r.description || "No description"} · {r._count.permissions} permissions · {r._count.users} user{r._count.users !== 1 ? "s" : ""}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
