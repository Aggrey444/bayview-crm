"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type ActivityOption = { id: string; name: string };

interface AddActivityFormProps {
  leadId?: string;
  customerId?: string;
  onSuccess: () => void;
}

export function AddActivityForm({ leadId, customerId, onSuccess }: AddActivityFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + Log Activity
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      type: fd.get("type") as string,
      subject: fd.get("subject") as string,
      description: fd.get("description") as string,
      leadId: leadId || undefined,
      customerId: customerId || undefined,
    };

    try {
      const res = await fetch("/api/activities", {
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

      setOpen(false);
      setLoading(false);
      onSuccess();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="act-type" className="text-xs">Type</Label>
              <select id="act-type" name="type" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm" required>
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="NOTE">Note</option>
                <option value="QUOTE">Quote</option>
                <option value="PROPERTY_VISIT">Property Visit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="act-subject" className="text-xs">Subject</Label>
              <Input id="act-subject" name="subject" className="h-8" required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="act-desc" className="text-xs">Description (optional)</Label>
            <textarea id="act-desc" name="description" rows={2} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
