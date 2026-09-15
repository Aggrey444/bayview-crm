import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { db } from "@/lib/prisma";
import type { TaskItem } from "@/components/tasks/task-form-modal";

export const metadata = {
  title: "Calendar & Schedule — Bayview Village",
  description: "View and manage tasks on the operational calendar.",
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("tasks.view")) {
    redirect("/dashboard");
  }

  // Fetch team members for task assignment
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Fetch initial tasks
  const rawTasks = await db.task.findMany({
    orderBy: { dueDate: "asc" },
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
        title="Operational Calendar"
        description="View assigned tasks, schedule team duties, and track deadlines."
      />
      <CalendarView
        initialTasks={initialTasks}
        currentUserId={session.user.id}
        teamMembers={users}
        canViewAll={session.user.role?.viewAllData ?? false}
      />
    </div>
  );
}
