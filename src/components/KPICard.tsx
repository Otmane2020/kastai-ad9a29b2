import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: ReactNode;
  className?: string;
}

export default function KPICard({ title, value, change, changeType = "neutral", icon, className }: KPICardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-elevated", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-card-foreground">{value}</p>
          {change && (
            <p className={cn(
              "mt-1 text-xs font-medium",
              changeType === "up" && "text-success",
              changeType === "down" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
