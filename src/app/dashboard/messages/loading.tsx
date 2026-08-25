import { TableSkeleton } from "@/components/shared/skeletons";

export default function MessagesLoading() {
  return <TableSkeleton rows={6} columns={3} />;
}
