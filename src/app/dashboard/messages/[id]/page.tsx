import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getMessageById } from "@/lib/queries/messages";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { MessageActions } from "@/components/messages/message-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const message = await getMessageById(id);
  return { title: message ? `Message — ${message.subject || "No Subject"}` : "Message Not Found" };
}

const channelColors: Record<string, string> = {
  EMAIL: "bg-blue-100 text-blue-700",
  SMS: "bg-emerald-100 text-emerald-700",
  PHONE: "bg-amber-100 text-amber-700",
  IN_PERSON: "bg-violet-100 text-violet-700",
  OTHER: "bg-zinc-100 text-zinc-600",
};

export default async function MessageDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const message = await getMessageById(id);
  if (!message) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={message.subject || "No Subject"}
        description={`Message to ${message.customer.name}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/dashboard/messages/${message.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </Link>
            <MessageActions messageId={message.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Channel</p>
              <Badge variant="secondary" className={`text-[10px] ${channelColors[message.channel] || ""}`}>
                {message.channel}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Customer</p>
              <Link href={`/dashboard/customers/${message.customer.id}`} className="text-sm font-medium hover:underline">
                {message.customer.name}
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Sender</p>
              <p className="text-sm font-medium">{message.sender?.name || "System"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Sent At</p>
              <p className="text-sm font-medium">{message.sentAt ? formatDateTime(message.sentAt) : "Not sent"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {message.campaign && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <div>
              <p className="text-xs text-zinc-500">Campaign</p>
              <p className="text-sm font-medium">{message.campaign.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Message Body</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 whitespace-pre-wrap">{message.body}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 pt-4">
          <div>
            <p className="text-xs text-zinc-500">Created</p>
            <p className="text-sm font-medium">{formatDateTime(message.createdAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
