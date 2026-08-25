import { TableSkeleton } from "@/components/shared/skeletons";

export default function FollowUpsLoading() {
  return <TableSkeleton rows={5} columns={4} />;
}
