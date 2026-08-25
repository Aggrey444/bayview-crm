"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface CampaignFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  campaignId?: string;
}

export function CampaignForm({
  mode,
  defaultValues = {},
  campaignId,
}: CampaignFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      status: fd.get("status") as string,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      budget: fd.get("budget") as string,
      notes: fd.get("notes") as string,
    };

    try {
      const url = mode === "edit" ? `/api/campaigns/${campaignId}` : "/api/campaigns";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const campaign = await res.json();
      router.push(`/dashboard/campaigns/${campaign.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" defaultValue={defaultValues.name as string} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={(defaultValues.status as string) || "DRAFT"} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" defaultValue={defaultValues.description as string} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={defaultValues.startDate as string} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={defaultValues.endDate as string} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input id="budget" name="budget" type="number" step="0.01" min="0" defaultValue={defaultValues.budget as string} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" defaultValue={defaultValues.notes as string} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Campaign"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
