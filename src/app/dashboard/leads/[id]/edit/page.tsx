import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { getLeadById } from "@/lib/queries/leads";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lead = await getLeadById(id);
  return { title: lead ? `Edit ${lead.name}` : "Lead Not Found" };
}

export default async function EditLeadPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const [sources, statuses, staff, campaigns, customers] = await Promise.all([
    db.leadSource.findMany({ orderBy: { name: "asc" } }),
    db.leadStatus.findMany({ orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }).then((u) => u.map((s) => ({ id: s.id, name: s.name || "Unknown" }))),
    db.campaign.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${lead.name}`} description="Update lead details." />
      <LeadForm
        mode="edit"
        leadId={lead.id}
        sources={sources}
        statuses={statuses}
        staff={staff}
        campaigns={campaigns}
        customers={customers}
        defaultValues={{
          name: lead.name,
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          service: lead.service || "",
          sourceId: lead.sourceId || "",
          statusId: lead.statusId || "",
          campaignId: lead.campaignId || "",
          assignedToId: lead.assignedToId || "",
          customerId: lead.customerId || "",
          priority: lead.priority,
          notes: lead.notes || "",
          budget: lead.budget?.toString() || "",
          expectedValue: lead.expectedValue?.toString() || "",
        }}
      />
    </div>
  );
}
