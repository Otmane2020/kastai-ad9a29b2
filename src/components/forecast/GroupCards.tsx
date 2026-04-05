import { cn } from "@/lib/utils";
import { GroupForecast } from "@/context/DataContext";

interface GroupCardsProps {
  groups: { key: string; count: number; total: number }[];
  selectedGroup: string | null;
  setSelectedGroup: (g: string) => void;
  groupForecasts: GroupForecast[];
}

export default function GroupCards({ groups, selectedGroup, setSelectedGroup, groupForecasts }: GroupCardsProps) {
  if (groups.length <= 1) return null;

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
      {groups.slice(0, 10).map((g) => {
        const gf = groupForecasts.find((gf) => gf.groupKey === g.key);
        return (
          <button
            key={g.key}
            onClick={() => setSelectedGroup(g.key)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-left transition-all min-w-[140px]",
              selectedGroup === g.key
                ? "border-primary bg-primary/5 shadow-elevated"
                : "border-border bg-card hover:shadow-card"
            )}
          >
            <p className="text-xs font-semibold text-card-foreground truncate">{g.key}</p>
            <div className="flex gap-2 mt-1 text-[10px]">
              <span className="text-muted-foreground">{g.count} pts</span>
              {gf && <span className="text-success">MAPE {gf.forecasts.models[0].mape.toFixed(1)}%</span>}
            </div>
          </button>
        );
      })}
      {groups.length > 10 && (
        <div className="shrink-0 flex items-center px-3 text-xs text-muted-foreground">
          +{groups.length - 10} autres
        </div>
      )}
    </div>
  );
}
