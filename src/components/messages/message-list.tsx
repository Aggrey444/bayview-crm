"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type Message = {
  id: string;
  subject: string | null;
  body: string;
  channel: string;
  sentAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string | null };
  sender: { id: string; name: string | null } | null;
};

interface MessageListProps {
  initialMessages: Message[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialQuery: string;
  initialChannel: string;
}

const channelColors: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-700",
  SMS: "bg-emerald-100 text-emerald-700",
  PHONE: "bg-amber-100 text-amber-700",
  IN_PERSON: "bg-violet-100 text-violet-700",
  OTHER: "bg-zinc-100 text-zinc-600",
};

const channels = ["", "EMAIL", "SMS", "PHONE", "IN_PERSON", "OTHER"];
const channelLabels: Record<string, string> = {
  "": "All",
  EMAIL: "Email",
  SMS: "SMS",
  PHONE: "Phone",
  IN_PERSON: "In-Person",
  OTHER: "Other",
};

export function MessageList({
  initialMessages,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialQuery,
  initialChannel,
}: MessageListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState(initialMessages);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [query, setQuery] = useState(initialQuery);
  const [channel, setChannel] = useState(initialChannel);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(
    async (q: string, ch: string, p: number) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (ch) params.set("channel", ch);
      params.set("page", String(p));
      params.set("limit", "10");

      try {
        const res = await fetch(`/api/messages?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMessages(query, channel, page);
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      if (channel) params.set("channel", channel);
      else params.delete("channel");
      params.set("page", String(page));
      router.replace(`?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, channel, page, fetchMessages, router, searchParams]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <Button
            key={ch}
            variant={channel === ch ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setChannel(ch);
              setPage(1);
            }}
          >
            {channelLabels[ch]}
          </Button>
        ))}
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search by subject or body..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-zinc-500">
        {total} message{total !== 1 ? "s" : ""} found
      </p>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="text-sm text-zinc-500">
              {query || channel ? "No messages match your filters." : "No messages yet."}
            </p>
            {!query && !channel && (
              <Link href="/dashboard/messages/new" className="text-sm text-blue-600 hover:underline">
                Send your first message
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <Link key={m.id} href={`/dashboard/messages/${m.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {m.subject || "(No subject)"}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${channelColors[m.channel] || ""}`}
                      >
                        {m.channel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>{m.customer.name}</span>
                      {m.sender && <span className="text-zinc-400">by {m.sender.name}</span>}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    {m.sentAt && <span>Sent {formatDateTime(m.sentAt)}</span>}
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
