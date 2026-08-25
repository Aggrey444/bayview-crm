import { TableSkeleton } from "@/components/shared/skeletons";

export default function AuditLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
