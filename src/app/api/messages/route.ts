import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { messageSchema, messageSearchSchema } from "@/lib/validations/message";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("messages.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const params = messageSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    channel: searchParams.get("channel") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    campaignId: searchParams.get("campaignId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

  const { q, channel, customerId, campaignId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }
  if (channel) where.channel = channel;
  if (customerId) where.customerId = customerId;
  if (campaignId) where.campaignId = campaignId;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        sender: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.message.count({ where }),
  ]);

  return NextResponse.json({
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("messages.create");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = messageSchema.parse(body);

    const cleaned = {
      customerId: data.customerId,
      campaignId: data.campaignId || null,
      channel: data.channel,
      subject: data.subject || null,
      body: data.body,
      sentAt: data.sentAt || null,
      senderId: authResult.user.id,
      assignedToId: (data as Record<string, unknown>).assignedToId as string | undefined || null,
    };

    const message = await db.message.create({ data: cleaned });

    await auditLog({
      userId: authResult.user.id,
      action: "MESSAGE_CREATED",
      entity: "Message",
      entityId: message.id,
      newValues: cleaned,
      request,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
