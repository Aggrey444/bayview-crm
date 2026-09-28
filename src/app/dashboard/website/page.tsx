import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { WebsiteManager } from "@/components/website/website-manager"
import { getWebsiteContent } from "@/lib/website-content"

export const metadata = { title: "Website Management - Bayview Village CRM" }

export default async function WebsiteManagementPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const isAdmin = session.user.role?.name?.toLowerCase() === "admin"
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">Only administrator accounts can access Website Management.</p>
      </div>
    )
  }

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
