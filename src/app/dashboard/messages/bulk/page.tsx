import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { BulkMessageForm } from "@/components/messages/bulk-message-form";
import { db } from "@/lib/prisma";
import { getArkeselConfig } from "@/lib/arkesel";

export const metadata = { title: "Bulk Message — Bayview Hotel" };

export default async function BulkMessagePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [services, arkeselConfig] = await Promise.all([
    db.service.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getArkeselConfig(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Messaging & SMS"
        description="Broadcast SMS and Email notifications to customers, leads, or service groups via Arkesel SMS gateway."
      />
      <BulkMessageForm
        services={services}
        initialConfig={{
          apiKey: arkeselConfig.apiKey,
          senderId: arkeselConfig.senderId,
          sandbox: arkeselConfig.sandbox,
          isConfigured: arkeselConfig.isConfigured,
        }}
      />
    </div>
  );
}
