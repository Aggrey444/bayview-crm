import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export const metadata = { title: "Add Customer" };

export default async function NewCustomerPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Customer"
        description="Create a new customer record."
      />
      <CustomerForm mode="create" />
    </div>
  );
}
