import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MessageForm } from "@/components/messages/message-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "New Message — Bayview Hotel" };

interface NewMessagePageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewMessagePage({ searchParams }: NewMessagePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const params = await searchParams;

  const customers = await db.customer.findMany({
    select: { id: true, name: true, phone: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Message"
        description="Send a single SMS (via Arkesel) or Email message directly to a customer."
      />
      <MessageForm
        mode="create"
        customers={customers}
        defaultValues={params.customerId ? { customerId: params.customerId } : {}}
      />
    </div>
  );
}
