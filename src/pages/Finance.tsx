import { Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import KPICard from "@/components/KPICard";
import { useData } from "@/context/DataContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

export default function Finance() {
  const { data, hasData } = useData();

  const { scenarios, caTotal, margin, bestScenario } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      const scenarios = [
        { period: "M1", base: 800, optimiste: 850, pessimiste: 720 },
        { period: "M2", base: 830, optimiste: 890, pessimiste: 740 },
        { period: "M3", base: 870, optimiste: 950, pessimiste: 770 },
        { period: "M4", base: 910, optimiste: 1000, pessimiste: 800 },
        { period: "M5", base: 950, optimiste: 1060, pessimiste: 830 },
        { period: "M6", base: 1000, optimiste: 1120, pessimiste: 860 },
      ];
      return { scenarios, caTotal: "€5.4M", margin: "34.2%", bestScenario: "Base" };
    }

    const fc = data.forecasts;
    const best = fc.models[0];
    const second = fc.models.length > 1 ? fc.models[1] : best;
    const worst = fc.models[fc.models.length - 1];

    const scenarios = best.predictions.map((val, i) => ({
      period: `P+${i + 1}`,
      base: Math.round(val),
      optimiste: Math.round(val * 1.15),
      pessimiste: Math.round(val * 0.85),
    }));

    const total = best.predictions.reduce((s, v) => s + v, 0);
    const fmt = total >= 1000000 ? `€${(total / 1000000).toFixed(1)}M` : `€${(total / 1000).toFixed(0)}k`;

    return { scenarios, caTotal: fmt, margin: `${(100 - best.mape).toFixed(1)}%`, bestScenario: best.name };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Finance" description="Prévision du CA et simulation de scénarios" icon={<Wallet className="h-5 w-5" />} />
      <DataUploadBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KPICard title="CA prévisionnel" value={caTotal} changeType="up" icon={<Wallet className="h-5 w-5" />} />
        <KPICard title="Fiabilité prévision" value={margin} changeType="up" icon={<Wallet className="h-5 w-5" />} />
        <KPICard title="Meilleur modèle" value={bestScenario} changeType="neutral" icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Simulation de scénarios</h3>
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
            <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
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
