import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { sendArkeselSms, sanitizePhoneNumbers } from "@/lib/arkesel";
import { z } from "zod";

const bulkMessageSchema = z.object({
  targetType: z.enum(["all_customers", "service", "leads", "custom"]).default("service"),
  serviceId: z.string().optional(),
  customRecipients: z.string().optional(), // Comma or newline separated numbers
  channel: z.enum(["EMAIL", "SMS", "PHONE", "IN_PERSON", "OTHER"]),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required").max(10000),
  senderId: z.string().max(11).optional(),
});

/**
 * GET preview of recipients count for selected target
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission("messages.view");
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType") || "all_customers";
    const serviceId = searchParams.get("serviceId");

    let total = 0;
    let withPhone = 0;
    let withEmail = 0;

    if (targetType === "service" && serviceId) {
      const customers = await db.customer.findMany({
        where: { services: { some: { id: serviceId } } },
        select: { id: true, phone: true, email: true },
      });
      total = customers.length;
      withPhone = customers.filter((c) => !!c.phone?.trim()).length;
      withEmail = customers.filter((c) => !!c.email?.trim()).length;
    } else if (targetType === "all_customers") {
      const customers = await db.customer.findMany({
        select: { id: true, phone: true, email: true },
      });
      total = customers.length;
      withPhone = customers.filter((c) => !!c.phone?.trim()).length;
      withEmail = customers.filter((c) => !!c.email?.trim()).length;
    } else if (targetType === "leads") {
      const leads = await db.lead.findMany({
        select: { id: true, phone: true, email: true },
      });
      total = leads.length;
      withPhone = leads.filter((l) => !!l.phone?.trim()).length;
      withEmail = leads.filter((l) => !!l.email?.trim()).length;
    }

    return NextResponse.json({
      targetType,
      total,
      withPhone,
      withEmail,
    });
  } catch (error) {
    console.error("GET /api/messages/bulk error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("messages.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = bulkMessageSchema.parse(body);

    interface RecipientItem {
      customerId?: string;
      name: string;
      phone?: string | null;
      email?: string | null;
    }

    let recipients: RecipientItem[] = [];

    if (data.targetType === "service") {
      if (!data.serviceId) {
        return NextResponse.json({ error: "Please select a service group." }, { status: 400 });
      }
      const customers = await db.customer.findMany({
        where: { services: { some: { id: data.serviceId } } },
        select: { id: true, name: true, email: true, phone: true },
      });
      recipients = customers.map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));
    } else if (data.targetType === "all_customers") {
      const customers = await db.customer.findMany({
        select: { id: true, name: true, email: true, phone: true },
      });
      recipients = customers.map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
      }));
    } else if (data.targetType === "leads") {
      const leads = await db.lead.findMany({
        select: { id: true, name: true, email: true, phone: true, customerId: true },
      });
      recipients = leads.map((l) => ({
        customerId: l.customerId || undefined,
        name: l.name,
        phone: l.phone,
        email: l.email,
      }));
    } else if (data.targetType === "custom") {
      if (!data.customRecipients?.trim()) {
        return NextResponse.json(
          { error: "Please provide at least one phone number or recipient." },
          { status: 400 }
        );
      }
      const entries = data.customRecipients
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      recipients = entries.map((entry) => ({
        name: "Guest",
        phone: entry,
        email: entry.includes("@") ? entry : null,
      }));
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found for the selected group." },
        { status: 404 }
      );
    }

    // Handle SMS channel delivery via Arkesel
    if (data.channel === "SMS") {
      const phoneRecipients = recipients.filter((r) => !!r.phone?.trim());
      if (phoneRecipients.length === 0) {
        return NextResponse.json(
          { error: "None of the recipients in the selected group have a phone number on file." },
          { status: 400 }
        );
      }

      const allPhoneStrings = phoneRecipients.map((r) => r.phone as string);
      const { valid: validPhones, invalid: invalidPhones } = sanitizePhoneNumbers(allPhoneStrings);

      if (validPhones.length === 0) {
        return NextResponse.json(
          {
            error: "No valid phone numbers found. Please ensure numbers have valid Ghana (+233) or international format.",
            invalidCount: invalidPhones.length,
          },
          { status: 400 }
        );
      }

      // Check if message has personalization variables like {name} or {first_name}
      const hasPersonalization = /\{name\}|\{first_name\}/i.test(data.body);

      let sentCount = 0;
      let arkeselError: string | null = null;

      if (hasPersonalization) {
        // Send individually for personalization
        for (const r of phoneRecipients) {
          if (!r.phone) continue;
          const { valid } = sanitizePhoneNumbers([r.phone]);
          if (valid.length === 0) continue;

          const firstName = r.name.split(" ")[0] || "Guest";
          const personalizedBody = data.body
            .replace(/\{name\}/gi, r.name)
            .replace(/\{first_name\}/gi, firstName);

          const result = await sendArkeselSms({
            recipients: valid,
            message: personalizedBody,
            sender: data.senderId,
          });

          if (result.success) {
            sentCount += result.sentCount;
          } else if (!arkeselError) {
            arkeselError = result.message;
          }
        }
      } else {
        // Batch send in bulk to Arkesel
        const smsResult = await sendArkeselSms({
          recipients: validPhones,
          message: data.body,
          sender: data.senderId,
        });

        if (!smsResult.success) {
          return NextResponse.json(
            {
              error: `Failed to dispatch bulk SMS via Arkesel: ${smsResult.message}`,
              validPhoneCount: validPhones.length,
              invalidCount: invalidPhones.length,
            },
            { status: 400 }
          );
        }

        sentCount = smsResult.sentCount;
      }

      if (sentCount === 0 && arkeselError) {
        return NextResponse.json(
          { error: `Failed to dispatch bulk SMS via Arkesel: ${arkeselError}` },
          { status: 400 }
        );
      }

      // Record messages in database for known customers
      const now = new Date();
      const customerMessages = phoneRecipients
        .filter((r) => !!r.customerId)
        .map((r) => ({
          customerId: r.customerId as string,
          senderId: authResult.user.id,
          channel: "SMS" as const,
          subject: data.subject || "Bulk SMS (Arkesel)",
          body: data.body.replace(/\{name\}/gi, r.name).replace(/\{first_name\}/gi, r.name.split(" ")[0]),
          sentAt: now,
        }));

      if (customerMessages.length > 0) {
        await db.message.createMany({
          data: customerMessages,
        });
      }

      await auditLog({
        userId: authResult.user.id,
        action: "BULK_MESSAGE_SENT",
        entity: "Message",
        entityId: data.serviceId || data.targetType,
        newValues: {
          targetType: data.targetType,
          serviceId: data.serviceId,
          channel: "SMS",
          recipientCount: validPhones.length,
          sentCount,
          invalidCount: invalidPhones.length,
          provider: "Arkesel",
        },
        request,
      });

      return NextResponse.json(
        {
          sent: sentCount,
          total: recipients.length,
          validPhones: validPhones.length,
          invalidPhones: invalidPhones.length,
          provider: "Arkesel",
          message: `Successfully delivered ${sentCount} SMS message${sentCount !== 1 ? "s" : ""} via Arkesel!`,
        },
        { status: 201 }
      );
    }

    // Default flow for other channels (EMAIL, etc.)
    const messages = await Promise.all(
      recipients
        .filter((r) => !!r.customerId)
        .map((r) =>
          db.message.create({
            data: {
              customerId: r.customerId as string,
              senderId: authResult.user.id,
              channel: data.channel,
              subject: data.subject || null,
              body: data.body.replace(/\{name\}/gi, r.name).replace(/\{first_name\}/gi, r.name.split(" ")[0]),
              sentAt: new Date(),
            },
          })
        )
    );

    await auditLog({
      userId: authResult.user.id,
      action: "BULK_MESSAGE_SENT",
      entity: "Message",
      entityId: data.serviceId || data.targetType,
      newValues: {
        targetType: data.targetType,
        serviceId: data.serviceId,
        channel: data.channel,
        recipientCount: messages.length,
      },
      request,
    });

    return NextResponse.json(
      {
        sent: messages.length,
        total: recipients.length,
        message: `Successfully sent ${messages.length} message${messages.length !== 1 ? "s" : ""}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/messages/bulk error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
