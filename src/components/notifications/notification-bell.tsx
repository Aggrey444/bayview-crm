"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  NEW_LEAD: "📋",
  LEAD_ASSIGNED: "👤",
  FOLLOW_UP_DUE: "⏰",
  FOLLOW_UP_OVERDUE: "⚠️",
  BOOKING_CREATED: "📅",
  BOOKING_CONFIRMED: "✅",
  PAYMENT_SUCCESSFUL: "💰",
  PAYMENT_FAILED: "❌",
  CUSTOM: "🔔",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=15");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      console.error("Failed to load notifications");
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", {
      method: "POST",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/5 transition-all duration-200"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl border border-zinc-200/80 bg-white shadow-elevated z-50 overflow-hidden dark:bg-zinc-900 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/60 dark:border-white/5">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <Bell className="h-4 w-4 text-zinc-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No notifications</p>
                  <p className="mt-0.5 text-xs text-zinc-500">You&apos;re all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-zinc-100 dark:border-white/5 last:border-0 hover:bg-zinc-50/80 dark:hover:bg-white/5 ${
                      !n.read ? "bg-amber-50/50 dark:bg-amber-400/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                      if (n.link) {
                        setOpen(false);
                        window.location.href = n.link;
                      }
                    }}
                  >
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">{n.message}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-sm shadow-amber-500/50" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
