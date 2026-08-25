import { z } from "zod";

export const messageSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  campaignId: z.string().optional().or(z.literal("")),
  channel: z.enum(["EMAIL", "SMS", "PHONE", "IN_PERSON", "OTHER"]).default("EMAIL"),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Body is required").max(10000),
  sentAt: z.coerce.date().optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const messageSearchSchema = z.object({
  q: z.string().optional(),
  channel: z.enum(["EMAIL", "SMS", "PHONE", "IN_PERSON", "OTHER"]).optional(),
  customerId: z.string().optional(),
  campaignId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type MessageSearchParams = z.infer<typeof messageSearchSchema>;
