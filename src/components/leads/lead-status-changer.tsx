"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string };

interface LeadStatusChangerProps {
  leadId: string;
  currentStatusId: string | null;
  statuses: Option[];
}

export function LeadStatusChanger({ leadId, currentStatusId, statuses }: LeadStatusChangerProps) {
  const [statusId, setStatusId] = useState(currentStatusId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!statusId || statusId === currentStatusId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
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
      <CardHeader><CardTitle className="text-sm">Change Status</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-3">
        <select
          value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
          className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button size="sm" onClick={handleSave} disabled={saving || statusId === currentStatusId}>
          {saving ? "Saving..." : saved ? "Saved!" : "Update"}
        </Button>
      </CardContent>
    </Card>
  );
}
