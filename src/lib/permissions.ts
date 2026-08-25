export const PERMISSIONS = [
  // Leads
  { key: "leads.view", module: "leads", action: "view", description: "View leads" },
  { key: "leads.create", module: "leads", action: "create", description: "Create leads" },
  { key: "leads.edit", module: "leads", action: "edit", description: "Edit leads" },
  { key: "leads.delete", module: "leads", action: "delete", description: "Delete leads" },

  // Customers
  { key: "customers.view", module: "customers", action: "view", description: "View customers" },
  { key: "customers.create", module: "customers", action: "create", description: "Create customers" },
  { key: "customers.edit", module: "customers", action: "edit", description: "Edit customers" },
  { key: "customers.delete", module: "customers", action: "delete", description: "Delete customers" },

  // Bookings
  { key: "bookings.view", module: "bookings", action: "view", description: "View bookings" },
  { key: "bookings.create", module: "bookings", action: "create", description: "Create bookings" },
  { key: "bookings.edit", module: "bookings", action: "edit", description: "Edit bookings" },
  { key: "bookings.delete", module: "bookings", action: "delete", description: "Delete bookings" },

  // Payments
  { key: "payments.view", module: "payments", action: "view", description: "View payments" },
  { key: "payments.create", module: "payments", action: "create", description: "Create payments" },
  { key: "payments.edit", module: "payments", action: "edit", description: "Edit payments" },
  { key: "payments.delete", module: "payments", action: "delete", description: "Delete payments" },

  // Campaigns
  { key: "campaigns.view", module: "campaigns", action: "view", description: "View campaigns" },
  { key: "campaigns.create", module: "campaigns", action: "create", description: "Create campaigns" },
  { key: "campaigns.edit", module: "campaigns", action: "edit", description: "Edit campaigns" },
  { key: "campaigns.delete", module: "campaigns", action: "delete", description: "Delete campaigns" },

  // Messages
  { key: "messages.view", module: "messages", action: "view", description: "View messages" },
  { key: "messages.create", module: "messages", action: "create", description: "Create messages" },
  { key: "messages.edit", module: "messages", action: "edit", description: "Edit messages" },
  { key: "messages.delete", module: "messages", action: "delete", description: "Delete messages" },

  // Follow-ups
  { key: "followUps.view", module: "followUps", action: "view", description: "View follow-ups" },
  { key: "followUps.create", module: "followUps", action: "create", description: "Create follow-ups" },
  { key: "followUps.edit", module: "followUps", action: "edit", description: "Edit follow-ups" },
  { key: "followUps.delete", module: "followUps", action: "delete", description: "Delete follow-ups" },

  // Activities
  { key: "activities.view", module: "activities", action: "view", description: "View activities" },
  { key: "activities.create", module: "activities", action: "create", description: "Create activities" },
  { key: "activities.edit", module: "activities", action: "edit", description: "Edit activities" },
  { key: "activities.delete", module: "activities", action: "delete", description: "Delete activities" },

  // Reports
  { key: "reports.view", module: "reports", action: "view", description: "View reports" },

  // Audit
  { key: "audit.view", module: "audit", action: "view", description: "View audit log" },

  // Users
  { key: "users.view", module: "users", action: "view", description: "View users" },
  { key: "users.create", module: "users", action: "create", description: "Create users" },
  { key: "users.edit", module: "users", action: "edit", description: "Edit users" },
  { key: "users.delete", module: "users", action: "delete", description: "Delete users" },

  // Roles
  { key: "roles.view", module: "roles", action: "view", description: "View roles" },
  { key: "roles.create", module: "roles", action: "create", description: "Create roles" },
  { key: "roles.edit", module: "roles", action: "edit", description: "Edit roles" },
  { key: "roles.delete", module: "roles", action: "delete", description: "Delete roles" },

  // Settings
  { key: "settings.view", module: "settings", action: "view", description: "View settings" },
  { key: "settings.edit", module: "settings", action: "edit", description: "Edit settings" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

export const MODULES = [
  "leads",
  "customers",
  "bookings",
  "payments",
  "campaigns",
  "messages",
  "followUps",
  "activities",
  "reports",
  "audit",
  "users",
  "roles",
  "settings",
] as const;

export function getPermissionsForModule(module: string) {
  return PERMISSIONS.filter((p) => p.module === module);
}
