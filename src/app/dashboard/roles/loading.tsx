import { TableSkeleton } from "@/components/shared/skeletons";

export default function RolesLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
