import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { RoleList } from "@/components/roles/role-list";

export const metadata = { title: "Roles" };

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("roles.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q || "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const roles = await db.role.findMany({
    where,
    include: {
      _count: { select: { users: true, permissions: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and their permissions."
      />
      <RoleList
        initialRoles={roles.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
        initialQuery={q}
      />
    </div>
  );
}
