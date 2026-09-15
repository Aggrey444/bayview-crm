"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, User, Clock, AlertCircle, X } from "lucide-react";

export type TaskAssignee = {
  id: string;
  name: string | null;
  email?: string | null;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  startDate: string | Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdById: string;
  assignedToId: string | null;
  assignedTo?: TaskAssignee | null;
  leadId?: string | null;
  customerId?: string | null;
  bookingId?: string | null;
};

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskItem | null;
  defaultDate?: string;
  currentUserId?: string;
  teamMembers?: TaskAssignee[];
  onSuccess: (task: TaskItem) => void;
}

export function TaskFormModal({
  open,
  onOpenChange,
  task,
  defaultDate,
  currentUserId,
  teamMembers = [],
  onSuccess,
}: TaskFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("TODO");
  const [assignedToId, setAssignedToId] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setPriority(task.priority || "MEDIUM");
      setStatus(task.status || "TODO");
      setAssignedToId(task.assignedToId || "");
    } else {
      setTitle("");
      setDescription("");
      setDueDate(defaultDate || new Date().toISOString().split("T")[0]);
      setPriority("MEDIUM");
      setStatus("TODO");
      setAssignedToId(currentUserId || "");
    }
    setError("");
  }, [task, defaultDate, currentUserId, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      status,
      assignedToId: assignedToId || null,
    };

    try {
      const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = task ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save task");
      }

      const savedTask = await res.json();
      onSuccess(savedTask);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[540px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span>{task ? "Edit Task" : "Create New Task"}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {task
              ? "Update task assignment, schedule, or status."
              : "Assign a task to yourself or a teammate. It will show up on their operational calendar."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare event hall for wedding, Follow up VIP guest"
              className="bg-transparent"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description (Optional)
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add key notes, equipment needed, or instructions..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="assignedToId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Assignee
                </Label>
                {currentUserId && assignedToId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => setAssignedToId(currentUserId)}
                    className="text-[11px] font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 underline"
                  >
                    Assign to me
                  </button>
                )}
              </div>
              <select
                id="assignedToId"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email || "Team Member"} {m.id === currentUserId ? "(Me)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Priority
              </Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Important)</option>
                <option value="URGENT">Urgent (Immediate action)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status
              </Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-2 sm:justify-end border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              {loading ? "Saving..." : task ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
