import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { WebsiteManager } from "@/components/website/website-manager"
import { getWebsiteContent } from "@/lib/website-content"

export const metadata = { title: "Website Management - Bayview Village CRM" }

export default async function WebsiteManagementPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const content = await getWebsiteContent()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Management"
        description="Update your public website content, services, packages, photos, and contact info in real time."
      />
      <WebsiteManager initialContent={content} />
    </div>
  )
}
