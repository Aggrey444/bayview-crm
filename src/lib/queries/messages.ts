import { db } from "@/lib/prisma";
import type { MessageSearchParams } from "@/lib/validations/message";
import {
  type AccessContext,
  scopeFilter,
  mergeScope,
} from "@/lib/queries/access";

export async function getMessages(
  params: MessageSearchParams,
  ctx?: AccessContext,
) {
  const { q, channel, customerId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }
  if (channel) where.channel = channel;
  if (customerId) where.customerId = customerId;

  const finalWhere = ctx
    ? mergeScope(where, scopeFilter(ctx, "message"))
    : where;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: finalWhere,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        sender: { select: { id: true, name: true } },
      },
    }),
    db.message.count({ where: finalWhere }),
  ]);

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMessageById(id: string, ctx?: AccessContext) {
  const where = ctx
    ? mergeScope({ id }, scopeFilter(ctx, "message"))
    : { id };

  return db.message.findFirst({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      sender: { select: { id: true, name: true } },
    },
  });
}
