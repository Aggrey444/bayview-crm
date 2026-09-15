"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Trash2,
  Pencil,
  AlertCircle,
  CheckSquare,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskFormModal, TaskItem, TaskAssignee } from "@/components/tasks/task-form-modal";
import { cn } from "@/lib/utils";

interface TaskListProps {
  initialTasks: TaskItem[];
  currentUserId: string;
  teamMembers: TaskAssignee[];
  canViewAll?: boolean;
}

export function TaskList({
  initialTasks,
  currentUserId,
  teamMembers,
  canViewAll = false,
}: TaskListProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<"all" | "mine" | "created" | "completed">("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "mine" && task.assignedToId !== currentUserId) return false;
      if (activeTab === "created" && task.createdById !== currentUserId) return false;
      if (activeTab === "completed" && task.status !== "COMPLETED") return false;

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchAssignee = task.assignedTo?.name?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchDesc && !matchAssignee) return false;
      }

      return true;
    });
  }, [tasks, activeTab, statusFilter, priorityFilter, searchQuery, currentUserId]);

  async function toggleStatus(task: TaskItem) {
    const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
    } catch {
      alert("Failed to delete task");
    }
  }

  function handleTaskSaved(saved: TaskItem) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  const priorityBadges: Record<string, { label: string; className: string }> = {
    URGENT: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
    HIGH: { label: "High", className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
    MEDIUM: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
    LOW: { label: "Low", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  };

  const statusBadges: Record<string, { label: string; className: string }> = {
    TODO: { label: "To Do", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
    IN_PROGRESS: { label: "In Progress", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
    CANCELLED: { label: "Cancelled", className: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 line-through" },
  };

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab("mine")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              activeTab === "mine"
                ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            )}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              activeTab === "all"
                ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            )}
          >
            All Tasks
          </button>
          <button
            onClick={() => setActiveTab("created")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              activeTab === "created"
                ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            )}
          >
            Created by Me
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              activeTab === "completed"
                ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            )}
          >
            Completed
          </button>
        </div>

        <Button
          onClick={() => {
            setSelectedTask(null);
            setModalOpen(true);
          }}
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Search and Dropdown Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search tasks by title, details, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:bg-zinc-900 dark:border-zinc-800"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:bg-zinc-900 dark:border-zinc-800"
          >
            <option value="all">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Task List Items */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No tasks found
          </h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">
            {searchQuery || priorityFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search terms."
              : "Create a task for yourself or assign one to a team member."}
          </p>
          <Button
            onClick={() => {
              setSelectedTask(null);
              setModalOpen(true);
            }}
            className="mt-4 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((t) => {
            const isCompleted = t.status === "COMPLETED";
            const isOverdue = t.dueDate && new Date(t.dueDate) < today && !isCompleted && t.status !== "CANCELLED";
            const priorityInfo = priorityBadges[t.priority] || priorityBadges.MEDIUM;
            const statusInfo = statusBadges[t.status] || statusBadges.TODO;

            return (
              <div
                key={t.id}
                className={cn(
                  "group flex items-start sm:items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-900 dark:hover:border-white/10",
                  isCompleted && "opacity-75 bg-zinc-50/50 dark:bg-zinc-900/40"
                )}
              >
                {/* Left: Checkbox + Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleStatus(t)}
                    className="mt-0.5 sm:mt-0 shrink-0 text-zinc-400 hover:text-amber-600 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        onClick={() => {
                          setSelectedTask(t);
                          setModalOpen(true);
                        }}
                        className={cn(
                          "cursor-pointer font-medium text-sm text-zinc-900 dark:text-zinc-100 hover:text-amber-600 transition-colors",
                          isCompleted && "line-through text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        {t.title}
                      </span>

                      {/* Priority Badge */}
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priorityInfo.className)}>
                        {priorityInfo.label}
                      </span>

                      {/* Status Badge */}
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusInfo.className)}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {t.description && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{t.description}</p>
                    )}

                    {/* Metadata: Assignee, Due date */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      {t.assignedTo ? (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{t.assignedTo.name || t.assignedTo.email}</span>
                          {t.assignedToId === currentUserId && (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 font-mono">(Me)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Unassigned</span>
                      )}

                      {t.dueDate && (
                        <span className={cn("flex items-center gap-1", isOverdue ? "text-red-500 font-medium" : "")}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>Due {new Date(t.dueDate).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {isOverdue && <span className="font-semibold uppercase text-[10px]">(Overdue)</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTask(t);
                      setModalOpen(true);
                    }}
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    title="Edit task"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(t.id)}
                    className="h-8 w-8 text-zinc-400 hover:text-red-600"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={selectedTask}
        currentUserId={currentUserId}
        teamMembers={teamMembers}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
}
