import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell } from "recharts";
import { cn } from "@/lib/utils";

const LINES_DATA = [
  { line: "Ligne 1", demande: 420, capacite: 480, utilisation: 87.5 },
  { line: "Ligne 2", demande: 510, capacite: 480, utilisation: 106.3 },
  { line: "Ligne 3", demande: 350, capacite: 600, utilisation: 58.3 },
];

const WEEKLY_DATA = [
  { week: "S1", ligne1: 85, ligne2: 92, ligne3: 55 },
  { week: "S2", ligne1: 88, ligne2: 105, ligne3: 60 },
  { week: "S3", ligne1: 90, ligne2: 110, ligne3: 52 },
  { week: "S4", ligne1: 82, ligne2: 98, ligne3: 65 },
  { week: "S5", ligne1: 95, ligne2: 115, ligne3: 48 },
  { week: "S6", ligne1: 78, ligne2: 100, ligne3: 70 },
];

export default function SOPCapacity() {
  const bottlenecks = LINES_DATA.filter((l) => l.utilisation > 100);
  const overcapacity = LINES_DATA.filter((l) => l.utilisation < 70);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Demande vs Capacité" description="Analyse de charge et identification des goulots" icon={<Activity className="h-5 w-5" />} />

      {/* Alerts */}
      {bottlenecks.length > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Goulots d'étranglement détectés</p>
            <p className="text-xs text-destructive/80 mt-1">
              {bottlenecks.map((b) => `${b.line} (${b.utilisation.toFixed(0)}%)`).join(", ")} — capacité insuffisante pour la demande
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
              {overcapacity.map((b) => `${b.line} (${b.utilisation.toFixed(0)}%)`).join(", ")} — marge de manœuvre
            </p>
          </div>
        </div>
      )}

      {/* Line utilization cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {LINES_DATA.map((l) => {
          const isOver = l.utilisation > 100;
          const isLow = l.utilisation < 70;
          return (
            <div key={l.line} className={cn(
              "rounded-xl border p-5 shadow-card",
              isOver ? "border-destructive/30 bg-destructive/5" : isLow ? "border-primary/30 bg-primary/5" : "border-border bg-card"
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-sm font-semibold text-card-foreground">{l.line}</p>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  isOver ? "bg-destructive/10 text-destructive" : isLow ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                )}>
                  {l.utilisation.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                <div
                  className={cn("h-full rounded-full transition-all", isOver ? "bg-destructive" : isLow ? "bg-primary" : "bg-success")}
                  style={{ width: `${Math.min(100, l.utilisation)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Demande: {l.demande} min</span>
                <span>Cap: {l.capacite} min</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Demande vs Capacité par ligne</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={LINES_DATA}>
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

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Taux d'utilisation hebdomadaire (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={WEEKLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 130]} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "100%", position: "right", fontSize: 10 }} />
              <Bar dataKey="ligne1" name="Ligne 1" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ligne2" name="Ligne 2" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ligne3" name="Ligne 3" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
