import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { RoleForm } from "@/components/roles/role-form";

export const metadata = { title: "New Role" };

export default async function NewRolePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <PageHeader title="New Role" description="Create a new role with specific permissions." />
      <RoleForm mode="create" />
    </div>
  );
}
