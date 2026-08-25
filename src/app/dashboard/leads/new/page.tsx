import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { db } from "@/lib/prisma";

export const metadata = { title: "New Lead" };

export default async function NewLeadPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [sources, statuses, staff, campaigns, customers] = await Promise.all([
    db.leadSource.findMany({ orderBy: { name: "asc" } }),
    db.leadStatus.findMany({ orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }).then((u) => u.map((s) => ({ id: s.id, name: s.name || "Unknown" }))),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Lead" description="Create a new lead in the pipeline." />
      <LeadForm mode="create" sources={sources} statuses={statuses} staff={staff} campaigns={campaigns} customers={customers} />
    </div>
  );
}
