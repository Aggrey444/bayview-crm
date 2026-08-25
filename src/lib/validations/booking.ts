import { z } from "zod";

export const bookingSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  leadId: z.string().optional().or(z.literal("")),
  propertyName: z.string().min(1, "Property name is required").max(200),
  service: z.string().max(200).optional().or(z.literal("")),
  roomNumber: z.string().max(50).optional().or(z.literal("")),
  checkInDate: z.coerce.date({ message: "Check-in date is required" }),
  checkOutDate: z.coerce.date({ message: "Check-out date is required" }),
  guests: z.coerce.number().min(1).max(100).default(1),
  status: z
    .enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "COMPLETED"])
    .default("PENDING"),
  totalAmount: z.coerce.number().min(0, "Amount must be positive"),
  notes: z.string().max(5000).optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingSearchSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "COMPLETED"])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type BookingSearchParams = z.infer<typeof bookingSearchSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "COMPLETED"]),
});
