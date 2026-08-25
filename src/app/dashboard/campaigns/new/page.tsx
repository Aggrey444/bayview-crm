import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export const metadata = { title: "New Campaign" };

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <PageHeader title="New Campaign" description="Create a new marketing campaign." />
      <CampaignForm mode="create" />
    </div>
  );
}
