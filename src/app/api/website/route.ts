import { NextRequest, NextResponse } from "next/server"
import { getWebsiteContent, saveWebsiteContent, type WebsiteContent } from "@/lib/website-content"
import { requireAdmin } from "@/lib/auth-helpers"
import { auditLog } from "@/lib/audit"

export async function GET() {
  const content = await getWebsiteContent()
  return NextResponse.json(content)
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult.error) return authResult.error

  try {
    const body = (await request.json()) as WebsiteContent
    await saveWebsiteContent(body)

    await auditLog({
      userId: authResult.user.id,
      action: "SETTINGS_UPDATED",
      entity: "WebsiteContent",
      entityId: "website_content",
      request,
    })

    return NextResponse.json({ success: true, content: body })
  } catch (error) {
    console.error("PUT /api/website error:", error)
    return NextResponse.json({ error: "Failed to save website content" }, { status: 500 })
  }
}
