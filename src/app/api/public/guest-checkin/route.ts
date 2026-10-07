import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

const guestCheckinSchema = z.object({
  name: z.string().min(1, "Full name is required").max(200),
  phone: z.string().min(5, "Valid phone or WhatsApp number is required").max(30),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  visitPurpose: z.string().min(1, "Please tell us what brings you here today").max(200),
  eventName: z.string().max(200).optional().or(z.literal("")),
  interestedServices: z.array(z.string()).min(1, "Please select at least one service you are interested in"),
  rating: z.coerce.number().min(1).max(5).optional(),
  feedback: z.string().max(3000).optional().or(z.literal("")),
  _honeypot: z.string().max(0).optional().or(z.literal("")),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = guestCheckinSchema.parse(body);

    // Spam honeypot
    if (data._honeypot) {
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // 1. Find or create Customer record
    let customer = null;
    if (data.email) {
      customer = await db.customer.findUnique({ where: { email: data.email } });
    }
    if (!customer && data.phone) {
      customer = await db.customer.findFirst({
        where: { phone: data.phone },
      });
    }

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: `Registered via Entrance QR Code. Purpose: ${data.visitPurpose}${
            data.eventName ? ` (${data.eventName})` : ""
          }`,
        },
      });
    }

    // 2. Ensure "Entrance QR Code" Lead Source exists
    let source = await db.leadSource.findFirst({
      where: { name: { equals: "Entrance QR Code", mode: "insensitive" } },
    });
    if (!source) {
      source = await db.leadSource.create({
        data: { name: "Entrance QR Code" },
      });
    }

    // 3. Ensure "New" Lead Status exists
    const status = await db.leadStatus.findFirst({
      where: { name: "New" },
    });

    const interestedServicesText = data.interestedServices.join(", ");
    const voucherCode = `BV-DISCOUNT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const leadNotes = [
      `🎟️ Claimed Entrance Discount Voucher: ${voucherCode}`,
      `📌 Purpose of Visit: ${data.visitPurpose}`,
      data.eventName ? `🎉 Event / Host: ${data.eventName}` : null,
      `⭐ Experience Rating: ${data.rating ? `${data.rating}/5 Stars` : "Not provided"}`,
      data.feedback ? `💬 Guest Feedback: "${data.feedback}"` : null,
      `✨ Interested Services: ${interestedServicesText}`,
    ]
      .filter(Boolean)
      .join("\n");

    // 4. Create Lead for sales/marketing prospecting
    const lead = await db.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        service: interestedServicesText,
        sourceId: source.id,
        statusId: status?.id || null,
        customerId: customer.id,
        priority: data.rating && data.rating <= 2 ? "HIGH" : "MEDIUM",
        notes: leadNotes,
      },
    });

    // 5. Create an Activity log for CRM history
    const fallbackUser = await db.user.findFirst({ select: { id: true } });
    if (fallbackUser) {
      try {
        await db.activity.create({
          data: {
            type: "NOTE",
            subject: `Guest Check-in via Entrance QR Code: ${data.name}`,
            description: leadNotes,
            customerId: customer.id,
            leadId: lead.id,
            userId: fallbackUser.id,
          },
        });
      } catch (e) {
        console.warn("Could not log activity:", e);
      }
    }

    // 6. Notify staff in CRM
    if (fallbackUser) {
      try {
        await db.notification.create({
          data: {
            userId: fallbackUser.id,
            type: "NEW_LEAD",
            title: `New Entrance QR Guest: ${data.name}`,
            message: `${data.name} checked in at entrance (${data.visitPurpose}). Interested in: ${interestedServicesText}`,
            link: `/dashboard/leads`,
          },
        });
      } catch (e) {
        console.warn("Could not create notification:", e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        voucherCode,
        message: "Thank you for registering at Bayview Village! Your discount has been activated.",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST /api/public/guest-checkin error:", error);

    if (error && typeof error === "object" && "issues" in error) {
      const zodErr = error as z.ZodError;
      return NextResponse.json(
        { error: zodErr.issues[0]?.message || "Invalid input data" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing your registration." },
      { status: 500, headers: corsHeaders }
    );
  }
}
