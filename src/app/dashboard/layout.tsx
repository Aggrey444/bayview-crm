import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user} permissions={session.user.permissions}>
      {children}
    </DashboardShell>
  );
}
