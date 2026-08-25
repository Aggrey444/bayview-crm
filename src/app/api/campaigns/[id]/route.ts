import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { campaignSchema } from "@/lib/validations/campaign";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/campaigns/[id]">
) {
  const authResult = await requirePermission("campaigns.view");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: { source: true, status: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { leads: true, messages: true },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(campaign);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/campaigns/[id]">
) {
  try {
    const authResult = await requirePermission("campaigns.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const data = campaignSchema.parse(body);

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const cleaned = {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: data.budget && !Number.isNaN(data.budget) ? data.budget : null,
      notes: data.notes || null,
    };

    const campaign = await db.campaign.update({
      where: { id },
      data: cleaned,
    });

    await auditLog({
      userId: authResult.user.id,
      action: "CAMPAIGN_UPDATED",
      entity: "Campaign",
      entityId: id,
      oldValues: existing,
      newValues: cleaned,
      request,
    });

    return NextResponse.json(campaign);
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/campaigns/[id]">
) {
  try {
    const authResult = await requirePermission("campaigns.delete");
    if (authResult.error) return authResult.error;

    const { id } = await params;

    const existing = await db.campaign.findUnique({
      where: { id },
      select: { id: true, _count: { select: { leads: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (existing._count.leads > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete campaign with existing leads. Remove leads first.",
        },
        { status: 400 }
      );
    }

    await db.campaign.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "CAMPAIGN_DELETED",
      entity: "Campaign",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ message: "Campaign deleted" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this campaign because it has associated records.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
