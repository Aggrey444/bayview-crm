import { auth } from "@/lib/auth";
import { buildCtx } from "@/lib/queries/access";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MessageForm } from "@/components/messages/message-form";
import { getMessageById } from "@/lib/queries/messages";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth();
  const { id } = await params;
  const message = await getMessageById(id, buildCtx(session?.user ?? { id: "", role: null }));
  return { title: message ? "Edit Message" : "Message Not Found" };
}

export default async function EditMessagePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const ctx = buildCtx(session.user);

  const { id } = await params;
  const message = await getMessageById(id, ctx);
  if (!message) notFound();

  const customers = await db.customer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Message" description="Update message details." />
      <MessageForm
        mode="edit"
        messageId={message.id}
        customers={customers}
        defaultValues={{
          customerId: message.customerId,
          channel: message.channel,
          subject: message.subject || "",
          body: message.body,
          sentAt: message.sentAt ? new Date(message.sentAt).toISOString().split("T")[0] : "",
        }}
      />
    </div>
  );
}
