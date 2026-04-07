import { useState, useEffect, useCallback, useMemo } from "react";
import { FlaskConical, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const db = supabase.from as any;

interface Scenario {
  id: string; name: string; type: string; param: number;
  results: { service: number; utilisation: number; backorders: number; stockDays: number };
}

const SCENARIO_TYPES = [
  { key: "demand_up", label: "↑ Augmentation demande" },
  { key: "demand_down", label: "↓ Réduction demande" },
  { key: "line_down", label: "⚠ Panne ligne" },
  { key: "line_add", label: "＋ Ajout ligne" },
];

export default function SOPScenarios() {
  const { user } = useAuth();
  const { data: appData, hasData } = useData();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);

  // New scenario form
  const [showNew, setShowNew] = useState(false);
  const [newScenario, setNewScenario] = useState({ name: "", type: "demand_up", param: 10 });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [sRes, lRes, mRes] = await Promise.all([
      db("sop_scenarios").select("*").eq("user_id", user.id).order("created_at"),
      db("sop_lines").select("*").eq("user_id", user.id),
      db("sop_mappings").select("*").eq("user_id", user.id),
    ]);
    const loaded = ((sRes.data ?? []) as any[]).map(s => ({
      ...s,
      results: typeof s.results === "string" ? JSON.parse(s.results) : (s.results ?? {}),
    }));
    setScenarios(loaded as Scenario[]);
    setLines(lRes.data ?? []);
    setMappings(mRes.data ?? []);
    if (loaded.length >= 2) setSelectedIds([loaded[0].id, loaded[1].id]);
    else if (loaded.length === 1) setSelectedIds([loaded[0].id]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute baseline from real data
  const baseline = useMemo(() => {
    const totalCap = lines.reduce((s: number, l: any) => s + (l.capacity_per_day ?? 480), 0);
    const monthlyCapacity = totalCap * 22;
    let avgDemand = monthlyCapacity * 0.85;
    if (hasData && appData.timeSeries.length > 0) {
      avgDemand = appData.timeSeries.slice(-6).reduce((s, p) => s + p.value, 0) / 6;
    }
    const utilisation = monthlyCapacity > 0 ? Math.round((avgDemand / monthlyCapacity) * 100 * 10) / 10 : 85;
    const service = Math.min(100, Math.round((monthlyCapacity / avgDemand) * 100 * 10) / 10);
    const backorders = service >= 100 ? 0 : Math.round((100 - service) * 5);
    const stockDays = Math.round(30 / (utilisation / 100));
    return { service, utilisation, backorders, stockDays, avgDemand, monthlyCapacity };
  }, [lines, hasData, appData]);

  const simulateScenario = (type: string, param: number) => {
    let demand = baseline.avgDemand;
    let capacity = baseline.monthlyCapacity;

    if (type === "demand_up") demand *= (1 + param / 100);
    if (type === "demand_down") demand *= (1 - param / 100);
    if (type === "line_down" && lines.length > 0) {
      const avgLineCap = capacity / lines.length;
      capacity -= avgLineCap;
    }
    if (type === "line_add") {
      const avgLineCap = lines.length > 0 ? capacity / lines.length : 480 * 22;
      capacity += avgLineCap;
    }

    const utilisation = capacity > 0 ? Math.round((demand / capacity) * 100 * 10) / 10 : 0;
    const service = Math.min(100, Math.round((capacity / demand) * 100 * 10) / 10);
    const backorders = service >= 100 ? 0 : Math.round((100 - service) * 5);
    const stockDays = Math.round(30 / (utilisation / 100));
    return { service, utilisation, backorders, stockDays };
  };

  const addScenario = async () => {
    if (!user || !newScenario.name) return;
    const results = simulateScenario(newScenario.type, newScenario.param);
    const { data } = await db("sop_scenarios").insert([{
      user_id: user.id, name: newScenario.name, type: newScenario.type, param: newScenario.param, results,
    }]).select().single();
    if (data) {
      const s = { ...data, results: typeof data.results === "string" ? JSON.parse(data.results) : data.results } as Scenario;
      setScenarios(prev => [...prev, s]);
      setShowNew(false);
      setNewScenario({ name: "", type: "demand_up", param: 10 });
    }
  };

  const deleteScenario = async (id: string) => {
    await db("sop_scenarios").delete().eq("id", id);
    setScenarios(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const selected = scenarios.filter(s => selectedIds.includes(s.id));
  const comparisonData = selected.length >= 2 ? [
    { kpi: "Service (%)", ...Object.fromEntries(selected.map(s => [s.name, s.results.service])) },
    { kpi: "Utilisation (%)", ...Object.fromEntries(selected.map(s => [s.name, s.results.utilisation])) },
    { kpi: "Backorders", ...Object.fromEntries(selected.map(s => [s.name, s.results.backorders])) },
    { kpi: "Stock (j)", ...Object.fromEntries(selected.map(s => [s.name, s.results.stockDays])) },
  ] : [];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--destructive))", "hsl(var(--chart-3))"];

  if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Scénarios S&OP" description="Simulation et comparaison de scénarios" icon={<FlaskConical className="h-5 w-5" />} />

      {/* Add scenario form */}
      <div className="mb-6">
        {showNew ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-card flex flex-wrap items-center gap-3">
            <input value={newScenario.name} onChange={e => setNewScenario({ ...newScenario, name: e.target.value })}
              placeholder="Nom du scénario" className="rounded border border-border bg-background px-3 py-1.5 text-xs flex-1 min-w-[150px]" />
            <select value={newScenario.type} onChange={e => setNewScenario({ ...newScenario, type: e.target.value })}
              className="rounded border border-border bg-background px-2 py-1.5 text-xs">
              {SCENARIO_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input type="number" value={newScenario.param} onChange={e => setNewScenario({ ...newScenario, param: Number(e.target.value) })}
                className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <button onClick={addScenario} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">Simuler</button>
            <button onClick={() => setShowNew(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
        ) : (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> Nouveau scénario
          </button>
        )}
      </div>

      {scenarios.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
          <FlaskConical className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Créez des scénarios pour comparer l'impact de différentes hypothèses sur votre S&OP.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {scenarios.map(s => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <div key={s.id} onClick={() => toggleSelect(s.id)}
                  className={cn("rounded-xl border p-4 shadow-card cursor-pointer transition-all",
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/30")}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-display text-sm font-semibold text-card-foreground">{s.name}</p>
                    <button onClick={e => { e.stopPropagation(); deleteScenario(s.id); }}
                      className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Service</p><p className={cn("font-medium", s.results.service >= 95 ? "text-success" : "text-destructive")}>{s.results.service}%</p></div>
                    <div><p className="text-muted-foreground">Utilisation</p><p className={cn("font-medium", s.results.utilisation > 100 ? "text-destructive" : "text-card-foreground")}>{s.results.utilisation}%</p></div>
                    <div><p className="text-muted-foreground">Backorders</p><p className={cn("font-medium", s.results.backorders > 20 ? "text-destructive" : "text-card-foreground")}>{s.results.backorders}</p></div>
                    <div><p className="text-muted-foreground">Stock</p><p className="font-medium text-card-foreground">{s.results.stockDays}j</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          {comparisonData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
              <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">
                Comparaison : {selected.map(s => s.name).join(" vs ")}
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
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map(s => (
                    <tr key={s.id} className={cn("border-b border-border last:border-0 hover:bg-muted/20 transition-colors", selectedIds.includes(s.id) && "bg-primary/5")}>
                      <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                      <td className="px-4 py-3 text-right text-card-foreground">{s.results.service}%</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(s.results.utilisation > 100 ? "text-destructive font-medium" : "text-card-foreground")}>{s.results.utilisation}%</span>
                      </td>
                      <td className="px-4 py-3 text-right text-card-foreground">{s.results.backorders}</td>
                      <td className="px-4 py-3 text-right text-card-foreground">{s.results.stockDays}j</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
