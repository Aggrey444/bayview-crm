import { PrismaClient } from "@prisma/client/index";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ALL_PERMISSION_KEYS } from "../src/lib/permissions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ─── Permissions ────────────────────────────────────
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`  Seeded ${PERMISSIONS.length} permissions`);

  // ─── Roles ──────────────────────────────────────────

  // Admin: all permissions
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: { description: "Full system access", viewAllData: true },
    create: {
      name: "Admin",
      description: "Full system access",
      isSystem: true,
      viewAllData: true,
    },
  });

  // Assign all permissions to Admin
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Manager: CRM + marketing + reports, no user/role management
  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: { description: "Manage CRM operations and view reports", viewAllData: true },
    create: {
      name: "Manager",
      description: "Manage CRM operations and view reports",
      isSystem: true,
      viewAllData: true,
    },
  });

  const managerPermKeys = ALL_PERMISSION_KEYS.filter(
    (k) => !k.startsWith("users.") && !k.startsWith("roles.") && !k.startsWith("audit.")
  );
  const managerPerms = await prisma.permission.findMany({
    where: { key: { in: managerPermKeys } },
  });
  for (const perm of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: managerRole.id, permissionId: perm.id },
    });
  }

  // Staff: minimal - view/create/edit assigned leads, customers, bookings, follow-ups, activities
  const staffRole = await prisma.role.upsert({
    where: { name: "Staff" },
    update: { description: "Basic access to assigned items only", viewAllData: false },
    create: {
      name: "Staff",
      description: "Basic access to assigned items only",
      isSystem: true,
      viewAllData: false,
    },
  });

  const staffPermKeys = [
    "leads.view", "leads.create", "leads.edit",
    "customers.view", "customers.create", "customers.edit",
    "bookings.view", "bookings.create", "bookings.edit",
    "followUps.view", "followUps.create", "followUps.edit",
    "activities.view", "activities.create", "activities.edit",
    "settings.view",
  ];
  const staffPerms = await prisma.permission.findMany({
    where: { key: { in: staffPermKeys } },
  });
  for (const perm of staffPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: staffRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: staffRole.id, permissionId: perm.id },
    });
  }

  console.log("  Seeded 3 roles (Admin, Manager, Staff) with permissions");

  // ─── Users ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bayview.com" },
    update: { roleId: adminRole.id },
    create: {
      name: "Admin User",
      email: "admin@bayview.com",
      passwordHash,
      roleId: adminRole.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@bayview.com" },
    update: { roleId: managerRole.id },
    create: {
      name: "Manager User",
      email: "manager@bayview.com",
      passwordHash,
      roleId: managerRole.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@bayview.com" },
    update: { roleId: staffRole.id },
    create: {
      name: "Staff User",
      email: "staff@bayview.com",
      passwordHash,
      roleId: staffRole.id,
    },
  });

  console.log("  Seeded 3 users (admin@bayview.com, manager@bayview.com, staff@bayview.com) — password: password123");

  // ─── Lead Sources ───────────────────────────────────
  const sources = [
    "Facebook",
    "Instagram",
    "TikTok",
    "Google",
    "Website",
    "WhatsApp",
    "Phone",
    "Walk-in",
    "Referral",
    "Other",
  ];

  for (const name of sources) {
    await prisma.leadSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Seeded ${sources.length} lead sources`);

  // ─── Lead Statuses ──────────────────────────────────
  const statuses = [
    { name: "New", sortOrder: 0 },
    { name: "Contacted", sortOrder: 1 },
    { name: "Interested", sortOrder: 2 },
    { name: "Quote Sent", sortOrder: 3 },
    { name: "Follow Up", sortOrder: 4 },
    { name: "Booked", sortOrder: 5 },
    { name: "Paid", sortOrder: 6 },
    { name: "Completed", sortOrder: 7 },
    { name: "Lost", sortOrder: 8 },
  ];

  for (const { name, sortOrder } of statuses) {
    await prisma.leadStatus.upsert({
      where: { name },
      update: { sortOrder },
      create: { name, sortOrder },
    });
  }
  console.log(`  Seeded ${statuses.length} lead statuses`);

  // ─── Services ─────────────────────────────────────
  const services = [
    "Hotel Accommodation",
    "Event Venue Rental",
    "Pool Facilities",
    "Conference & Meeting Facilities",
    "Birthday & Private Parties",
    "Weddings & Celebrations",
    "Corporate Events & Retreats",
    "Food & Dining",
    "Live Sports Entertainment",
    "General Event Support",
  ];

  for (const name of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  Seeded ${services.length} services`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
