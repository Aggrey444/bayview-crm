import { db } from "@/lib/prisma";
import type { MessageSearchParams } from "@/lib/validations/message";

export async function getMessages(params: MessageSearchParams) {
  const { q, channel, customerId, campaignId, page, limit } = params;
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
  if (campaignId) where.campaignId = campaignId;

  const [messages, total] = await Promise.all([
    db.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        sender: { select: { id: true, name: true } },
      },
    }),
    db.message.count({ where }),
  ]);

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMessageById(id: string) {
  return db.message.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      sender: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
    },
  });
}
