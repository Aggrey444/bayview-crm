import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

const iconBgColors: Record<string, string> = {
  "text-blue-600": "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
  "text-emerald-600": "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  "text-violet-600": "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400",
  "text-amber-600": "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  "text-rose-600": "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400",
  "text-indigo-600": "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
  "text-teal-600": "bg-teal-500/10 text-teal-600 dark:bg-teal-400/15 dark:text-teal-400",
  "text-pink-600": "bg-pink-500/10 text-pink-600 dark:bg-pink-400/15 dark:text-pink-400",
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-zinc-500",
  trend,
  trendValue,
}: StatCardProps) {
  const iconBg = iconBgColors[iconColor] || "bg-zinc-500/10 text-zinc-500 dark:bg-zinc-400/10 dark:text-zinc-400";

  return (
    <Card className="group relative overflow-hidden shadow-card hover-lift transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[13px] font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(description || trendValue) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trendValue && (
              <span
                className={cn(
                  "font-medium",
                  trend === "up" && "text-emerald-600 dark:text-emerald-400",
                  trend === "down" && "text-red-600 dark:text-red-400"
                )}
              >
                {trend === "up" ? "+" : ""}
                {trendValue}
              </span>
            )}
            {description && (
              <span className={trendValue ? " ml-1" : ""}>{description}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
