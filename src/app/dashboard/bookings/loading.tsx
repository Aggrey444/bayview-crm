import { TableSkeleton } from "@/components/shared/skeletons";

export default function BookingsLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
