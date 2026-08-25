import { TableSkeleton } from "@/components/shared/skeletons";

export default function UsersLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
