import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { activitySchema } from "@/lib/validations/activity";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("activities.view");
  if (authResult.error) return authResult.error;
  const { searchParams } = new URL(request.url);

  const leadId = searchParams.get("leadId") || undefined;
  const customerId = searchParams.get("customerId") || undefined;
  const type = searchParams.get("type") || undefined;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (customerId) where.customerId = customerId;
  if (type) where.type = type;

  const [activities, total] = await Promise.all([
    db.activity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    }),
    db.activity.count({ where }),
  ]);

  return NextResponse.json({
    activities,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("activities.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const data = activitySchema.parse(body);

    const activity = await db.activity.create({
      data: {
        type: data.type,
        subject: data.subject,
        description: data.description || null,
        leadId: data.leadId || null,
        customerId: data.customerId || null,
        userId: authResult.user.id,
      },
    });

    // Update lead lastContactedAt if linked
    if (data.leadId) {
      await db.lead.update({
        where: { id: data.leadId },
        data: { lastContactedAt: new Date() },
      });
    }

    await auditLog({
      userId: authResult.user.id,
      action: "ACTIVITY_CREATED",
      entity: "Activity",
      entityId: activity.id,
      newValues: { type: data.type, subject: data.subject },
      request,
    });

    return NextResponse.json(activity, { status: 201 });
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
