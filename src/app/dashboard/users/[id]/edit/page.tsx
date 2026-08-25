import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/components/users/user-form";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { name: true, email: true },
  });
  return { title: user ? `Edit User` : "User Not Found" };
}

export default async function EditUserPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit User" description="Update user details." />
      <UserForm
        mode="edit"
        userId={user.id}
        defaultValues={{
          name: user.name || "",
          email: user.email,
          roleId: user.roleId,
        }}
      />
    </div>
  );
}
