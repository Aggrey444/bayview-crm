import { db } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USER_ROLE_CHANGED"
  | "ROLE_CREATED"
  | "ROLE_UPDATED"
  | "ROLE_DELETED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_DELETED"
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_ASSIGNED"
  | "LEAD_DELETED"
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_DELETED"
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_STATUS_CHANGED"
  | "PAYMENT_DELETED"
  | "FOLLOWUP_CREATED"
  | "FOLLOWUP_COMPLETED"
  | "FOLLOWUP_DELETED"
  | "ACTIVITY_CREATED"
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_UPDATED"
  | "CAMPAIGN_DELETED"
  | "MESSAGE_CREATED"
  | "MESSAGE_UPDATED"
  | "MESSAGE_DELETED"
  | "BULK_MESSAGE_SENT"
  | "AUDLOG_VIEWED"
  | "SETTINGS_UPDATED";

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  request?: NextRequest;
}

function getClientIp(request?: NextRequest): string | null {
  if (!request) return null;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function auditLog(params: AuditLogParams) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        oldValues: params.oldValues as Prisma.InputJsonValue | undefined,
        newValues: params.newValues as Prisma.InputJsonValue | undefined,
        ipAddress: getClientIp(params.request),
      },
    });
  } catch {
    // Audit logging must never crash the request
  }
}
