import { db } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, string>;
}

export async function createNotification(params: CreateNotificationParams) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createNotificationsForAllStaff(
  params: Omit<CreateNotificationParams, "userId">
) {
  const users = await db.user.findMany({
    where: {
      role: {
        name: { in: ["Admin", "Manager"] },
      },
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  return db.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: params.type,
      title: params.title,
      message: params.message || null,
      link: params.link || null,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    })),
  });
}

// --- Convenience helpers for common events ---

export async function notifyNewLead(lead: { id: string; name: string; source?: string | null; assignedToId?: string | null }) {
  const message = `New lead "${lead.name}"${lead.source ? ` from ${lead.source}` : ""} needs attention.`;

  if (lead.assignedToId) {
    await createNotification({
      userId: lead.assignedToId,
      type: "NEW_LEAD",
      title: `New lead assigned: ${lead.name}`,
      message,
      link: `/dashboard/leads/${lead.id}`,
    });
  } else {
    await createNotificationsForAllStaff({
      type: "NEW_LEAD",
      title: `New lead: ${lead.name}`,
      message,
      link: `/dashboard/leads/${lead.id}`,
    });
  }
}

export async function notifyLeadAssigned(
  staffId: string,
  lead: { id: string; name: string }
) {
  await createNotification({
    userId: staffId,
    type: "LEAD_ASSIGNED",
    title: `Lead assigned to you: ${lead.name}`,
    message: `You have been assigned lead "${lead.name}".`,
    link: `/dashboard/leads/${lead.id}`,
  });
}

export async function notifyFollowUpDue(followUp: { id: string; title: string; assignedToId: string; leadId: string; leadName?: string }) {
  await createNotification({
    userId: followUp.assignedToId,
    type: "FOLLOW_UP_DUE",
    title: `Follow-up due: ${followUp.title}`,
    message: `Follow-up "${followUp.title}"${followUp.leadName ? ` for lead ${followUp.leadName}` : ""} is due today.`,
    link: `/dashboard/follow-ups`,
  });
}

export async function notifyFollowUpOverdue(followUp: { id: string; title: string; assignedToId: string; leadId: string; leadName?: string }) {
  await createNotification({
    userId: followUp.assignedToId,
    type: "FOLLOW_UP_OVERDUE",
    title: `Overdue follow-up: ${followUp.title}`,
    message: `Follow-up "${followUp.title}"${followUp.leadName ? ` for lead ${followUp.leadName}` : ""} is overdue!`,
    link: `/dashboard/follow-ups`,
  });
}

export async function notifyBookingCreated(booking: { id: string; customerName: string; propertyName: string }) {
  await createNotificationsForAllStaff({
    type: "BOOKING_CREATED",
    title: `New booking: ${booking.customerName}`,
    message: `Booking for ${booking.propertyName} has been created.`,
    link: `/dashboard/bookings/${booking.id}`,
  });
}

export async function notifyBookingConfirmed(booking: { id: string; customerName: string; propertyName: string }, assignedToId?: string | null) {
  if (assignedToId) {
    await createNotification({
      userId: assignedToId,
      type: "BOOKING_CONFIRMED",
      title: `Booking confirmed: ${booking.customerName}`,
      message: `Booking for ${booking.propertyName} has been confirmed.`,
      link: `/dashboard/bookings/${booking.id}`,
    });
  }
}

export async function notifyPaymentSuccessful(payment: { id: string; amount: number; currency: string; bookingId: string; customerName?: string }) {
  await createNotificationsForAllStaff({
    type: "PAYMENT_SUCCESSFUL",
    title: `Payment received: ${payment.currency} ${payment.amount.toFixed(2)}`,
    message: `Payment from ${payment.customerName || "customer"} has been processed successfully.`,
    link: `/dashboard/payments/${payment.id}`,
  });
}

export async function notifyPaymentFailed(payment: { id: string; amount: number; currency: string; bookingId: string; customerName?: string }) {
  await createNotificationsForAllStaff({
    type: "PAYMENT_FAILED",
    title: `Payment failed: ${payment.currency} ${payment.amount.toFixed(2)}`,
    message: `Payment from ${payment.customerName || "customer"} has failed.`,
    link: `/dashboard/payments/${payment.id}`,
  });
}
