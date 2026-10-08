import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

const guestReviewSchema = z.object({
  name: z.string().min(1, "Full name is required").max(200),
  phone: z.string().min(5, "Valid phone or WhatsApp number is required").max(30),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  serviceUsed: z.string().min(1, "Please select the service you used today").max(200),
  rating: z.coerce.number().min(1, "Please select a star rating").max(5),
  staffHospitality: z.coerce.number().min(1).max(5).optional(),
  cleanliness: z.coerce.number().min(1).max(5).optional(),
  feedback: z.string().max(3000).optional().or(z.literal("")),
  recommend: z.string().max(50).optional().or(z.literal("")),
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
    const data = guestReviewSchema.parse(body);

    // Spam honeypot
    if (data._honeypot) {
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // 1. Resolve or find matching Service record
    let serviceRecord = await db.service.findFirst({
      where: { name: { equals: data.serviceUsed, mode: "insensitive" } },
    });
    if (!serviceRecord) {
      serviceRecord = await db.service.create({
        data: { name: data.serviceUsed },
      });
    }

    // 2. Find or create Customer record
    let customer = null;
    if (data.email) {
      customer = await db.customer.findUnique({ where: { email: data.email } });
    }
    if (!customer && data.phone) {
      // Check exact or normalized phone
      const phoneDigits = data.phone.replace(/\D/g, "");
      customer = await db.customer.findFirst({
        where: {
          OR: [
            { phone: data.phone },
            { phone: phoneDigits },
            { phone: phoneDigits.startsWith("0") ? phoneDigits.slice(1) : "0" + phoneDigits },
          ],
        },
      });
    }

    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: `Created via Service Review QR Code (${data.serviceUsed}). Rated ${data.rating}/5 stars.`,
          services: {
            connect: { id: serviceRecord.id },
          },
        },
      });
    } else {
      // Connect service to existing customer if not already linked
      try {
        await db.customer.update({
          where: { id: customer.id },
          data: {
            services: {
              connect: { id: serviceRecord.id },
            },
          },
        });
      } catch {
        // Already connected
      }
    }

    // 3. Ensure "Service Review QR Code" Lead Source exists
    let source = await db.leadSource.findFirst({
      where: { name: { equals: "Service Review QR Code", mode: "insensitive" } },
    });
    if (!source) {
      source = await db.leadSource.create({
        data: { name: "Service Review QR Code" },
      });
    }

    // 4. Ensure "Completed" or "New" Lead Status exists
    const status =
      (await db.leadStatus.findFirst({ where: { name: "Completed" } })) ||
      (await db.leadStatus.findFirst({ where: { name: "New" } }));

    const voucherCode = `BV-VIP-REPEAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const reviewNotes = [
      `⭐ Overall Satisfaction: ${data.rating}/5 Stars`,
      `🛎️ Service Used: ${data.serviceUsed}`,
      data.staffHospitality ? `🤝 Staff Hospitality: ${data.staffHospitality}/5 Stars` : null,
      data.cleanliness ? `✨ Cleanliness & Ambience: ${data.cleanliness}/5 Stars` : null,
      data.recommend ? `👍 Would Recommend: ${data.recommend}` : null,
      data.feedback ? `💬 Guest Review & Comments: "${data.feedback}"` : null,
      `🎟️ Issued Repeat Visit Voucher: ${voucherCode}`,
    ]
      .filter(Boolean)
      .join("\n");

    // 5. Create Lead record for prospecting and tracking
    const lead = await db.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        service: `${data.serviceUsed} (${data.rating}★ Review)`,
        sourceId: source.id,
        statusId: status?.id || null,
        customerId: customer.id,
        priority: data.rating <= 2 ? "URGENT" : data.rating === 3 ? "HIGH" : "MEDIUM",
        notes: reviewNotes,
      },
    });

    const fallbackUser = await db.user.findFirst({ select: { id: true } });

    // 6. Log Activity in Customer Timeline
    if (fallbackUser) {
      try {
        await db.activity.create({
          data: {
            type: "NOTE",
            subject: `⭐ Post-Service Review: ${data.rating}/5 Stars (${data.serviceUsed})`,
            description: reviewNotes,
            customerId: customer.id,
            leadId: lead.id,
            userId: fallbackUser.id,
          },
        });
      } catch (e) {
        console.warn("Could not log activity:", e);
      }
    }

    // 7. If low rating (<= 2 stars), create an urgent Task for staff follow-up!
    if (data.rating <= 2 && fallbackUser) {
      try {
        await db.task.create({
          data: {
            title: `⚠️ Review Follow-Up: ${data.name} rated ${data.rating}/5 for ${data.serviceUsed}`,
            description: `Guest left an unsatisfactory review: "${data.feedback || "No written comments"}". Phone: ${data.phone}. Please contact them immediately to resolve their complaints.`,
            priority: "URGENT",
            status: "TODO",
            dueDate: new Date(),
            customerId: customer.id,
            leadId: lead.id,
            createdById: fallbackUser.id,
            assignedToId: fallbackUser.id,
          },
        });
      } catch (e) {
        console.warn("Could not create follow-up task:", e);
      }
    }

    // 8. Staff Notification
    if (fallbackUser) {
      try {
        await db.notification.create({
          data: {
            userId: fallbackUser.id,
            type: "CUSTOM",
            title: `⭐ New Review (${data.rating}/5): ${data.name}`,
            message: `${data.name} rated ${data.serviceUsed} ${data.rating}/5 stars. ${data.feedback ? `"${data.feedback}"` : ""}`,
            link: `/dashboard/review-qr`,
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
        rating: data.rating,
        serviceUsed: data.serviceUsed,
        message: "Thank you for your valuable review! Your feedback helps us elevate the Bayview Village experience.",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST /api/public/guest-review error:", error);

    if (error && typeof error === "object" && "issues" in error) {
      const zodErr = error as z.ZodError;
      return NextResponse.json(
        { error: zodErr.issues[0]?.message || "Invalid input data" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong while processing your review." },
      { status: 500, headers: corsHeaders }
    );
  }
}
