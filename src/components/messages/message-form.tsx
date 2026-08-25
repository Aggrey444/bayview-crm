"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type Option = { id: string; name: string };

interface MessageFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  messageId?: string;
  customers: Option[];
  campaigns?: Option[];
}

export function MessageForm({
  mode,
  defaultValues = {},
  messageId,
  customers,
  campaigns = [],
}: MessageFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const sentAtRaw = fd.get("sentAt") as string;

    const body = {
      customerId: fd.get("customerId") as string,
      campaignId: fd.get("campaignId") as string,
      channel: fd.get("channel") as string,
      subject: fd.get("subject") as string,
      body: fd.get("body") as string,
      sentAt: sentAtRaw ? new Date(sentAtRaw).toISOString() : undefined,
    };

    try {
      const url = mode === "edit" ? `/api/messages/${messageId}` : "/api/messages";
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

      const message = await res.json();
      router.push(`/dashboard/messages/${message.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const defaultSentAt = defaultValues.sentAt
    ? new Date(defaultValues.sentAt as string).toISOString().split("T")[0]
    : "";

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
              <Label htmlFor="customerId">
                Customer <span className="text-red-500">*</span>
              </Label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={defaultValues.customerId as string}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">
                Channel <span className="text-red-500">*</span>
              </Label>
              <select
                id="channel"
                name="channel"
                defaultValue={(defaultValues.channel as string) || "EMAIL"}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign</Label>
              <select
                id="campaignId"
                name="campaignId"
                defaultValue={defaultValues.campaignId as string}
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
              <Label htmlFor="sentAt">Sent At</Label>
              <Input
                id="sentAt"
                name="sentAt"
                type="date"
                defaultValue={defaultSentAt}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              defaultValue={defaultValues.subject as string}
              placeholder="Optional message subject"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">
              Body <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="body"
              name="body"
              defaultValue={defaultValues.body as string}
              rows={6}
              maxLength={10000}
              required
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
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Send Message"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
