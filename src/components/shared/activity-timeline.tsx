"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MessageSquare,
  Users,
  FileText,
  StickyNote,
  Camera,
  MoreHorizontal,
} from "lucide-react";

type Activity = {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  createdAt: Date;
  user: { id: string; name: string | null };
  lead?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
};

const typeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone className="h-4 w-4" />,
  WHATSAPP: <MessageSquare className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  MEETING: <Users className="h-4 w-4" />,
  NOTE: <StickyNote className="h-4 w-4" />,
  QUOTE: <FileText className="h-4 w-4" />,
  PROPERTY_VISIT: <Camera className="h-4 w-4" />,
  OTHER: <MoreHorizontal className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-600",
  WHATSAPP: "bg-green-100 text-green-600",
  SMS: "bg-purple-100 text-purple-600",
  EMAIL: "bg-amber-100 text-amber-600",
  MEETING: "bg-indigo-100 text-indigo-600",
  NOTE: "bg-zinc-100 text-zinc-600",
  QUOTE: "bg-orange-100 text-orange-600",
  PROPERTY_VISIT: "bg-teal-100 text-teal-600",
  OTHER: "bg-zinc-100 text-zinc-500",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-zinc-500 py-4 text-center">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, i) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColors[activity.type] || typeColors.OTHER}`}>
              {typeIcons[activity.type] || typeIcons.OTHER}
            </div>
            {i < activities.length - 1 && <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700 my-1" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{activity.subject}</span>
              <Badge variant="secondary" className="text-[10px]">{activity.type.replace("_", " ")}</Badge>
            </div>
            {activity.description && (
              <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{activity.description}</p>
            )}
            <p className="text-[10px] text-zinc-400 mt-1">
              {activity.user.name} &middot; {formatDateTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
