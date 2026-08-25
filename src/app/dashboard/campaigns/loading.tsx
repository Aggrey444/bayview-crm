import { TableSkeleton } from "@/components/shared/skeletons";

export default function CampaignsLoading() {
  return <TableSkeleton rows={4} columns={4} />;
}
