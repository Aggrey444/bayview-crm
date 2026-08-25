import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { RoleForm } from "@/components/roles/role-form";
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
  return { title: role ? `Edit Role — ${role.name}` : "Role Not Found" };
}

export default async function EditRolePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const role = await db.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
      viewAllData: true,
      permissions: {
        select: { permissionId: true },
      },
    },
  });

  if (!role) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Role" description={`Editing ${role.name}`} />
      <RoleForm
        mode="edit"
        roleId={role.id}
        defaultValues={{
          name: role.name,
          description: role.description,
          viewAllData: role.viewAllData,
          permissionIds: role.permissions.map((p) => p.permissionId),
        }}
      />
    </div>
  );
}
