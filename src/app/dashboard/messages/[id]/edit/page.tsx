import { auth } from "@/lib/auth";
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
  const { id } = await params;
  const message = await getMessageById(id);
  return { title: message ? "Edit Message" : "Message Not Found" };
}

export default async function EditMessagePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const message = await getMessageById(id);
  if (!message) notFound();

  const [customers, campaigns] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Message" description="Update message details." />
      <MessageForm
        mode="edit"
        messageId={message.id}
        customers={customers}
        campaigns={campaigns}
        defaultValues={{
          customerId: message.customerId,
          campaignId: message.campaignId || "",
          channel: message.channel,
          subject: message.subject || "",
          body: message.body,
          sentAt: message.sentAt ? new Date(message.sentAt).toISOString().split("T")[0] : "",
        }}
      />
    </div>
  );
}
