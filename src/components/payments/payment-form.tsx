"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type BookingOption = { id: string; propertyName: string; customer: { name: string } };

interface PaymentFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  paymentId?: string;
  bookings: BookingOption[];
}

export function PaymentForm({
  mode,
  defaultValues = {},
  paymentId,
  bookings,
}: PaymentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      bookingId: fd.get("bookingId") as string,
      amount: Number(fd.get("amount") as string),
      currency: fd.get("currency") as string,
      method: fd.get("method") as string,
      status: fd.get("status") as string,
      reference: fd.get("reference") as string,
      paymentProvider: fd.get("paymentProvider") as string,
      paymentDate: fd.get("paymentDate") as string,
      notes: fd.get("notes") as string,
    };

    const payload = {
      ...body,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
    };

    try {
      const url = mode === "edit" ? `/api/payments/${paymentId}` : "/api/payments";
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

      const payment = await res.json();
      router.push(`/dashboard/payments/${payment.id}`);
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
              <Label htmlFor="bookingId">Booking <span className="text-red-500">*</span></Label>
              <select
                id="bookingId"
                name="bookingId"
                defaultValue={defaultValues.bookingId as string}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select booking</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.propertyName} — {b.customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={defaultValues.amount as string}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={(defaultValues.currency as string) || "USD"}
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                name="method"
                defaultValue={defaultValues.method as string || "CASH"}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={defaultValues.status as string || "PENDING"}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PENDING">Pending</option>
                <option value="SUCCESSFUL">Successful</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reference">Payment Reference</Label>
              <Input
                id="reference"
                name="reference"
                defaultValue={defaultValues.reference as string}
                placeholder="e.g. TXN-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentProvider">Payment Provider</Label>
              <Input
                id="paymentProvider"
                name="paymentProvider"
                defaultValue={defaultValues.paymentProvider as string}
                placeholder="e.g. Stripe, PayPal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={defaultValues.paymentDate as string}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues.notes as string}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Record Payment"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
