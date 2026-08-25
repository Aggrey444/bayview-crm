import { z } from "zod";

export const activitySchema = z.object({
  type: z.enum([
    "CALL",
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "MEETING",
    "NOTE",
    "QUOTE",
    "PROPERTY_VISIT",
    "OTHER",
  ]),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  leadId: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const followUpSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  dueDate: z.coerce.date({ message: "Due date is required" }),
  leadId: z.string().min(1, "Lead is required"),
  assignedToId: z.string().min(1, "Assigned staff is required"),
});

export type FollowUpInput = z.infer<typeof followUpSchema>;

export const followUpCompleteSchema = z.object({
  completed: z.boolean(),
});

export const activitySearchSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
