import { ClipboardList, Zap, ArrowUpDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PlanRow {
  sku: string;
  product: string;
  line: string;
  demand: number;
  allocated: number;
  priority: "high" | "medium" | "low";
  reason: string;
  stockDays: number;
  margin: number;
}

const PLAN_DATA: PlanRow[] = [
  { sku: "SKU-001", product: "Produit Alpha", line: "Ligne 1", demand: 500, allocated: 500, priority: "high", reason: "Stock faible (3j)", stockDays: 3, margin: 35 },
  { sku: "SKU-002", product: "Produit Beta", line: "Ligne 1", demand: 300, allocated: 280, priority: "medium", reason: "Marge élevée", stockDays: 12, margin: 42 },
  { sku: "SKU-003", product: "Produit Gamma", line: "Ligne 3", demand: 800, allocated: 800, priority: "high", reason: "Délai client 5j", stockDays: 5, margin: 28 },
  { sku: "SKU-004", product: "Produit Delta", line: "Ligne 2", demand: 400, allocated: 350, priority: "low", reason: "Stock confortable", stockDays: 25, margin: 18 },
  { sku: "SKU-001", product: "Produit Alpha", line: "Ligne 2", demand: 200, allocated: 200, priority: "high", reason: "Overflow Ligne 1", stockDays: 3, margin: 35 },
];

const priorityConfig = {
  high: { label: "Haute", class: "bg-destructive/10 text-destructive" },
  medium: { label: "Moyenne", class: "bg-warning/10 text-warning" },
  low: { label: "Basse", class: "bg-muted text-muted-foreground" },
};

export default function SOPPlan() {
  const [sortBy, setSortBy] = useState<"priority" | "margin" | "stock">("priority");

  const sorted = [...PLAN_DATA].sort((a, b) => {
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (sortBy === "margin") return b.margin - a.margin;
    return a.stockDays - b.stockDays;
  });

  const totalDemand = PLAN_DATA.reduce((s, r) => s + r.demand, 0);
  const totalAllocated = PLAN_DATA.reduce((s, r) => s + r.allocated, 0);
  const fulfillment = ((totalAllocated / totalDemand) * 100).toFixed(1);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Plan de production" description="Allocation optimisée par ligne et priorité" icon={<ClipboardList className="h-5 w-5" />} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Demande totale", value: totalDemand.toLocaleString() },
          { label: "Production allouée", value: totalAllocated.toLocaleString() },
          { label: "Taux de couverture", value: `${fulfillment}%` },
          { label: "Écart", value: `${(totalAllocated - totalDemand).toLocaleString()}` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-card-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Optimization info */}
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary">Optimisation automatique</p>
          <p className="text-xs text-primary/80 mt-1">
            Allocation basée sur : stock faible → délai client → marge produit. Les produits critiques sont priorisés.
          </p>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Trier par :</span>
        {([
          { key: "priority" as const, label: "Priorité" },
          { key: "stock" as const, label: "Stock faible" },
          { key: "margin" as const, label: "Marge" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              sortBy === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Plan table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ligne</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Demande</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Alloué</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Priorité</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Raison</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock (j)</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Marge (%)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const gap = r.allocated - r.demand;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-card-foreground">{r.sku}</td>
                    <td className="px-4 py-3 text-card-foreground">{r.product}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{r.line}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{r.demand}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", gap < 0 ? "text-destructive" : "text-card-foreground")}>
                        {r.allocated}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", priorityConfig[r.priority].class)}>
                        {priorityConfig[r.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", r.stockDays <= 5 ? "text-destructive" : "text-card-foreground")}>
                        {r.stockDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-card-foreground">{r.margin}%</td>
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
