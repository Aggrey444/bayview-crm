import { TableSkeleton } from "@/components/shared/skeletons";

export default function PaymentsLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
