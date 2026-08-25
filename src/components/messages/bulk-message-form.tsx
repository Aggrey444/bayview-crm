"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Service = { id: string; name: string };
type Campaign = { id: string; name: string };

interface BulkMessageFormProps {
  services: Service[];
  campaigns: Campaign[];
}

export function BulkMessageForm({ services, campaigns }: BulkMessageFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [success, setSuccess] = useState<{ sent: number } | null>(null);

  useEffect(() => {
    if (!selectedServiceId) {
      setCustomerCount(null);
      return;
    }
    setCountLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers?serviceId=${selectedServiceId}&limit=1`
        );
        if (res.ok) {
          const data = await res.json();
          setCustomerCount(data.total);
        }
      } finally {
        setCountLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedServiceId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const body = {
      serviceId: fd.get("serviceId") as string,
      campaignId: fd.get("campaignId") as string,
      channel: fd.get("channel") as string,
      subject: fd.get("subject") as string,
      body: fd.get("body") as string,
    };

    try {
      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await res.json();
      setSuccess({ sent: result.sent });
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">Messages Sent Successfully</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {success.sent} message{success.sent !== 1 ? "s" : ""} sent to customers in the selected service group.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSuccess(null)}>
              Send Another
            </Button>
            <Button onClick={() => router.push("/dashboard/messages")}>
              View Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Compose Bulk Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serviceId">
                Service Group <span className="text-red-500">*</span>
              </Label>
              <select
                id="serviceId"
                name="serviceId"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select a service group</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {countLoading && (
                <p className="text-xs text-zinc-400">Counting customers...</p>
              )}
              {customerCount !== null && !countLoading && (
                <p className="text-xs text-zinc-500">
                  {customerCount} customer{customerCount !== 1 ? "s" : ""} will receive this message
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">
                Channel <span className="text-red-500">*</span>
              </Label>
              <select
                id="channel"
                name="channel"
                defaultValue="EMAIL"
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PHONE">Phone</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign (optional)</Label>
            <select
              id="campaignId"
              name="campaignId"
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Optional message subject"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">
              Message Body <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="body"
              name="body"
              rows={6}
              maxLength={10000}
              required
              placeholder="Type your message here..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedServiceId || customerCount === 0}>
            {loading
              ? "Sending..."
              : customerCount
                ? `Send to ${customerCount} Customer${customerCount !== 1 ? "s" : ""}`
                : "Send Messages"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
