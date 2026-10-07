export interface AccessContext {
  userId: string;
  canViewAll: boolean;
}

export type AccessModule =
  | "lead"
  | "customer"
  | "booking"
  | "payment"
  | "followUp"
  | "activity"
  | "message";

const scopes: Record<
  AccessModule,
  (userId: string) => Record<string, unknown>
> = {
  lead: (userId) => ({ assignedToId: userId }),
  customer: (userId) => ({ assignedToId: userId }),
  booking: (userId) => ({
    OR: [{ assignedToId: userId }, { createdById: userId }],
  }),
  payment: (userId) => ({
    booking: {
      OR: [{ assignedToId: userId }, { createdById: userId }],
    },
  }),
  followUp: (userId) => ({ assignedToId: userId }),
  activity: (userId) => ({
    OR: [
      { userId },
      { lead: { assignedToId: userId } },
      { customer: { assignedToId: userId } },
    ],
  }),
  message: (userId) => ({
    OR: [{ assignedToId: userId }, { senderId: userId }],
  }),
};

export function scopeFilter(
  _ctx: AccessContext,
  _module: AccessModule,
): Record<string, unknown> {
  // All CRM data (customers, leads, bookings, payments, activities) is global for all authenticated team members
  return {};
}

export function mergeScope(
  existing: Record<string, unknown>,
  scope: Record<string, unknown>,
): Record<string, unknown> {
  const scopeKeys = Object.keys(scope);
  const existingKeys = Object.keys(existing);
  if (scopeKeys.length === 0) return existing;
  if (existingKeys.length === 0) return scope;
  return { AND: [existing, scope] };
}

export function buildCtx(user: {
  id: string;
  role?: { viewAllData: boolean } | null;
}): AccessContext {
  return {
    userId: user.id,
    canViewAll: true, // Global shared data access across all resort staff & managers
  };
}
