import { cn } from "@/lib/utils";

interface ModelInfo {
  name: string;
  mape: string;
  bias: string;
  selected: boolean;
}

export default function ModelCards({ models }: { models: ModelInfo[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      {models.map((m) => (
        <div key={m.name} className={cn(
          "rounded-xl border p-4 transition-all cursor-pointer",
          m.selected ? "border-primary bg-primary/5 shadow-elevated" : "border-border bg-card shadow-card hover:shadow-elevated"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs font-semibold text-card-foreground truncate">{m.name}</span>
            {m.selected && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Best</span>}
          </div>
          <div className="flex gap-3 text-xs">
            <div><span className="text-muted-foreground">MAPE: </span><span className="font-medium text-card-foreground">{m.mape}</span></div>
            <div><span className="text-muted-foreground">Biais: </span><span className="font-medium text-card-foreground">{m.bias}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
