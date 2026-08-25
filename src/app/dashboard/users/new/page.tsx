import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/components/users/user-form";

export const metadata = { title: "New User" };

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <PageHeader title="New User" description="Create a new user account." />
      <UserForm mode="create" />
    </div>
  );
}
