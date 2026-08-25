"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

type FollowUp = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  lead: { id: string; name: string };
  assignedTo: { id: string; name: string | null };
};

interface FollowUpListProps {
  initialFollowUps: FollowUp[];
  leadId?: string;
  staff: { id: string; name: string | null }[];
  showLeadName?: boolean;
}

export function FollowUpList({ initialFollowUps, leadId, staff, showLeadName = false }: FollowUpListProps) {
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function toggleComplete(id: string, completed: boolean) {
    const res = await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    if (res.ok) {
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, completed: !completed, completedAt: !completed ? new Date() : null }
            : f
        )
      );
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      dueDate: fd.get("dueDate") as string,
      leadId: leadId || (fd.get("leadId") as string),
      assignedToId: fd.get("assignedToId") as string,
    };

    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }

      const newFup = await res.json();
      setFollowUps((prev) => [newFup, ...prev]);
      setShowForm(false);
      setLoading(false);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  const overdue = followUps.filter((f) => !f.completed && new Date(f.dueDate) < new Date());
  const pending = followUps.filter((f) => !f.completed && new Date(f.dueDate) >= new Date());
  const completed = followUps.filter((f) => f.completed);

  function renderFollowUp(fu: FollowUp) {
    const isOverdue = !fu.completed && new Date(fu.dueDate) < new Date();
    return (
      <div key={fu.id} className="flex items-start gap-3 rounded-lg border p-3">
        <button
          onClick={() => toggleComplete(fu.id, fu.completed)}
          className="mt-0.5 shrink-0"
        >
          {fu.completed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : isOverdue ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Clock className="h-4 w-4 text-zinc-300" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${fu.completed ? "line-through text-zinc-400" : ""}`}>
            {fu.title}
          </p>
          {fu.description && <p className="text-xs text-zinc-500">{fu.description}</p>}
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
            {showLeadName && <span>{fu.lead.name}</span>}
            <span>{fu.assignedTo.name}</span>
            <span>&middot;</span>
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>{formatDate(fu.dueDate)}</span>
          </div>
        </div>
        <Badge variant={fu.completed ? "secondary" : "outline"} className={`text-[10px] shrink-0 ${isOverdue ? "border-red-300 text-red-600" : ""}`}>
          {fu.completed ? "Done" : isOverdue ? "Overdue" : "Pending"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Follow-ups ({followUps.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Schedule"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input name="title" className="h-8" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Due Date</Label>
                  <Input name="dueDate" type="datetime-local" className="h-8" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Assigned To</Label>
                  <select name="assignedToId" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm" required>
                    <option value="">Select staff</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              {!leadId && (
                <div className="space-y-1">
                  <Label className="text-xs">Lead</Label>
                  <Input name="leadId" className="h-8" placeholder="Lead ID" required />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <textarea name="description" rows={2} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {overdue.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 mb-2">Overdue ({overdue.length})</p>
          <div className="space-y-2">{overdue.map(renderFollowUp)}</div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 mb-2">Upcoming ({pending.length})</p>
          <div className="space-y-2">{pending.map(renderFollowUp)}</div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-2">Completed ({completed.length})</p>
          <div className="space-y-2">{completed.map(renderFollowUp)}</div>
        </div>
      )}

      {followUps.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-4">No follow-ups scheduled.</p>
      )}
    </div>
  );
}
