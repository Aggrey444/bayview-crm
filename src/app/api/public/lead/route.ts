import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

const publicLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").max(200).optional().or(z.literal("")),
  service: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(5000).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  campaign: z.string().max(200).optional().or(z.literal("")),
  utmSource: z.string().max(200).optional().or(z.literal("")),
  utmMedium: z.string().max(200).optional().or(z.literal("")),
  utmCampaign: z.string().max(200).optional().or(z.literal("")),
  utmContent: z.string().max(200).optional().or(z.literal("")),
  utmTerm: z.string().max(200).optional().or(z.literal("")),
  _honeypot: z.string().max(0).optional().or(z.literal("")),
});

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 submissions per minute per IP

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

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
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const data = publicLeadSchema.parse(body);

    // Honeypot check - bots fill this hidden field
    if (data._honeypot) {
      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // Must have at least email or phone
    if (!data.email && !data.phone) {
      return NextResponse.json(
        { error: "Please provide an email or phone number." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find or create customer
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
          email: data.email || null,
          phone: data.phone || null,
        },
      });
    }

    // Find source
    let sourceId: string | null = null;
    const sourceName = data.source || "Website";
    const source = await db.leadSource.findFirst({
      where: { name: { equals: sourceName, mode: "insensitive" } },
    });
    if (source) {
      sourceId = source.id;
    }

    // Find "New" status
    const newStatus = await db.leadStatus.findFirst({
      where: { name: "New" },
    });

    // Create lead
    const lead = await db.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        service: data.service || "General Inquiry",
        notes: data.message || null,
        sourceId,
        statusId: newStatus?.id || null,
        customerId: customer.id,
        priority: "MEDIUM",
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || data.campaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
      },
    });

    // Log activity if admin/user exists
    try {
      const fallbackUser = await db.user.findFirst({ select: { id: true } });
      if (fallbackUser) {
        await db.activity.create({
          data: {
            type: "NOTE",
            subject: "Lead captured via website form",
            description: data.message || null,
            leadId: lead.id,
            customerId: customer.id,
            userId: fallbackUser.id,
          },
        });
      }
    } catch (actError) {
      console.warn("Optional activity creation skipped:", actError);
    }

    return NextResponse.json({ success: true, leadId: lead.id }, { headers: corsHeaders });
  } catch (error) {
    console.error("POST /api/public/lead error:", error);

    if (error && typeof error === "object" && "issues" in error) {
      const zodErr = error as z.ZodError;
      return NextResponse.json(
        { error: zodErr.issues[0]?.message || "Invalid input data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const message = error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", details: process.env.NODE_ENV !== "production" ? message : undefined },
      { status: 500, headers: corsHeaders }
    );
  }
}
