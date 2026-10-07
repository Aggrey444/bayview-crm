import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(5000, "Description is too long").nullable().optional().or(z.literal("")),
  dueDate: z.string().nullable().optional().or(z.literal("")),
  startDate: z.string().nullable().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("TODO"),
  assignedToId: z.string().nullable().optional().or(z.literal("")),
  leadId: z.string().nullable().optional().or(z.literal("")),
  customerId: z.string().nullable().optional().or(z.literal("")),
  bookingId: z.string().nullable().optional().or(z.literal("")),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const taskSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional(),
  createdById: z.string().optional(),
  dueDateStart: z.string().optional(),
  dueDateEnd: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type TaskSearchParams = z.infer<typeof taskSearchSchema>;

export const taskStatusUpdateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});
