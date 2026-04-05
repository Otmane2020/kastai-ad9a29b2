import { useState } from "react";
import { FlaskConical, Plus, Play, Trash2, TrendingUp, TrendingDown, Equal } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Scenario {
  id: string;
  name: string;
  type: "demand_up" | "demand_down" | "line_down" | "line_add";
  param: number; // % or line id
  results: { service: number; utilisation: number; backorders: number; stockDays: number };
}

const BASE_RESULTS = { service: 96.2, utilisation: 84.3, backorders: 12, stockDays: 18 };

const PRESET_SCENARIOS: Scenario[] = [
  { id: "s1", name: "Base (actuel)", type: "demand_up", param: 0, results: BASE_RESULTS },
  { id: "s2", name: "Demande +20%", type: "demand_up", param: 20, results: { service: 88.5, utilisation: 101.2, backorders: 45, stockDays: 8 } },
  { id: "s3", name: "Panne Ligne 2", type: "line_down", param: 2, results: { service: 82.1, utilisation: 110.5, backorders: 72, stockDays: 5 } },
  { id: "s4", name: "Ajout Ligne 4", type: "line_add", param: 4, results: { service: 98.8, utilisation: 68.2, backorders: 2, stockDays: 22 } },
];

const SCENARIO_TYPES = [
  { key: "demand_up", label: "↑ Augmentation demande", icon: TrendingUp },
  { key: "demand_down", label: "↓ Réduction demande", icon: TrendingDown },
  { key: "line_down", label: "⚠ Panne ligne", icon: TrendingDown },
  { key: "line_add", label: "＋ Ajout ligne", icon: TrendingUp },
];

export default function SOPScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>(PRESET_SCENARIOS);
  const [selectedIds, setSelectedIds] = useState<string[]>(["s1", "s2"]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selected = scenarios.filter((s) => selectedIds.includes(s.id));

  const comparisonData = [
    { kpi: "Service (%)", ...Object.fromEntries(selected.map((s) => [s.name, s.results.service])) },
    { kpi: "Utilisation (%)", ...Object.fromEntries(selected.map((s) => [s.name, s.results.utilisation])) },
    { kpi: "Backorders", ...Object.fromEntries(selected.map((s) => [s.name, s.results.backorders])) },
    { kpi: "Stock (j)", ...Object.fromEntries(selected.map((s) => [s.name, s.results.stockDays])) },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--destructive))", "hsl(var(--chart-3))"];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Scénarios S&OP" description="Simulation et comparaison de scénarios" icon={<FlaskConical className="h-5 w-5" />} />

      {/* Scenario cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {scenarios.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          const isBase = s.param === 0;
          return (
            <div
              key={s.id}
              onClick={() => toggleSelect(s.id)}
              className={cn(
                "rounded-xl border p-4 shadow-card cursor-pointer transition-all",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-sm font-semibold text-card-foreground">{s.name}</p>
                {isBase && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Référence</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className={cn("font-medium", s.results.service >= 95 ? "text-success" : "text-destructive")}>{s.results.service}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utilisation</p>
                  <p className={cn("font-medium", s.results.utilisation > 100 ? "text-destructive" : "text-card-foreground")}>{s.results.utilisation}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Backorders</p>
                  <p className={cn("font-medium", s.results.backorders > 20 ? "text-destructive" : "text-card-foreground")}>{s.results.backorders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-medium text-card-foreground">{s.results.stockDays}j</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison chart */}
      {selected.length >= 2 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">
            Comparaison : {selected.map((s) => s.name).join(" vs ")}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="kpi" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {selected.map((s, i) => (
                <Bar key={s.id} dataKey={s.name} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Impact summary table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-card-foreground">Tableau d'impact comparatif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scénario</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Service (%)</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Utilisation (%)</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Backorders</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock (j)</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Δ Service</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => {
                const delta = (s.results.service - BASE_RESULTS.service).toFixed(1);
                const deltaNum = parseFloat(delta);
                return (
                  <tr key={s.id} className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", selectedIds.includes(s.id) && "bg-primary/5")}>
                    <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{s.results.service}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(s.results.utilisation > 100 ? "text-destructive font-medium" : "text-card-foreground")}>
                        {s.results.utilisation}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">{s.results.backorders}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{s.results.stockDays}j</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", deltaNum > 0 ? "text-success" : deltaNum < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {deltaNum > 0 ? "+" : ""}{delta}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
