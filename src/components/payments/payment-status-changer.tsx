"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUCCESSFUL: "Successful",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESSFUL: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-zinc-100 text-zinc-600",
};

interface PaymentStatusChangerProps {
  paymentId: string;
  currentStatus: string;
}

export function PaymentStatusChanger({ paymentId, currentStatus }: PaymentStatusChangerProps) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleUpdate(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Payment Status</CardTitle>
          {saved && <span className="text-xs text-emerald-600">Updated!</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={s === status ? "default" : "outline"}
              size="sm"
              onClick={() => handleUpdate(s)}
              disabled={saving || s === status}
              className="text-xs"
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
