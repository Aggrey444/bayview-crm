import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("audit.view");
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || undefined;
  const entity = searchParams.get("entity") || undefined;
  const action = searchParams.get("action") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  // Log the admin viewing the audit trail
  await auditLog({
    userId: authResult.user.id,
    action: "AUDLOG_VIEWED",
    entity: "AuditLog",
    request,
  });

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
