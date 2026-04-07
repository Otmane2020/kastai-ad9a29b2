import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const db = supabase.from as any;

interface Line { id: string; name: string; site: string; capacity_per_day: number; }
interface Mapping { id: string; product_id: string; line_id: string; unit_time: number; yield_pct: number; }

export default function SOPCapacity() {
  const { user } = useAuth();
  const { data: appData, hasData } = useData();
  const [lines, setLines] = useState<Line[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [lRes, mRes] = await Promise.all([
      db("sop_lines").select("*").eq("user_id", user.id),
      db("sop_mappings").select("*").eq("user_id", user.id),
    ]);
    setLines((lRes.data ?? []) as Line[]);
    setMappings((mRes.data ?? []) as Mapping[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const linesData = useMemo(() => {
    if (lines.length === 0) return [];

    // Calculate demand per line based on forecast data or proportional allocation
    const avgDailyDemand = hasData && appData.forecasts
      ? appData.timeSeries.slice(-30).reduce((s, p) => s + p.value, 0) / 30
      : 0;

    return lines.map(l => {
      const lineMappings = mappings.filter(m => m.line_id === l.id);
      // Sum capacity across all products mapped to this line
      const totalCapMinutes = l.capacity_per_day;
      // Estimate demand minutes from mappings
      const demandMinutes = lineMappings.length > 0
        ? lineMappings.reduce((s, m) => {
            const unitDemand = avgDailyDemand > 0 ? (avgDailyDemand / mappings.length) : (totalCapMinutes * 0.85 / lineMappings.length);
            return s + unitDemand * m.unit_time / (m.yield_pct / 100);
          }, 0)
        : totalCapMinutes * 0.5;

      const utilisation = totalCapMinutes > 0 ? (demandMinutes / totalCapMinutes) * 100 : 0;

      return {
        line: l.name,
        site: l.site,
        demande: Math.round(demandMinutes),
        capacite: totalCapMinutes,
        utilisation: Math.round(utilisation * 10) / 10,
      };
    });
  }, [lines, mappings, hasData, appData]);

  const bottlenecks = linesData.filter(l => l.utilisation > 100);
  const overcapacity = linesData.filter(l => l.utilisation < 70);

  if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Chargement...</div>;

  if (lines.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Demande vs Capacité" description="Analyse de charge et identification des goulots" icon={<Activity className="h-5 w-5" />} />
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Aucune ligne de production configurée.</p>
          <p className="text-xs text-muted-foreground mt-1">Rendez-vous dans <b>Structure</b> pour ajouter vos lignes et mappings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Demande vs Capacité" description="Analyse de charge et identification des goulots" icon={<Activity className="h-5 w-5" />} />

      {bottlenecks.length > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Goulots d'étranglement détectés</p>
            <p className="text-xs text-destructive/80 mt-1">
              {bottlenecks.map(b => `${b.line} (${b.utilisation}%)`).join(", ")} — capacité insuffisante
            </p>
          </div>
        </div>
      )}

      {overcapacity.length > 0 && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-primary">Surcapacité disponible</p>
            <p className="text-xs text-primary/80 mt-1">
              {overcapacity.map(b => `${b.line} (${b.utilisation}%)`).join(", ")} — marge de manœuvre
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {linesData.map(l => {
          const isOver = l.utilisation > 100;
          const isLow = l.utilisation < 70;
          return (
            <div key={l.line} className={cn("rounded-xl border p-5 shadow-card",
              isOver ? "border-destructive/30 bg-destructive/5" : isLow ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-sm font-semibold text-card-foreground">{l.line}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                  isOver ? "bg-destructive/10 text-destructive" : isLow ? "bg-primary/10 text-primary" : "bg-success/10 text-success")}>
                  {l.utilisation}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", isOver ? "bg-destructive" : isLow ? "bg-primary" : "bg-success")}
                  style={{ width: `${Math.min(100, l.utilisation)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Demande: {l.demande} min</span>
                <span>Cap: {l.capacite} min</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Demande vs Capacité par ligne</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={linesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="line" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="demande" name="Demande (min)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="capacite" name="Capacité (min)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
