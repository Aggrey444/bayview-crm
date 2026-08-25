import { z } from "zod";

export const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  currency: z.string().max(3).default("GHS"),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"]).default("CASH"),
  status: z.enum(["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"]).default("PENDING"),
  reference: z.string().max(200).optional().or(z.literal("")),
  paymentProvider: z.string().max(200).optional().or(z.literal("")),
  paymentDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const paymentSearchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"]).optional(),
  bookingId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type PaymentSearchParams = z.infer<typeof paymentSearchSchema>;

export const paymentStatusSchema = z.object({
  status: z.enum(["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"]),
});
