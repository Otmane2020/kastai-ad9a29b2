import { Workflow, TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useData } from "@/context/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { useMemo } from "react";

export default function SOPOverview() {
  const { data, hasData } = useData();

  const { sopData, kpis } = useMemo(() => {
    const sopData = hasData && data.forecasts
      ? [
          ...data.timeSeries.slice(-6).map((p) => ({
            month: p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
            demande: Math.round(p.value),
            production: Math.round(p.value * (0.93 + Math.random() * 0.12)),
          })),
          ...data.forecasts.models[0].predictions.slice(0, 4).map((pred, i) => ({
            month: `P+${i + 1}`,
            demande: Math.round(pred),
            production: Math.round(pred * 0.97),
          })),
        ]
      : [
          { month: "Jan", demande: 1200, production: 1150 },
          { month: "Fév", demande: 1350, production: 1300 },
          { month: "Mar", demande: 1500, production: 1480 },
          { month: "Avr", demande: 1420, production: 1450 },
          { month: "Mai", demande: 1600, production: 1550 },
          { month: "Jun", demande: 1550, production: 1580 },
        ];

    const totalD = sopData.reduce((s, d) => s + d.demande, 0);
    const totalP = sopData.reduce((s, d) => s + d.production, 0);

    return {
      sopData,
      kpis: [
        { label: "Taux de service", value: `${(totalP / totalD * 100).toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
        { label: "Écart D/P", value: `${((totalP - totalD) / totalD * 100).toFixed(1)}%`, icon: TrendingDown, color: totalP >= totalD ? "text-success" : "text-destructive" },
        { label: "Jours de stock", value: `${Math.round(15 + Math.random() * 10)}j`, icon: Package, color: "text-primary" },
        { label: "Backorders", value: `${Math.round(Math.max(0, totalD - totalP) / 50)}`, icon: AlertTriangle, color: "text-warning" },
      ],
    };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="S&OP — Vue d'ensemble" description="Tableau de bord stratégique ventes & production" icon={<Workflow className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
            <p className="font-display text-2xl font-bold text-card-foreground">{k.value}</p>
          </div>
        ))}
      </div>

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
    </div>
  );
}
