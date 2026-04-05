import { DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const scenarios = [
  { month: "Jan", base: 800, optimiste: 850, pessimiste: 720 },
  { month: "Fév", base: 830, optimiste: 890, pessimiste: 740 },
  { month: "Mar", base: 870, optimiste: 950, pessimiste: 770 },
  { month: "Avr", base: 910, optimiste: 1000, pessimiste: 800 },
  { month: "Mai", base: 950, optimiste: 1060, pessimiste: 830 },
  { month: "Jun", base: 1000, optimiste: 1120, pessimiste: 860 },
];

export default function Finance() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Finance" description="Prévision du CA et simulation de scénarios" icon={<DollarSign className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KPICard title="CA prévu (H2)" value="€5.4M" change="+15% vs H1" changeType="up" icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Marge brute prévue" value="34.2%" change="+1.8 pts" changeType="up" icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Scénario actif" value="Base" change="Probabilité: 65%" changeType="neutral" icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Simulation de scénarios (€k)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={scenarios}>
            <defs>
              <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="optimiste" stroke="hsl(152, 69%, 40%)" fill="url(#optGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="base" stroke="hsl(217, 91%, 50%)" fill="url(#baseGrad)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="pessimiste" stroke="hsl(0, 84%, 60%)" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
