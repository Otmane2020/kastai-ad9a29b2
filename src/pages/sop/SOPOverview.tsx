import { useEffect, useState, useCallback, useMemo } from "react";
import { Workflow, TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

const db = supabase.from as any;

export default function SOPOverview() {
  const { data, hasData } = useData();
  const { user } = useAuth();
  const [lines, setLines] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);

  const fetchSOP = useCallback(async () => {
    if (!user) return;
    const [lRes, mRes] = await Promise.all([
      db("sop_lines").select("*").eq("user_id", user.id),
      db("sop_mappings").select("*").eq("user_id", user.id),
    ]);
    setLines(lRes.data ?? []);
    setMappings(mRes.data ?? []);
  }, [user]);

  useEffect(() => { fetchSOP(); }, [fetchSOP]);

  const { sopData, kpis } = useMemo(() => {
    // Build demand vs production from real forecast data + SOP structure
    const hasForecasts = hasData && data.forecasts;
    const hasStructure = lines.length > 0 && mappings.length > 0;

    let sopData: { month: string; demande: number; production: number }[];

    if (hasForecasts) {
      const totalCapPerDay = lines.reduce((s, l) => s + (l.capacity_per_day ?? 480), 0);
      // Use last 6 months historical + forecast horizon
      const hist = data.timeSeries.slice(-6).map(p => ({
        month: p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        demande: Math.round(p.value),
        production: hasStructure
          ? Math.round(Math.min(p.value, totalCapPerDay * 22)) // ~22 working days
          : Math.round(p.value * 0.97),
      }));

      const forecasted = data.forecasts.models[0]?.predictions.slice(0, 6).map((pred, i) => ({
        month: `P+${i + 1}`,
        demande: Math.round(pred),
        production: hasStructure
          ? Math.round(Math.min(pred, totalCapPerDay * 22))
          : Math.round(pred * 0.97),
      })) ?? [];

      sopData = [...hist, ...forecasted];
    } else {
      sopData = [
        { month: "—", demande: 0, production: 0 },
      ];
    }

    const totalD = sopData.reduce((s, d) => s + d.demande, 0);
    const totalP = sopData.reduce((s, d) => s + d.production, 0);

    return {
      sopData: sopData.filter(d => d.demande > 0),
      kpis: totalD > 0 ? [
        { label: "Taux de service", value: `${(totalP / totalD * 100).toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
        { label: "Écart D/P", value: `${((totalP - totalD) / totalD * 100).toFixed(1)}%`, icon: TrendingDown, color: totalP >= totalD ? "text-success" : "text-destructive" },
        { label: "Lignes configurées", value: `${lines.length}`, icon: Package, color: "text-primary" },
        { label: "Mappings", value: `${mappings.length}`, icon: AlertTriangle, color: "text-warning" },
      ] : [],
    };
  }, [hasData, data, lines, mappings]);

  const noData = sopData.length === 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="S&OP — Vue d'ensemble" description="Tableau de bord stratégique ventes & production" icon={<Workflow className="h-5 w-5" />} />

      {noData ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
          <Workflow className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Importez des données de prévision et configurez vos lignes de production dans <b>Structure</b> pour voir l'analyse S&OP.</p>
        </div>
      ) : (
        <>
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
              {kpis.map(k => (
                <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                  <p className="font-display text-2xl font-bold text-card-foreground">{k.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Demande vs Production</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sopData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="demande" name="Demande" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" name="Production" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Tendance cumulative</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sopData.reduce((acc: any[], d, i) => {
                  const prev = acc[i - 1] || { cumDemande: 0, cumProd: 0 };
                  acc.push({ month: d.month, cumDemande: prev.cumDemande + d.demande, cumProd: prev.cumProd + d.production });
                  return acc;
                }, [])}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="cumDemande" name="Cum. Demande" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cumProd" name="Cum. Production" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
