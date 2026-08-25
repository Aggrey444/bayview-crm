"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string | null };

interface LeadAssignerProps {
  leadId: string;
  currentAssignedId: string | null;
  staff: Option[];
}

export function LeadAssigner({ leadId, currentAssignedId, staff }: LeadAssignerProps) {
  const [assignedToId, setAssignedToId] = useState(currentAssignedId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!assignedToId || assignedToId === currentAssignedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Assign Staff</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-3">
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button size="sm" onClick={handleSave} disabled={saving || assignedToId === currentAssignedId}>
          {saving ? "Saving..." : saved ? "Saved!" : "Update"}
        </Button>
      </CardContent>
    </Card>
  );
}
