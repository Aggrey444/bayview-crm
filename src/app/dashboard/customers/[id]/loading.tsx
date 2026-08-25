import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/skeletons";

export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Loading..." description="" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
