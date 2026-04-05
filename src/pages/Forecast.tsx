import { TrendingUp, Filter } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData, Granularity, GroupForecast, TimeSeriesPoint } from "@/context/DataContext";
import { ForecastResult } from "@/lib/forecastEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from "recharts";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MODEL_COLORS = [
  "hsl(152, 69%, 40%)", "hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
];

type ViewLevel = "global" | "sku" | "family" | "subfamily";

const VIEW_LABELS: Record<ViewLevel, string> = {
  global: "🌐 Global",
  sku: "📦 Par SKU",
  family: "🏷️ Par Famille",
  subfamily: "🔀 Sous-famille",
};

// Aggregate time series to monthly buckets
function aggregateMonthly(ts: TimeSeriesPoint[]): { label: string; value: number; date: Date }[] {
  const buckets = new Map<string, { total: number; date: Date }>();
  for (const p of ts) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
    const label = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    if (!buckets.has(key)) buckets.set(key, { total: 0, date: new Date(p.date.getFullYear(), p.date.getMonth(), 1) });
    buckets.get(key)!.total += p.value;
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label: v.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      value: Math.round(v.total),
      date: v.date,
    }));
}

// Get groups based on view level
function getGroups(ts: TimeSeriesPoint[], level: ViewLevel): Map<string, TimeSeriesPoint[]> {
  const groups = new Map<string, TimeSeriesPoint[]>();
  for (const p of ts) {
    let key: string;
    switch (level) {
      case "sku": key = p.product || "Inconnu"; break;
      case "family": key = p.category || "Inconnu"; break;
      case "subfamily": key = `${p.product || "?"}×${p.category || "?"}`; break;
      default: key = "Global"; break;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return groups;
}

export default function Forecast() {
  const { data, hasData } = useData();
  const [viewLevel, setViewLevel] = useState<ViewLevel>("global");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Available view levels based on data
  const availableLevels = useMemo(() => {
    const levels: ViewLevel[] = ["global"];
    if (hasData && data.mapping?.productCol) levels.push("sku");
    if (hasData && data.mapping?.categoryCol) levels.push("family");
    if (hasData && data.mapping?.productCol && data.mapping?.categoryCol) levels.push("subfamily");
    return levels;
  }, [hasData, data.mapping]);

  // Groups for current level
  const groups = useMemo(() => {
    if (!hasData) return [];
    const g = getGroups(data.timeSeries, viewLevel);
    return Array.from(g.entries())
      .map(([key, pts]) => ({ key, count: pts.length, total: pts.reduce((s, p) => s + p.value, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [hasData, data.timeSeries, viewLevel]);

  // Auto-select first group when changing level
  useMemo(() => {
    if (viewLevel === "global") {
      setSelectedGroup(null);
    } else if (groups.length > 0 && (!selectedGroup || !groups.find((g) => g.key === selectedGroup))) {
      setSelectedGroup(groups[0].key);
    }
  }, [viewLevel, groups]);

  // Build chart data
  const { chartData, models, backtestData, forecastInfo } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      const demoData = Array.from({ length: 12 }, (_, i) => {
        const base = 400 + i * 15 + Math.sin(i / 3) * 40;
        return {
          period: i < 9 ? `M${i + 1}` : `P+${i - 8}`,
          réel: i < 9 ? Math.round(base + (Math.random() - 0.5) * 30) : undefined,
          "Lissage Expo": Math.round(base + (Math.random() - 0.5) * 15),
          "Moyenne Mobile": Math.round(base + (Math.random() - 0.5) * 25),
        };
      });
      return {
        chartData: demoData,
        models: [
          { name: "Lissage Expo", mape: "4.2%", bias: "+1.1%", selected: true },
          { name: "Moyenne Mobile", mape: "5.8%", bias: "-0.5%", selected: false },
        ],
        backtestData: [
          { p: "Train set", r: "9 pts", pr: "95.8%", e: "MAPE 4.2%" },
          { p: "Test set", r: "3 pts", pr: "Lissage Expo", e: "Biais +1.1%" },
        ],
        forecastInfo: null,
      };
    }

    let activeFc: ForecastResult;
    let activeTs: TimeSeriesPoint[];

    if (viewLevel === "global") {
      activeFc = data.forecasts;
      activeTs = data.timeSeries;
    } else {
      // Find group forecast
      const gf = data.groupForecasts.find((g) => g.groupKey === selectedGroup);
      if (gf) {
        activeFc = gf.forecasts;
        activeTs = gf.timeSeries;
      } else {
        activeFc = data.forecasts;
        activeTs = data.timeSeries;
      }
    }

    // Aggregate to monthly
    const monthly = aggregateMonthly(activeTs);

    const chartData: Record<string, any>[] = monthly.map((m) => ({
      period: m.label,
      réel: m.value,
    }));

    // Add forecast periods
    if (activeFc) {
      activeFc.models.forEach((model) => {
        model.predictions.forEach((pred, i) => {
          const label = `P+${i + 1}`;
          let existing = chartData.find((r) => r.period === label);
          if (!existing) {
            existing = { period: label };
            chartData.push(existing);
          }
          existing[model.name] = Math.round(pred);
        });
      });
    }

    const models = activeFc.models.map((m, i) => ({
      name: m.name,
      mape: `${m.mape.toFixed(1)}%`,
      bias: `${m.bias >= 0 ? "+" : ""}${m.bias.toFixed(1)}%`,
      mapeNum: m.mape,
      selected: i === 0,
    }));

    const testSize = Math.max(2, Math.min(Math.floor(activeTs.length * 0.2), 6));
    const backtestData = [
      {
        p: "Train set",
        r: `${activeTs.length - testSize} pts`,
        pr: `${(100 - activeFc.models[0].mape).toFixed(1)}%`,
        e: `MAPE ${activeFc.models[0].mape.toFixed(1)}%`,
      },
      {
        p: "Test set",
        r: `${testSize} pts`,
        pr: activeFc.bestModel,
        e: `Biais ${activeFc.models[0].bias >= 0 ? "+" : ""}${activeFc.models[0].bias.toFixed(1)}%`,
      },
    ];

    return {
      chartData,
      models,
      backtestData,
      forecastInfo: {
        bestModel: activeFc.bestModel,
        points: activeTs.length,
        horizon: activeFc.horizon,
      },
    };
  }, [hasData, data, viewLevel, selectedGroup]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Prévisions" description="Visualisation des forecasts et comparaison des modèles" icon={<TrendingUp className="h-5 w-5" />} />
      <DataUploadBanner />

      {/* View level tabs */}
      {hasData && availableLevels.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
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
                  <option key={g.key} value={g.key}>
                    {g.key} ({g.count} pts)
                  </option>
                ))}
              </select>
            )}

            {forecastInfo && (
              <span className="ml-auto text-xs text-muted-foreground">
                {forecastInfo.points} points · Meilleur: {forecastInfo.bestModel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Group overview cards (when not global) */}
      {hasData && viewLevel !== "global" && groups.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {groups.slice(0, 10).map((g) => {
            const gf = data.groupForecasts.find((gf) => gf.groupKey === g.key);
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
      )}

      {/* Model cards */}
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

      {/* Main chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-semibold text-card-foreground">
            Prévisions multi-modèles
            {viewLevel !== "global" && selectedGroup && (
              <span className="ml-2 text-primary font-normal">— {selectedGroup}</span>
            )}
          </h3>
          <span className="text-xs text-muted-foreground">
            {viewLevel === "global" ? "Données agrégées (mensuel)" : `Niveau: ${VIEW_LABELS[viewLevel]}`}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 50%)" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(214, 20%, 90%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="réel" stroke="hsl(215, 25%, 20%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(215, 25%, 20%)" }} connectNulls={false} />
            {models.map((m, i) => (
              <Line
                key={m.name}
                type="monotone"
                dataKey={m.name}
                stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                strokeWidth={m.selected ? 2.5 : 1.5}
                strokeDasharray={m.selected ? undefined : "6 3"}
                dot={m.selected ? { r: 3, fill: MODEL_COLORS[i % MODEL_COLORS.length] } : false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Backtesting + Model comparison */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Backtesting table */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Résultats du backtesting</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Info</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Données</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Résultat</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Métrique</th>
              </tr>
            </thead>
            <tbody>
              {backtestData.map((row) => (
                <tr key={row.p} className="border-b border-border/50">
                  <td className="py-3 text-card-foreground">{row.p}</td>
                  <td className="py-3 text-right text-card-foreground">{row.r}</td>
                  <td className="py-3 text-right text-primary font-medium">{row.pr}</td>
                  <td className="py-3 text-right text-success font-medium">{row.e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Model MAPE comparison */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Comparaison MAPE (%)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={models} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(215, 15%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="mapeNum" radius={[0, 6, 6, 0]}>
                {models.map((m, i) => (
                  <Cell key={i} fill={m.selected ? "hsl(152, 69%, 40%)" : "hsl(217, 91%, 50%)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
