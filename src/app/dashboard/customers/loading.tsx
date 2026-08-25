import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Loading customers..." />
      <TableSkeleton rows={8} columns={4} />
    </div>
  );
}
