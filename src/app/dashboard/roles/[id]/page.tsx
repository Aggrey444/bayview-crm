import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Pencil, Shield, Users, Key } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const role = await db.role.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: role ? `Role — ${role.name}` : "Role Not Found" };
}

export default async function RoleDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const role = await db.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  if (!role) notFound();

  // Group permissions by module
  const permsByModule = role.permissions
    .map((rp) => rp.permission)
    .reduce(
      (acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
      },
      {} as Record<string, typeof role.permissions[number]["permission"][]>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        description={role.description || "No description"}
        actions={
          !role.isSystem ? (
            <Link
              href={`/dashboard/roles/${role.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Shield className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Type</p>
              <Badge variant="secondary" className="text-[10px]">
                {role.isSystem ? "System Role" : "Custom Role"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Users className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Assigned Users</p>
              <p className="text-sm font-medium">{role._count.users}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4">
            <Key className="h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500">Permissions</p>
              <p className="text-sm font-medium">{role.permissions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-4">Assigned Permissions</h3>
          {Object.entries(permsByModule).length === 0 ? (
            <p className="text-sm text-zinc-500">No permissions assigned.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(permsByModule).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    {module.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <Badge key={perm.id} variant="secondary" className="text-xs">
                        {perm.action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
