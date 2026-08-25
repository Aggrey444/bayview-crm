import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  service: z.string().max(200).optional().or(z.literal("")),
  sourceId: z.string().optional().or(z.literal("")),
  statusId: z.string().optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  customerId: z.string().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z.string().max(5000).optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional().nullable(),
  expectedValue: z.coerce.number().min(0).optional().nullable(),
  utmSource: z.string().max(200).optional().or(z.literal("")),
  utmMedium: z.string().max(200).optional().or(z.literal("")),
  utmCampaign: z.string().max(200).optional().or(z.literal("")),
  utmContent: z.string().max(200).optional().or(z.literal("")),
  utmTerm: z.string().max(200).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadSearchSchema = z.object({
  q: z.string().optional(),
  statusId: z.string().optional(),
  sourceId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  view: z.enum(["list", "pipeline"]).default("list"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type LeadSearchParams = z.infer<typeof leadSearchSchema>;

export const leadStatusUpdateSchema = z.object({
  statusId: z.string().min(1, "Status is required"),
});

export const leadAssignSchema = z.object({
  assignedToId: z.string().min(1, "Staff member is required"),
});
