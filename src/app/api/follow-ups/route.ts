import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { followUpSchema } from "@/lib/validations/activity";
import { notifyFollowUpDue } from "@/lib/notifications";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
    const authResult = await requirePermission("followUps.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);

  const leadId = searchParams.get("leadId") || undefined;
  const assignedToId = searchParams.get("assignedToId") || undefined;
  const completed = searchParams.get("completed");
  const overdue = searchParams.get("overdue");
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (leadId) where.leadId = leadId;
  if (assignedToId) where.assignedToId = assignedToId;
  if (completed !== null && completed !== undefined) where.completed = completed === "true";
  if (overdue === "true") {
    where.completed = false;
    where.dueDate = { lt: new Date() };
  }

  const [followUps, total] = await Promise.all([
    db.followUp.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dueDate: "asc" },
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.followUp.count({ where }),
  ]);

  return NextResponse.json({
    followUps,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
  const authResult = await requirePermission("followUps.create");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = followUpSchema.parse(body);

    const followUp = await db.followUp.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        leadId: data.leadId,
        assignedToId: data.assignedToId,
      },
      include: {
        lead: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    auditLog({
      userId: authResult.user.id,
      action: "FOLLOWUP_CREATED",
      entity: "FollowUp",
      entityId: followUp.id,
      newValues: { title: data.title, dueDate: data.dueDate, leadId: data.leadId, assignedToId: data.assignedToId },
      request,
    }).catch((err) => console.error("Failed to log follow-up creation", err));

    // Update lead nextFollowUpAt
    await db.lead.update({
      where: { id: data.leadId },
      data: { nextFollowUpAt: data.dueDate },
    });

    // Notify the assigned staff member
    notifyFollowUpDue({
      id: followUp.id,
      title: followUp.title,
      assignedToId: data.assignedToId,
      leadId: data.leadId,
      leadName: followUp.lead?.name,
    }).catch((err) => console.error("Failed to send follow-up due notification", err));

    return NextResponse.json(followUp, { status: 201 });
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
