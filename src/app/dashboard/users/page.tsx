import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { UserList } from "@/components/users/user-list";

export const metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; roleId?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("users.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q || "";
  const roleId = params.roleId || "";
  const page = Number(params.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (roleId) {
    where.roleId = roleId;
  }

  const [users, total, roles] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        image: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
    db.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts and roles."
      />
      <UserList
        initialUsers={users.map((u) => ({
          ...u,
          roleName: u.role?.name || "No Role",
          createdAt: u.createdAt.toISOString(),
        }))}
        initialTotal={total}
        initialPage={page}
        initialTotalPages={Math.ceil(total / limit)}
        initialQuery={q}
        initialRoleId={roleId}
        roles={roles}
      />
    </div>
  );
}
