import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MessageForm } from "@/components/messages/message-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "New Message" };

export default async function NewMessagePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [customers, campaigns] = await Promise.all([
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Message" description="Send a new message to a customer." />
      <MessageForm mode="create" customers={customers} campaigns={campaigns} />
    </div>
  );
}
