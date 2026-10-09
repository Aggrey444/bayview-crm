"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, AlertCircle, CheckCircle2, Send } from "lucide-react";

export type CustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

interface MessageFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  messageId?: string;
  customers: CustomerOption[];
}

export function MessageForm({
  mode,
  defaultValues = {},
  messageId,
  customers,
}: MessageFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    (defaultValues.customerId as string) || ""
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    (defaultValues.channel as string) || "SMS"
  );
  const [bodyText, setBodyText] = useState<string>(
    (defaultValues.body as string) || ""
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // SMS character & page calculation
  const charCount = bodyText.length;
  const smsPages = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const sentAtRaw = fd.get("sentAt") as string;

    if (selectedChannel === "SMS" && selectedCustomer && !selectedCustomer.phone?.trim()) {
      setError(`Customer "${selectedCustomer.name}" does not have a phone number on file. Please add their phone number first.`);
      setLoading(false);
      return;
    }

    const body = {
      customerId: selectedCustomerId,
      channel: selectedChannel,
      subject: fd.get("subject") as string,
      body: bodyText.trim(),
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
        setError(data.error || "Failed to process message.");
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
      <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
        <CardContent className="space-y-5 pt-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Customer selector */}
            <div className="space-y-1.5">
              <Label htmlFor="customerId" className="text-xs font-semibold">
                Customer <span className="text-red-500">*</span>
              </Label>
              <select
                id="customerId"
                name="customerId"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                required
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>

              {/* Customer contact status info */}
              {selectedCustomer && (
                <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500">
                  {selectedCustomer.phone ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      No phone on file
                    </span>
                  )}
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Mail className="h-3 w-3" />
                      {selectedCustomer.email}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Channel selector */}
            <div className="space-y-1.5">
              <Label htmlFor="channel" className="text-xs font-semibold">
                Channel <span className="text-red-500">*</span>
              </Label>
              <select
                id="channel"
                name="channel"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="SMS">SMS (Powered by Arkesel)</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone (Call Log)</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="OTHER">Other</option>
              </select>

              {selectedChannel === "SMS" && (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
                  ⚡ Will be delivered via Arkesel SMS gateway directly to guest&apos;s phone.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold">
                Subject {selectedChannel === "SMS" ? "(Optional)" : ""}
              </Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={defaultValues.subject as string}
                placeholder={selectedChannel === "SMS" ? "e.g. Booking Confirmation SMS" : "Email Subject"}
                maxLength={200}
                className="h-10 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sentAt" className="text-xs font-semibold">
                Send / Scheduled Date
              </Label>
              <Input
                id="sentAt"
                name="sentAt"
                type="date"
                defaultValue={defaultSentAt}
                className="h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="body" className="text-xs font-semibold">
                Message Body <span className="text-red-500">*</span>
              </Label>
              {selectedChannel === "SMS" && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                  <span className={charCount > 160 ? "text-amber-600 font-semibold" : ""}>
                    {charCount} / {smsPages * (smsPages > 1 ? 153 : 160)}
                  </span>
                  <span>({smsPages} SMS page{smsPages !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>
            <textarea
              id="body"
              name="body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              maxLength={selectedChannel === "SMS" ? 1600 : 10000}
              required
              placeholder={
                selectedChannel === "SMS"
                  ? "Type your SMS message here..."
                  : "Type your message content here..."
              }
              className="flex w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCustomerId || !bodyText.trim()}
            className={`${
              selectedChannel === "SMS"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            } rounded-xl px-5 shadow-sm`}
          >
            <Send className={`mr-2 h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
            {loading
              ? "Sending..."
              : mode === "edit"
                ? "Save Changes"
                : selectedChannel === "SMS"
                  ? "Send SMS (Arkesel)"
                  : "Send Message"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
