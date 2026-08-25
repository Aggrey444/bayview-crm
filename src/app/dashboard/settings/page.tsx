import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata = { title: "Settings - Bayview Village CRM" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("settings.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  let user = null;

  try {
    if (session.user.id) {
      user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          role: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    }

    if (!user && session.user.email) {
      user = await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          role: { select: { id: true, name: true } },
          createdAt: true,
        },
      });
    }
  } catch (err) {
    console.error("Error fetching user for settings:", err);
  }

  // Fallback to session details if DB record is unavailable
  const safeUser = user || {
    id: session.user.id || "1",
    name: session.user.name || "User",
    email: session.user.email || "user@bayview.com",
    role: session.user.role || null,
    createdAt: new Date(),
  };

  let dbStatus = "Connected";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "Disconnected";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system settings, preferences, profile, and security."
      />
      <SettingsClient user={safeUser} dbStatus={dbStatus} />
    </div>
  );
}
