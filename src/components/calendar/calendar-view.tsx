"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskFormModal, TaskItem, TaskAssignee } from "@/components/tasks/task-form-modal";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  initialTasks: TaskItem[];
  currentUserId: string;
  teamMembers: TaskAssignee[];
  canViewAll?: boolean;
}

export function CalendarView({
  initialTasks,
  currentUserId,
  teamMembers,
  canViewAll = false,
}: CalendarViewProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterAssignee, setFilterAssignee] = useState<"all" | "mine">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterAssignee === "mine" && t.assignedToId !== currentUserId) {
        return false;
      }
      if (filterPriority === "urgent_high" && t.priority !== "URGENT" && t.priority !== "HIGH") {
        return false;
      }
      return true;
    });
  }, [tasks, filterAssignee, filterPriority, currentUserId]);

  // Group tasks by date string "YYYY-MM-DD"
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const task of filteredTasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    }
    return map;
  }, [filteredTasks]);

  // Quick toggle status
  async function toggleTaskStatus(e: React.MouseEvent, task: TaskItem) {
    e.stopPropagation();
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
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
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

  function openCreateModalForDate(dateStr: string) {
    setSelectedTask(null);
    setSelectedDateStr(dateStr);
    setModalOpen(true);
  }

  function openEditModal(task: TaskItem) {
    setSelectedTask(task);
    setSelectedDateStr("");
    setModalOpen(true);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Month stats
  const currentMonthStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let overdue = 0;

    for (const t of filteredTasks) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        total++;
        if (t.status === "COMPLETED") completed++;
        else if (d < today && t.status !== "CANCELLED") overdue++;
      }
    }
    return { total, completed, overdue, pending: total - completed };
  }, [filteredTasks, year, month, today]);

  const priorityColors: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
    HIGH: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
    MEDIUM: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
    LOW: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  };

  return (
    <div className="space-y-4">
      {/* Calendar Top Controls & Stats */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white/70 p-4 shadow-xs backdrop-blur-md dark:border-white/5 dark:bg-zinc-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-zinc-500">
              {currentMonthStats.total} task{currentMonthStats.total !== 1 ? "s" : ""} scheduled this month
              {currentMonthStats.overdue > 0 && (
                <span className="ml-1 text-red-500 font-medium">
                  ({currentMonthStats.overdue} overdue)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigation */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 px-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter: My Tasks vs Team */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setFilterAssignee("all")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-all",
                filterAssignee === "all"
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              )}
            >
              All Team
            </button>
            <button
              onClick={() => setFilterAssignee("mine")}
              className={cn(
                "rounded-md px-2.5 py-1 transition-all",
                filterAssignee === "mine"
                  ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              )}
            >
              My Tasks
            </button>
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex h-8 rounded-lg border border-zinc-200 bg-white px-2.5 py-0.5 text-xs text-zinc-700 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent_high">Urgent & High</option>
          </select>

          {/* Add task button */}
          <Button
            size="sm"
            onClick={() => openCreateModalForDate(todayStr)}
            className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-white/5 dark:bg-zinc-900">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 text-center text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
          {weekdayNames.map((d, i) => (
            <div key={d} className={cn("py-2.5", (i === 0 || i === 6) && "text-zinc-400 dark:text-zinc-500")}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200/80 dark:divide-white/5">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="min-h-[110px] bg-zinc-50/40 p-2 dark:bg-zinc-950/20"
            />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const dayTasks = tasksByDate.get(dateStr) || [];

            return (
              <div
                key={dateStr}
                onClick={() => openCreateModalForDate(dateStr)}
                className={cn(
                  "group relative min-h-[110px] p-2 transition-colors hover:bg-amber-500/[0.03] cursor-pointer flex flex-col justify-between",
                  isToday && "bg-amber-50/30 dark:bg-amber-950/10"
                )}
              >
                {/* Date number and add button */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all",
                      isToday
                        ? "bg-amber-600 text-white dark:bg-amber-500"
                        : "text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600"
                    )}
                  >
                    {dayNum}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateModalForDate(dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded"
                    title="Add task on this date"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Task pills for this day */}
                <div className="mt-1.5 flex-1 space-y-1 overflow-y-auto max-h-[120px] scrollbar-none">
                  {dayTasks.map((t) => {
                    const isCompleted = t.status === "COMPLETED";
                    const isAssigneeMe = t.assignedToId === currentUserId;

                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(t);
                        }}
                        className={cn(
                          "group/pill flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium border transition-all hover:shadow-2xs",
                          priorityColors[t.priority] || priorityColors.LOW,
                          isCompleted && "opacity-60 line-through bg-zinc-100/60 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-500"
                        )}
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleTaskStatus(e, t)}
                          className="shrink-0 text-current hover:scale-110 transition-transform"
                          title={isCompleted ? "Mark incomplete" : "Mark completed"}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </button>

                        <span className="truncate flex-1" title={t.title}>
                          {t.title}
                        </span>

                        {isAssigneeMe && (
                          <span className="shrink-0 text-[9px] font-semibold uppercase px-1 rounded bg-black/5 dark:bg-white/10">
                            Me
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty cells to complete the last row */}
          {Array.from({ length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7 }).map((_, index) => (
            <div
              key={`empty-end-${index}`}
              className="min-h-[110px] bg-zinc-50/40 p-2 dark:bg-zinc-950/20"
            />
          ))}
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={selectedTask}
        defaultDate={selectedDateStr}
        currentUserId={currentUserId}
        teamMembers={teamMembers}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
}
