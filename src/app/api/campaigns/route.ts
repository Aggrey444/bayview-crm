import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { campaignSchema, campaignSearchSchema } from "@/lib/validations/campaign";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("campaigns.view");
  if (authResult.error) return authResult.error;
  const { searchParams } = new URL(request.url);
  const params = campaignSearchSchema.parse({
    q: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
  });

  const { q, status, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  const [campaigns, total] = await Promise.all([
    db.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { leads: true, messages: true },
        },
      },
    }),
    db.campaign.count({ where }),
  ]);

  return NextResponse.json({
    campaigns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("campaigns.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = campaignSchema.parse(body);

    const cleaned = {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget && !Number.isNaN(data.budget) ? data.budget : null,
      notes: data.notes || null,
      createdById: authResult.user.id,
    };

    const campaign = await db.campaign.create({ data: cleaned });

    await auditLog({
      userId: authResult.user.id,
      action: "CAMPAIGN_CREATED",
      entity: "Campaign",
      entityId: campaign.id,
      newValues: cleaned,
      request,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: JSON.parse(error.message)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
