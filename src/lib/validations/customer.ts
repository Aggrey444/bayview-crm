import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z
    .string()
    .email("Invalid email address")
    .max(200, "Email is too long")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(30, "Phone is too long").optional().or(z.literal("")),
  company: z.string().max(200, "Company is too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
  serviceIds: z
    .array(z.string())
    .min(1, "At least one service must be selected")
    .optional(),
  servicePrices: z.record(z.string(), z.number()).optional(),
  bookingDetails: z
    .object({
      propertyName: z.string().optional(),
      roomNumber: z.string().optional(),
      checkInDate: z.string().optional(),
      checkOutDate: z.string().optional(),
      guests: z.coerce.number().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  paymentDetails: z
    .object({
      paymentStatus: z.enum(["PAID", "PENDING", "NONE"]).optional(),
      paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"]).optional(),
      amountPaid: z.coerce.number().optional(),
      paymentReference: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const customerSearchSchema = z.object({
  q: z.string().optional(),
  serviceId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type CustomerSearchParams = z.infer<typeof customerSearchSchema>;
