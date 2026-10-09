import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { messageSchema, messageSearchSchema } from "@/lib/validations/message";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { buildCtx, scopeFilter, mergeScope } from "@/lib/queries/access";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("messages.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const params = messageSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    channel: searchParams.get("channel") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

  const { q, channel, customerId, page, limit } = params;
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

  const ctx = buildCtx(authResult.user);
  const finalWhere = mergeScope(where, scopeFilter(ctx, "message"));

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        sender: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.message.count({ where: finalWhere }),
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

    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, name: true, phone: true, email: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Selected customer not found" }, { status: 404 });
    }

    let sentAt = data.sentAt ? new Date(data.sentAt) : null;

    // If channel is SMS, send live via Arkesel
    if (data.channel === "SMS") {
      if (!customer.phone) {
        return NextResponse.json(
          { error: `Customer "${customer.name}" does not have a phone number on file. Please add a phone number to send SMS.` },
          { status: 400 }
        );
      }

      const { sendArkeselSms } = await import("@/lib/arkesel");
      const smsResult = await sendArkeselSms({
        recipients: [customer.phone],
        message: data.body,
      });

      if (!smsResult.success) {
        return NextResponse.json(
          { error: `Failed to send SMS via Arkesel: ${smsResult.message}` },
          { status: 400 }
        );
      }

      sentAt = new Date();
    } else if (!sentAt) {
      sentAt = new Date();
    }

    const cleaned = {
      customerId: data.customerId,
      channel: data.channel,
      subject: data.subject || null,
      body: data.body,
      sentAt,
      senderId: authResult.user.id,
      assignedToId: ((data as Record<string, unknown>).assignedToId as string | undefined) || null,
    };

    const message = await db.message.create({
      data: cleaned,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        sender: { select: { id: true, name: true } },
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "MESSAGE_CREATED",
      entity: "Message",
      entityId: message.id,
      newValues: {
        ...cleaned,
        channel: data.channel,
        customerPhone: customer.phone,
      },
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
