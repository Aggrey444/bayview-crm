import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const bulkMessageSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  campaignId: z.string().optional().or(z.literal("")),
  channel: z.enum(["EMAIL", "SMS", "PHONE", "IN_PERSON", "OTHER"]),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required").max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("messages.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = bulkMessageSchema.parse(body);

    const customers = await db.customer.findMany({
      where: {
        services: { some: { id: data.serviceId } },
      },
      select: { id: true, name: true, email: true },
    });

    if (customers.length === 0) {
      return NextResponse.json(
        { error: "No customers found subscribed to this service." },
        { status: 404 }
      );
    }

    const messages = await Promise.all(
      customers.map((customer) =>
        db.message.create({
          data: {
            customerId: customer.id,
            senderId: authResult.user.id,
            campaignId: data.campaignId || null,
            channel: data.channel,
            subject: data.subject || null,
            body: data.body,
            sentAt: new Date(),
          },
        })
      )
    );

    await auditLog({
      userId: authResult.user.id,
      action: "BULK_MESSAGE_SENT",
      entity: "Message",
      entityId: data.serviceId,
      newValues: {
        serviceId: data.serviceId,
        channel: data.channel,
        recipientCount: customers.length,
        campaignId: data.campaignId || null,
      },
      request,
    });

    return NextResponse.json({
      sent: messages.length,
      recipients: customers.map((c) => ({ id: c.id, name: c.name })),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/messages/bulk error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
