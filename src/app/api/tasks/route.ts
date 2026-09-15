import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { taskSchema, taskSearchSchema } from "@/lib/validations/task";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { getTasks } from "@/lib/queries/tasks";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("tasks.view");
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const parsed = taskSearchSchema.safeParse({
    q: searchParams.get("q") || undefined,
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
    createdById: searchParams.get("createdById") || undefined,
    dueDateStart: searchParams.get("dueDateStart") || undefined,
    dueDateEnd: searchParams.get("dueDateEnd") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 50,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters", details: parsed.error.format() }, { status: 400 });
  }

  const result = await getTasks({
    ...parsed.data,
    currentUserId: authResult.user.id,
    canViewAll: authResult.user.role?.viewAllData ?? false,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("tasks.create");
    if ("error" in authResult) return authResult.error;

    const body = await request.json();
    const data = taskSchema.parse(body);

    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        priority: data.priority,
        status: data.status,
        completedAt: data.status === "COMPLETED" ? new Date() : null,
        createdById: authResult.user.id,
        assignedToId: data.assignedToId || null,
        leadId: data.leadId || null,
        customerId: data.customerId || null,
        bookingId: data.bookingId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify assignee if assigned to someone else
    if (task.assignedToId && task.assignedToId !== authResult.user.id) {
      await db.notification.create({
        data: {
          userId: task.assignedToId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `${authResult.user.name || "A team member"} assigned you the task: "${task.title}"`,
          link: `/dashboard/tasks`,
          metadata: { taskId: task.id },
        },
      });
    }

    await auditLog({
      userId: authResult.user.id,
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      newValues: {
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedToId: task.assignedToId,
      },
      request,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
