import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TaskList } from "@/components/tasks/task-list";
import { db } from "@/lib/prisma";
import type { TaskItem } from "@/components/tasks/task-form-modal";

export const metadata = {
  title: "Task Management — Bayview Village",
  description: "Track and assign tasks across staff and departments.",
};

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("tasks.view")) {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const rawTasks = await db.task.findMany({
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  const initialTasks: TaskItem[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    priority: t.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    status: t.status as "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    createdById: t.createdById,
    assignedToId: t.assignedToId,
    assignedTo: t.assignedTo,
    leadId: t.leadId,
    customerId: t.customerId,
    bookingId: t.bookingId,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Organize work, assign duties, and ensure seamless hospitality operations."
      />
      <TaskList
        initialTasks={initialTasks}
        currentUserId={session.user.id}
        teamMembers={users}
        canViewAll={true}
      />
    </div>
  );
}
