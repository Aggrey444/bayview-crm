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
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";

type Role = { id: string; name: string };

type User = {
  id: string;
  name: string | null;
  email: string;
  roleId: string | null;
  roleName: string;
  image: string | null;
  createdAt: string;
};

const roleColorMap: Record<string, string> = {
  Admin: "bg-violet-100 text-violet-700",
  Manager: "bg-blue-100 text-blue-700",
  Staff: "bg-zinc-100 text-zinc-600",
};

interface UserListProps {
  initialUsers: User[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialRoleId: string;
  roles: Role[];
}

export function UserList({
  initialUsers,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialRoleId,
  roles,
}: UserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [activeRoleId, setActiveRoleId] = useState(initialRoleId);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(
    async (q: string, p: number, r: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (r) params.set("roleId", r);
      params.set("page", String(p));
      params.set("limit", "10");

      try {
        const res = await fetch(`/api/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users.map((u: Record<string, unknown>) => ({
            ...u,
            roleName: (u.role as { name: string } | null)?.name || "No Role",
          })));
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
      fetchUsers(query, page, activeRoleId);
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      if (activeRoleId) params.set("roleId", activeRoleId);
      else params.delete("roleId");
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, page, activeRoleId, fetchUsers, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Link href="/dashboard/users/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeRoleId === "" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveRoleId("");
            setPage(1);
          }}
        >
          All
        </Button>
        {roles.map((r) => (
          <Button
            key={r.id}
            variant={activeRoleId === r.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveRoleId(r.id);
              setPage(1);
            }}
          >
            {r.name}
          </Button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        {total} user{total !== 1 ? "s" : ""} found
      </p>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">
              {query || activeRoleId ? "No users match your filters." : "No users yet."}
            </p>
            {!query && !activeRoleId && (
              <Link href="/dashboard/users/new" className={buttonVariants({ variant: "link" })}>
                Add your first user
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Link key={u.id} href={`/dashboard/users/${u.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800">
                    {(u.name || u.email)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{u.name || "Unnamed"}</span>
                      <Badge variant="secondary" className={`text-[10px] ${roleColorMap[u.roleName] || "bg-zinc-100 text-zinc-600"}`}>
                        {u.roleName}
                      </Badge>
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{u.email}</div>
                  </div>
                  <div className="hidden sm:block text-xs text-zinc-500 shrink-0">
                    {formatDate(u.createdAt)}
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
