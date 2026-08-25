import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerById } from "@/lib/queries/customers";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await getCustomerById(id);
  return { title: customer ? `Edit ${customer.name}` : "Customer Not Found" };
}

export default async function EditCustomerPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${customer.name}`}
        description="Update customer details."
      />
      <CustomerForm
        mode="edit"
        customerId={customer.id}
        defaultValues={{
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          company: customer.company || "",
          address: customer.address || "",
          notes: customer.notes || "",
        }}
        defaultServiceIds={customer.services.map((s) => s.id)}
      />
    </div>
  );
}
