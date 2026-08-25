"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null } | null;
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: "bg-blue-100 text-blue-800",
  USER_CREATED: "bg-green-100 text-green-800",
  USER_ROLE_CHANGED: "bg-yellow-100 text-yellow-800",
  CUSTOMER_CREATED: "bg-green-100 text-green-800",
  CUSTOMER_UPDATED: "bg-blue-100 text-blue-800",
  CUSTOMER_DELETED: "bg-red-100 text-red-800",
  LEAD_CREATED: "bg-green-100 text-green-800",
  LEAD_UPDATED: "bg-blue-100 text-blue-800",
  LEAD_STATUS_CHANGED: "bg-purple-100 text-purple-800",
  LEAD_ASSIGNED: "bg-cyan-100 text-cyan-800",
  LEAD_DELETED: "bg-red-100 text-red-800",
  BOOKING_CREATED: "bg-green-100 text-green-800",
  BOOKING_UPDATED: "bg-blue-100 text-blue-800",
  BOOKING_STATUS_CHANGED: "bg-purple-100 text-purple-800",
  BOOKING_DELETED: "bg-red-100 text-red-800",
  PAYMENT_CREATED: "bg-green-100 text-green-800",
  PAYMENT_UPDATED: "bg-blue-100 text-blue-800",
  PAYMENT_STATUS_CHANGED: "bg-purple-100 text-purple-800",
  PAYMENT_DELETED: "bg-red-100 text-red-800",
  FOLLOWUP_CREATED: "bg-green-100 text-green-800",
  FOLLOWUP_COMPLETED: "bg-emerald-100 text-emerald-800",
  FOLLOWUP_DELETED: "bg-red-100 text-red-800",
  ACTIVITY_CREATED: "bg-green-100 text-green-800",
  AUDLOG_VIEWED: "bg-gray-100 text-gray-800",
};

const ENTITY_OPTIONS = [
  "User", "Customer", "Lead", "Booking", "Payment", "FollowUp", "Activity", "AuditLog",
];

const ACTION_OPTIONS = [
  "USER_LOGIN", "USER_CREATED", "USER_ROLE_CHANGED",
  "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_DELETED",
  "LEAD_CREATED", "LEAD_UPDATED", "LEAD_STATUS_CHANGED", "LEAD_ASSIGNED", "LEAD_DELETED",
  "BOOKING_CREATED", "BOOKING_UPDATED", "BOOKING_STATUS_CHANGED", "BOOKING_DELETED",
  "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_STATUS_CHANGED", "PAYMENT_DELETED",
  "FOLLOWUP_CREATED", "FOLLOWUP_COMPLETED", "FOLLOWUP_DELETED",
  "ACTIVITY_CREATED", "AUDLOG_VIEWED",
];

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function ChangesSummary({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  const changes: string[] = [];
  if (newValues) {
    for (const [key, val] of Object.entries(newValues)) {
      if (oldValues && key in oldValues) {
        if (String(oldValues[key]) !== String(val)) {
          changes.push(`${key}: ${String(oldValues[key]).slice(0, 30)} → ${String(val).slice(0, 30)}`);
        }
      } else {
        changes.push(`${key}: ${String(val).slice(0, 30)}`);
      }
    }
  }
  if (changes.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="text-xs text-muted-foreground list-disc list-inside">
      {changes.slice(0, 5).map((c, i) => <li key={i}>{c}</li>)}
      {changes.length > 5 && <li>+{changes.length - 5} more</li>}
    </ul>
  );
}

export default function AuditLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  async function loadLogs() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);

    const res = await fetch(`/api/audit?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } else if (res.status === 403 || res.status === 401) {
      setLogs([]);
      setTotal(0);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then((data: { user?: { permissions?: string[] } }) => {
      const perms = data?.user?.permissions ?? [];
      if (!perms.includes("audit.view")) {
        setHasPermission(false);
        router.push("/dashboard");
      } else {
        setHasPermission(true);
      }
    }).catch(() => {
      setHasPermission(false);
      router.push("/dashboard");
    });
  }, [router]);

  useEffect(() => {
    if (hasPermission) loadLogs();
  }, [hasPermission, page, entity, action]);

  if (hasPermission === null || loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Log" description="System activity trail" />
        <Card><CardContent className="py-4"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" description={`${total} total entries`} />

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Entity</Label>
              <select
                value={entity}
                onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">All entities</option>
                {ENTITY_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Action</Label>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">All actions</option>
                {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEntity(""); setAction(""); setPage(1); }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 font-medium">Entity ID</th>
                  <th className="text-left px-4 py-3 font-medium">Changes</th>
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <div className="font-medium">{log.user?.name || "System"}</div>
                          <div className="text-muted-foreground">{log.user?.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-[10px] ${ACTION_COLORS[log.action] || ""}`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">{log.entity}</td>
                      <td className="px-4 py-3 text-xs font-mono max-w-[120px] truncate" title={log.entityId || ""}>
                        {log.entityId || "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <ChangesSummary oldValues={log.oldValues} newValues={log.newValues} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} entries)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
