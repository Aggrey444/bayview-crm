import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations/message";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/messages/[id]">
) {
  const authResult = await requirePermission("messages.view");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  const message = await db.message.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      sender: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/messages/[id]">
) {
  try {
    const authResult = await requirePermission("messages.edit");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = messageSchema.parse(body);

    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const cleaned = {
      customerId: data.customerId,
      campaignId: data.campaignId || null,
      channel: data.channel,
      subject: data.subject || null,
      body: data.body,
      sentAt: data.sentAt || null,
      assignedToId: (data as Record<string, unknown>).assignedToId as string | undefined || null,
    };

    const message = await db.message.update({ where: { id }, data: cleaned });

    await auditLog({
      userId: authResult.user.id,
      action: "MESSAGE_UPDATED",
      entity: "Message",
      entityId: id,
      oldValues: existing,
      newValues: cleaned,
      request,
    });

    return NextResponse.json(message);
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/messages/[id]">
) {
  try {
    const authResult = await requirePermission("messages.delete");
    if ("error" in authResult) return authResult.error;

    const { id } = await params;

    const existing = await db.message.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await db.message.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "MESSAGE_DELETED",
      entity: "Message",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ message: "Message deleted" });
  } catch (error) {
    console.error("DELETE /api/messages/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
