import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { db } from "@/lib/prisma";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id }, select: { name: true } });
  return { title: campaign ? `Edit Campaign` : "Campaign Not Found" };
}

export default async function EditCampaignPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Campaign" description="Update campaign details." />
      <CampaignForm
        mode="edit"
        campaignId={campaign.id}
        defaultValues={{
          name: campaign.name,
          description: campaign.description || "",
          status: campaign.status,
          startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "",
          endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
          budget: campaign.budget ? Number(campaign.budget) : "",
          notes: campaign.notes || "",
        }}
      />
    </div>
  );
}
