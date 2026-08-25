"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
}

export function MessageActions({ messageId }: MessageActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/messages");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
    </Button>
  );
}
