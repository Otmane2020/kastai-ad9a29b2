import { cn } from "@/lib/utils";
import { CircleCheck, Circle } from "lucide-react";

interface ModelInfo {
  name: string;
  mape: string;
  bias: string;
  mae?: number;
  selected: boolean;
}

interface ModelCardsProps {
  models: ModelInfo[];
  onToggle?: (name: string) => void;
}

export default function ModelCards({ models, onToggle }: ModelCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 mb-6">
      {models.map((m) => (
        <div
          key={m.name}
          onClick={() => onToggle?.(m.name)}
          className={cn(
            "rounded-xl border p-4 transition-all cursor-pointer select-none",
            m.selected
              ? "border-primary bg-primary/5 shadow-elevated ring-1 ring-primary/20"
              : "border-border bg-card shadow-card hover:shadow-elevated hover:border-primary/40"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs font-semibold text-card-foreground truncate">{m.name}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {models.indexOf(m) === 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Best</span>
              )}
              {m.selected
                ? <CircleCheck className="h-4 w-4 text-primary" />
                : <Circle className="h-4 w-4 text-muted-foreground/40" />
              }
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="flex gap-3">
              <span><span className="text-muted-foreground">MAPE </span><span className="font-medium text-card-foreground">{m.mape}</span></span>
              <span><span className="text-muted-foreground">Biais </span><span className="font-medium text-card-foreground">{m.bias}</span></span>
            </div>
            {m.mae != null && m.mae > 0 && (
              <div>
                <span className="text-muted-foreground">MAE </span>
                <span className="font-medium text-card-foreground">{m.mae.toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
