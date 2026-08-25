import { TableSkeleton } from "@/components/shared/skeletons";

export default function LeadsLoading() {
  return <TableSkeleton rows={5} columns={5} />;
}
