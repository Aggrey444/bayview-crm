import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerList } from "@/components/customers/customer-list";
import { getCustomers } from "@/lib/queries/customers";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; serviceId?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  if (!session.user.permissions.includes("customers.view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 mt-1">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  const params = await searchParams;
  const q = params.q || "";
  const serviceId = params.serviceId || "";
  const page = Number(params.page) || 1;

  const data = await getCustomers({ q, serviceId: serviceId || undefined, page, limit: 10 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your hotel guests and contacts."
      />
      <CustomerList
        initialCustomers={data.customers.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          services: c.services,
        }))}
        initialTotal={data.total}
        initialPage={data.page}
        initialTotalPages={data.totalPages}
        initialQuery={q}
        initialServiceId={serviceId}
      />
    </div>
  );
}
