import { Layers } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const sopData = [
  { month: "Jan", demande: 1200, production: 1150, stock: 300 },
  { month: "Fév", demande: 1350, production: 1300, stock: 250 },
  { month: "Mar", demande: 1500, production: 1480, stock: 230 },
  { month: "Avr", demande: 1420, production: 1450, stock: 260 },
  { month: "Mai", demande: 1600, production: 1550, stock: 210 },
  { month: "Jun", demande: 1550, production: 1580, stock: 240 },
];

export default function SOP() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="S&OP" description="Alignement ventes / production — planification stratégique" icon={<Layers className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: "Taux de service", value: "96.2%", sub: "Objectif: 95%" },
          { label: "Écart D/P", value: "-2.1%", sub: "Sous-production légère" },
          { label: "Jours de stock", value: "18j", sub: "Objectif: 20j" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Demande vs Production (unités)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sopData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="demande" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="production" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
