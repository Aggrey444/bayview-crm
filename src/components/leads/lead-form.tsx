"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type Option = { id: string; name: string };

interface LeadFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  leadId?: string;
  sources: Option[];
  statuses: Option[];
  staff: Option[];
  campaigns: Option[];
  customers: Option[];
}

export function LeadForm({
  mode,
  defaultValues = {},
  leadId,
  sources,
  statuses,
  staff,
  campaigns,
  customers,
}: LeadFormProps) {
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
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      company: fd.get("company") as string,
      service: fd.get("service") as string,
      sourceId: fd.get("sourceId") as string,
      statusId: fd.get("statusId") as string,
      assignedToId: fd.get("assignedToId") as string,
      customerId: fd.get("customerId") as string,
      campaignId: fd.get("campaignId") as string,
      priority: fd.get("priority") as string,
      notes: fd.get("notes") as string,
      budget: fd.get("budget") as string,
      expectedValue: fd.get("expectedValue") as string,
      utmSource: fd.get("utmSource") as string,
      utmMedium: fd.get("utmMedium") as string,
      utmCampaign: fd.get("utmCampaign") as string,
      utmContent: fd.get("utmContent") as string,
      utmTerm: fd.get("utmTerm") as string,
    };

    const payload = {
      ...body,
      budget: body.budget ? Number(body.budget) : null,
      expectedValue: body.expectedValue ? Number(body.expectedValue) : null,
    };

    try {
      const url = mode === "edit" ? `/api/leads/${leadId}` : "/api/leads";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const lead = await res.json();
      router.push(`/dashboard/leads/${lead.id}`);
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
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={defaultValues.email as string} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={defaultValues.phone as string} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" defaultValue={defaultValues.company as string} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service">Service Interested In</Label>
              <Input id="service" name="service" defaultValue={defaultValues.service as string} placeholder="e.g. Room booking, Conference hall" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Linked Customer</Label>
              <select id="customerId" name="customerId" defaultValue={defaultValues.customerId as string} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">None</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sourceId">Lead Source</Label>
              <select id="sourceId" name="sourceId" defaultValue={defaultValues.sourceId as string} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select source</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusId">Status</Label>
              <select id="statusId" name="statusId" defaultValue={defaultValues.statusId as string} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select status</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue={defaultValues.priority as string || "MEDIUM"} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned Staff</Label>
              <select id="assignedToId" name="assignedToId" defaultValue={defaultValues.assignedToId as string} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign</Label>
              <select id="campaignId" name="campaignId" defaultValue={defaultValues.campaignId as string} className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">None</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input id="budget" name="budget" type="number" step="0.01" min="0" defaultValue={defaultValues.budget as string} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedValue">Expected Value ($)</Label>
              <Input id="expectedValue" name="expectedValue" type="number" step="0.01" min="0" defaultValue={defaultValues.expectedValue as string} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" defaultValue={defaultValues.notes as string} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="rounded-md border border-dashed p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">UTM Tracking (auto-captured from public forms)</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="utmSource">UTM Source</Label>
                <Input id="utmSource" name="utmSource" defaultValue={defaultValues.utmSource as string} placeholder="e.g. facebook, google" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utmMedium">UTM Medium</Label>
                <Input id="utmMedium" name="utmMedium" defaultValue={defaultValues.utmMedium as string} placeholder="e.g. cpc, email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utmCampaign">UTM Campaign</Label>
                <Input id="utmCampaign" name="utmCampaign" defaultValue={defaultValues.utmCampaign as string} placeholder="e.g. summer2026" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="utmContent">UTM Content</Label>
                <Input id="utmContent" name="utmContent" defaultValue={defaultValues.utmContent as string} placeholder="e.g. banner_ad" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utmTerm">UTM Term</Label>
                <Input id="utmTerm" name="utmTerm" defaultValue={defaultValues.utmTerm as string} placeholder="e.g. hotel booking" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Lead"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
