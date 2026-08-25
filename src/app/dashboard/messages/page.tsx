import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { MessageList } from "@/components/messages/message-list";
import { getMessages } from "@/lib/queries/messages";
import { Plus, Send } from "lucide-react";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; channel?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("messages.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const data = await getMessages({
    q: params.q || "",
    channel: (params.channel as "" | "EMAIL" | "SMS" | "PHONE" | "IN_PERSON" | "OTHER") || undefined,
    page: Number(params.page) || 1,
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Send and track messages to customers."
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/messages/bulk" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Send className="mr-2 h-4 w-4" /> Bulk Message
            </Link>
            <Link href="/dashboard/messages/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="mr-2 h-4 w-4" /> New Message
            </Link>
          </div>
        }
      />

      <MessageList
        initialMessages={data.messages.map((m) => ({
          ...m,
          sentAt: m.sentAt?.toISOString() || null,
          createdAt: m.createdAt.toISOString(),
          customer: m.customer,
          sender: m.sender,
        }))}
        initialTotal={data.total}
        initialPage={data.page}
        initialTotalPages={data.totalPages}
        initialQuery={params.q || ""}
        initialChannel={params.channel || ""}
      />
    </div>
  );
}
