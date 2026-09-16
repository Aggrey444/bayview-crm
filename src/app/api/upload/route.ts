import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if ("error" in authResult && authResult.error) return authResult.error

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name) || ".jpg"
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    const filePath = path.join(uploadDir, safeName)

    await writeFile(filePath, buffer)

    const url = `/uploads/${safeName}`
    return NextResponse.json({ url, success: true })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
