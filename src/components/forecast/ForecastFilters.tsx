import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupForecast, TimeSeriesPoint } from "@/context/DataContext";

export type ViewLevel = "global" | "sku" | "family" | "subfamily";

export const VIEW_LABELS: Record<ViewLevel, string> = {
  global: "🌐 Global",
  sku: "📦 Par SKU",
  family: "🏷️ Par Famille",
  subfamily: "🔀 Sous-famille",
};

export type HorizonFilter = "1W" | "1M" | "3M" | "6M" | "12M" | "24M";

export const HORIZON_OPTIONS: { value: HorizonFilter; label: string }[] = [
  { value: "1W", label: "1 Sem." },
  { value: "1M", label: "1 Mois" },
  { value: "3M", label: "3 Mois" },
  { value: "6M", label: "6 Mois" },
  { value: "12M", label: "12 Mois" },
  { value: "24M", label: "24 Mois" },
];

interface ForecastFiltersProps {
  viewLevel: ViewLevel;
  setViewLevel: (v: ViewLevel) => void;
  availableLevels: ViewLevel[];
  selectedGroup: string | null;
  setSelectedGroup: (g: string) => void;
  groups: { key: string; count: number; total: number }[];
  selectedHorizon: HorizonFilter;
  setSelectedHorizon: (h: HorizonFilter) => void;
  forecastInfo: { bestModel: string; points: number; horizon: number } | null;
}

export default function ForecastFilters({
  viewLevel, setViewLevel, availableLevels,
  selectedGroup, setSelectedGroup, groups,
  selectedHorizon, setSelectedHorizon, forecastInfo,
}: ForecastFiltersProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {/* View level tabs */}
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          {availableLevels.map((level) => (
            <button
              key={level}
              onClick={() => setViewLevel(level)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all border-r border-border last:border-r-0",
                viewLevel === level
                  ? "gradient-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-card-foreground"
              )}
            >
              {VIEW_LABELS[level]}
            </button>
          ))}
        </div>

        {/* Group selector */}
        {viewLevel !== "global" && groups.length > 0 && (
          <select
            value={selectedGroup || ""}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground"
          >
            {groups.map((g) => (
              <option key={g.key} value={g.key}>{g.key} ({g.count} pts)</option>
            ))}
          </select>
        )}

        {/* Horizon filter */}
        <div className="flex rounded-lg border border-border bg-card overflow-hidden ml-auto">
          {HORIZON_OPTIONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setSelectedHorizon(h.value)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-all border-r border-border last:border-r-0",
                selectedHorizon === h.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {h.label}
            </button>
          ))}
        </div>

        {forecastInfo && (
          <span className="text-xs text-muted-foreground">
            {forecastInfo.points} pts · Best: {forecastInfo.bestModel}
          </span>
        )}
      </div>
    </div>
  );
}
