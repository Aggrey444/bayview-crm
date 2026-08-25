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

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 submissions per minute per IP

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000); // cleanup every 5 minutes

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = publicLeadSchema.parse(body);

    // Honeypot check - bots fill this hidden field
    if (data._honeypot) {
      // Silently accept but don't create anything (spam bot)
      return NextResponse.json({ success: true });
    }

    // Must have at least email or phone
    if (!data.email && !data.phone) {
      return NextResponse.json(
        { error: "Please provide an email or phone number." },
        { status: 400 }
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
    if (data.source) {
      const source = await db.leadSource.findFirst({
        where: { name: { equals: data.source, mode: "insensitive" } },
      });
      if (source) sourceId = source.id;
    }

    // Find campaign
    let campaignId: string | null = null;
    if (data.campaign) {
      const campaign = await db.campaign.findFirst({
        where: { name: { equals: data.campaign, mode: "insensitive" } },
      });
      if (campaign) campaignId = campaign.id;
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
        service: data.service || null,
        notes: data.message || null,
        sourceId,
        campaignId,
        statusId: newStatus?.id || null,
        customerId: customer.id,
        priority: "MEDIUM",
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
      },
    });

    // Log activity
    const fallbackUser = await db.user.findFirst({ select: { id: true } });
    if (fallbackUser) {
      await db.activity.create({
        data: {
          type: "NOTE",
          subject: "Lead captured via public form",
          description: data.message || null,
          leadId: lead.id,
          customerId: customer.id,
          userId: fallbackUser.id,
        },
      });
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
