import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { BulkMessageForm } from "@/components/messages/bulk-message-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "Bulk Message" };

export default async function BulkMessagePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const services = await db.service.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Message"
        description="Send a message to all customers subscribed to a service."
      />
      <BulkMessageForm services={services} />
    </div>
  );
}
