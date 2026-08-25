import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const userId = authResult.user.id;
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

  const where = { userId, ...(unreadOnly ? { read: false } : {}) };

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const { type, title, message, link } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: { userId: authResult.user.id, type: type || "CUSTOM", title, message, link },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
