import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).default("DRAFT"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0, "Budget must be positive").optional().or(z.nan()),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const campaignSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type CampaignSearchParams = z.infer<typeof campaignSearchSchema>;
