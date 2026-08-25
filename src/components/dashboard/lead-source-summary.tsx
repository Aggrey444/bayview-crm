import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

type SourceData = {
  name: string;
  count: number;
  percentage: number;
};

const barGradients = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-orange-500 to-orange-600",
];

export function LeadSourceSummary({ sources }: { sources: SourceData[] }) {
  if (sources.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>Where your leads come from.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/30">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">No source data yet</p>
            <p className="mt-1 text-xs text-zinc-500">Lead sources will appear as leads are created.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Lead Sources</CardTitle>
        <CardDescription>Where your leads come from.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.map((source, i) => (
            <div key={source.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{source.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{source.count}</span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-1.5 py-0.5">
                    {source.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradients[i % barGradients.length]} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(source.percentage, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
