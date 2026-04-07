import { useState, useEffect, useCallback, useMemo } from "react";
import { ClipboardList, Zap, ArrowUpDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const db = supabase.from as any;

interface Product { id: string; sku: string; name: string; family: string; }
interface Line { id: string; name: string; site: string; capacity_per_day: number; }
interface Mapping { id: string; product_id: string; line_id: string; unit_time: number; yield_pct: number; }

interface PlanRow {
  sku: string; product: string; line: string; demand: number; allocated: number;
  priority: "high" | "medium" | "low"; reason: string; stockDays: number; margin: number;
}

export default function SOPPlan() {
  const { user } = useAuth();
  const { data: appData, hasData } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"priority" | "margin" | "stock">("priority");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, lRes, mRes] = await Promise.all([
      db("sop_products").select("*").eq("user_id", user.id),
      db("sop_lines").select("*").eq("user_id", user.id),
      db("sop_mappings").select("*").eq("user_id", user.id),
    ]);
    setProducts((pRes.data ?? []) as Product[]);
    setLines((lRes.data ?? []) as Line[]);
    setMappings((mRes.data ?? []) as Mapping[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const planData = useMemo((): PlanRow[] => {
    if (mappings.length === 0) return [];

    // Compute demand per mapping based on forecast or equal distribution
    const avgMonthlyDemand = hasData && appData.forecasts
      ? appData.forecasts.models[0]?.predictions[0] ?? appData.timeSeries.slice(-1)[0]?.value ?? 1000
      : 1000;

    return mappings.map((m, idx) => {
      const prod = products.find(p => p.id === m.product_id);
      const line = lines.find(l => l.id === m.line_id);
      if (!prod || !line) return null;

      const demand = Math.round(avgMonthlyDemand / mappings.length);
      const capPerDay = Math.floor((line.capacity_per_day / m.unit_time) * (m.yield_pct / 100));
      const monthlyCapacity = capPerDay * 22;
      const allocated = Math.min(demand, monthlyCapacity);
      const stockDays = Math.round(5 + (allocated / demand) * 15);
      const margin = Math.round(20 + (m.yield_pct - 90) * 2);

      let priority: "high" | "medium" | "low" = "medium";
      let reason = "Standard";
      if (stockDays <= 5) { priority = "high"; reason = `Stock faible (${stockDays}j)`; }
      else if (allocated < demand) { priority = "high"; reason = "Capacité insuffisante"; }
      else if (margin > 35) { priority = "medium"; reason = "Marge élevée"; }
      else { priority = "low"; reason = "Stock confortable"; }

      return { sku: prod.sku, product: prod.name, line: line.name, demand, allocated, priority, reason, stockDays, margin };
    }).filter(Boolean) as PlanRow[];
  }, [products, lines, mappings, hasData, appData]);

  const sorted = [...planData].sort((a, b) => {
    if (sortBy === "priority") { const order = { high: 0, medium: 1, low: 2 }; return order[a.priority] - order[b.priority]; }
    if (sortBy === "margin") return b.margin - a.margin;
    return a.stockDays - b.stockDays;
  });

  const totalDemand = planData.reduce((s, r) => s + r.demand, 0);
  const totalAllocated = planData.reduce((s, r) => s + r.allocated, 0);
  const fulfillment = totalDemand > 0 ? ((totalAllocated / totalDemand) * 100).toFixed(1) : "0";

  if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Chargement...</div>;

  if (planData.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Plan de production" description="Allocation optimisée par ligne et priorité" icon={<ClipboardList className="h-5 w-5" />} />
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Configurez des mappings produit → ligne dans <b>Structure</b> pour générer le plan de production.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Plan de production" description="Allocation optimisée par ligne et priorité" icon={<ClipboardList className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: "Demande totale", value: totalDemand.toLocaleString() },
          { label: "Production allouée", value: totalAllocated.toLocaleString() },
          { label: "Taux de couverture", value: `${fulfillment}%` },
          { label: "Écart", value: `${(totalAllocated - totalDemand).toLocaleString()}` },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-card-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-primary">Optimisation automatique</p>
          <p className="text-xs text-primary/80 mt-1">
            Allocation basée sur : stock faible → capacité ligne → marge produit. Les produits critiques sont priorisés.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Trier par :</span>
        {([
          { key: "priority" as const, label: "Priorité" },
          { key: "stock" as const, label: "Stock faible" },
          { key: "margin" as const, label: "Marge" },
        ]).map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
              sortBy === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
            {s.label}
          </button>
        ))}
      </div>

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
                const priorityConfig = { high: { label: "Haute", cls: "bg-destructive/10 text-destructive" }, medium: { label: "Moyenne", cls: "bg-warning/10 text-warning" }, low: { label: "Basse", cls: "bg-muted text-muted-foreground" } };
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-card-foreground">{r.sku}</td>
                    <td className="px-4 py-3 text-card-foreground">{r.product}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{r.line}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{r.demand}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", gap < 0 ? "text-destructive" : "text-card-foreground")}>{r.allocated}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", priorityConfig[r.priority].cls)}>
                        {priorityConfig[r.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-medium", r.stockDays <= 5 ? "text-destructive" : "text-card-foreground")}>{r.stockDays}</span>
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
