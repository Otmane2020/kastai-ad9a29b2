import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { ForecastResult } from "@/lib/forecastEngine";
import { GroupForecast, TimeSeriesPoint } from "@/context/DataContext";
import { HorizonFilter } from "./ForecastFilters";

interface ModelInfo {
  name: string;
  mape: string;
  bias: string;
  mapeNum?: number;
  selected: boolean;
  predictions?: number[];
}

interface BacktestRow {
  p: string; r: string; pr: string; e: string;
}

function formatDate(baseDate: Date, offsetMonths: number): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offsetMonths, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

// Table: Prévisions par horizon with real values
function HorizonTable({ models, horizon, lastDate }: { models: ModelInfo[]; horizon: HorizonFilter; lastDate?: Date }) {
  const horizonSteps = { "1W": 1, "1M": 1, "3M": 3, "6M": 6, "12M": 12, "24M": 24 };
  const steps = Math.min(horizonSteps[horizon] || 6, 6);
  const base = lastDate || new Date();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">
        Prévisions par horizon ({horizon})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Modèle</th>
              {Array.from({ length: steps }, (_, i) => (
                <th key={i} className="pb-3 text-right text-xs font-medium text-muted-foreground">
                  {formatDate(base, i + 1)}
                </th>
              ))}
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">MAPE</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.name} className={cn("border-b border-border/50", m.selected && "bg-primary/5")}>
                <td className="py-3 text-card-foreground font-medium flex items-center gap-2">
                  {m.name}
                  {m.selected && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary font-bold">Best</span>}
                </td>
                {Array.from({ length: steps }, (_, i) => (
                  <td key={i} className="py-3 text-right text-card-foreground font-medium">
                    {m.predictions && m.predictions[i] != null
                      ? Math.round(m.predictions[i]).toLocaleString("fr-FR")
                      : "—"}
                  </td>
                ))}
                <td className="py-3 text-right font-medium text-success">{m.mape}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table: Comparaison modèles
function ModelComparisonTable({ models }: { models: ModelInfo[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">
        🏆 Comparaison des modèles
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Modèle</th>
            <th className="pb-3 text-right text-xs font-medium text-muted-foreground">MAPE (%)</th>
            <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Biais (%)</th>
            <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Rang</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m, i) => (
            <tr key={m.name} className={cn("border-b border-border/50", m.selected && "bg-primary/5")}>
              <td className="py-3 text-card-foreground font-medium">{m.name}</td>
              <td className="py-3 text-right text-success font-medium">{m.mape}</td>
              <td className="py-3 text-right text-card-foreground">{m.bias}</td>
              <td className="py-3 text-right">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  i === 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}>#{i + 1}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Table: Prévisions par SKU with all forecast periods
function SKUTable({ groupForecasts, lastDate }: { groupForecasts: GroupForecast[]; lastDate?: Date }) {
  if (groupForecasts.length === 0) return null;
  const maxPreds = Math.min(6, Math.max(...groupForecasts.map(gf => gf.forecasts.models[0]?.predictions?.length || 0)));
  const base = lastDate || new Date();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">
        Synthèse par SKU / Groupe ({groupForecasts.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Groupe</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Points</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Total hist.</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Modèle</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">MAPE</th>
              {Array.from({ length: maxPreds }, (_, i) => (
                <th key={i} className="pb-3 text-right text-xs font-medium text-muted-foreground">
                  {formatDate(base, i + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupForecasts.slice(0, 20).map((gf) => {
              const total = gf.timeSeries.reduce((s, p) => s + p.value, 0);
              const best = gf.forecasts.models[0];
              return (
                <tr key={gf.groupKey} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 text-card-foreground font-medium">{gf.groupKey}</td>
                  <td className="py-3 text-right text-muted-foreground">{gf.timeSeries.length}</td>
                  <td className="py-3 text-right text-card-foreground font-medium">{Math.round(total).toLocaleString("fr-FR")}</td>
                  <td className="py-3 text-right text-primary font-medium text-xs">{gf.forecasts.bestModel}</td>
                  <td className="py-3 text-right text-success font-medium">{best.mape.toFixed(1)}%</td>
                  {Array.from({ length: maxPreds }, (_, i) => (
                    <td key={i} className="py-3 text-right text-card-foreground font-semibold">
                      {best.predictions[i] != null ? Math.round(best.predictions[i]).toLocaleString("fr-FR") : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {groupForecasts.length > 20 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">+{groupForecasts.length - 20} autres groupes</p>
        )}
      </div>
    </div>
  );
}

// Backtesting table
function BacktestTable({ data }: { data: BacktestRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">🔬 Résultats du backtesting (20%)</h3>
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
          {data.map((row) => (
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
  );
}

// MAPE bar chart
function MAPEBarChart({ models }: { models: ModelInfo[] }) {
  return (
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
  );
}

export { HorizonTable, ModelComparisonTable, SKUTable, BacktestTable, MAPEBarChart };
