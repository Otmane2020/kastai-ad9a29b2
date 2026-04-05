import { BarChart3, TrendingUp, TrendingDown, Package, AlertTriangle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, RadialBarChart, RadialBar } from "recharts";
import { cn } from "@/lib/utils";

const KPI_DATA = [
  { label: "Taux de service", value: 96.2, target: 98, unit: "%", trend: "up" as const },
  { label: "Écart D/P", value: -2.1, target: 0, unit: "%", trend: "down" as const },
  { label: "Utilisation lignes", value: 84.3, target: 85, unit: "%", trend: "up" as const },
  { label: "Jours de stock", value: 18, target: 15, unit: "j", trend: "down" as const },
  { label: "Backorders", value: 12, target: 0, unit: "", trend: "down" as const },
  { label: "OTD (On-Time Delivery)", value: 92.5, target: 95, unit: "%", trend: "up" as const },
];

const MONTHLY_KPIS = [
  { month: "Jan", service: 94, utilisation: 82, otd: 91 },
  { month: "Fév", service: 95, utilisation: 85, otd: 90 },
  { month: "Mar", service: 96, utilisation: 88, otd: 93 },
  { month: "Avr", service: 97, utilisation: 84, otd: 94 },
  { month: "Mai", service: 95, utilisation: 86, otd: 91 },
  { month: "Jun", service: 96, utilisation: 84, otd: 93 },
];

const LINE_KPIS = [
  { name: "Ligne 1", utilisation: 87, trs: 82, qualite: 98 },
  { name: "Ligne 2", utilisation: 106, trs: 74, qualite: 94 },
  { name: "Ligne 3", utilisation: 58, trs: 90, qualite: 99 },
];

export default function SOPKpis() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="KPI S&OP" description="Indicateurs de performance clés" icon={<BarChart3 className="h-5 w-5" />} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        {KPI_DATA.map((k) => {
          const onTarget = k.unit === "%" ? (k.trend === "up" ? k.value >= k.target : k.value <= k.target) : k.value <= k.target;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] text-muted-foreground mb-1">{k.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-xl font-bold text-card-foreground">{k.value}</span>
                <span className="text-xs text-muted-foreground">{k.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {onTarget ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                <span className={cn("text-[10px] font-medium", onTarget ? "text-success" : "text-destructive")}>
                  Cible: {k.target}{k.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY_KPIS}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="service" name="Service (%)" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="utilisation" name="Utilisation (%)" stroke="hsl(var(--chart-2))" strokeWidth={2} />
              <Line type="monotone" dataKey="otd" name="OTD (%)" stroke="hsl(var(--chart-3))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Performance par ligne</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={LINE_KPIS}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="utilisation" name="Utilisation (%)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trs" name="TRS (%)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="qualite" name="Qualité (%)" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
