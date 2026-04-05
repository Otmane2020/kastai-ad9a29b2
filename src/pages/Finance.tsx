import { Wallet, TrendingUp, ShieldCheck, Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import KPICard from "@/components/KPICard";
import { useData } from "@/context/DataContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

function formatValue(val: number, isRevenue: boolean): string {
  if (isRevenue) {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M €`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k €`;
    return `${Math.round(val)} €`;
  }
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${Math.round(val)}`;
}

export default function Finance() {
  const { data, hasData } = useData();

  const isRevenue = data.forecastTarget === "revenue";
  const unitLabel = isRevenue ? "€" : "unités";

  const { scenarios, historicalData, caTotal, margin, bestScenario, horizon } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      const scenarios = [
        { period: "M1", base: 800, optimiste: 850, pessimiste: 720 },
        { period: "M2", base: 830, optimiste: 890, pessimiste: 740 },
        { period: "M3", base: 870, optimiste: 950, pessimiste: 770 },
        { period: "M4", base: 910, optimiste: 1000, pessimiste: 800 },
        { period: "M5", base: 950, optimiste: 1060, pessimiste: 830 },
        { period: "M6", base: 1000, optimiste: 1120, pessimiste: 860 },
      ];
      return { scenarios, historicalData: [], caTotal: "5.4M €", margin: "34.2%", bestScenario: "Base", horizon: 6 };
    }

    const fc = data.forecasts;
    const best = fc.models[0];
    const worst = fc.models[fc.models.length - 1];

    // Build historical monthly data
    const buckets = new Map<string, { date: Date; total: number }>();
    for (const p of data.timeSeries) {
      const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets.has(key)) buckets.set(key, { date: new Date(p.date.getFullYear(), p.date.getMonth(), 1), total: 0 });
      buckets.get(key)!.total += p.value;
    }
    const monthly = Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    const lastMonths = monthly.slice(-6);

    const historicalData = lastMonths.map((m) => ({
      period: m.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      réel: Math.round(m.total),
    }));

    // Build forecast scenarios
    const lastDate = monthly.length > 0 ? monthly[monthly.length - 1].date : new Date();
    const scenarios = best.predictions.map((val, i) => {
      const futureDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + (i + 1), 1);
      return {
        period: futureDate.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        base: Math.round(val),
        optimiste: Math.round(val * 1.15),
        pessimiste: Math.round(val * 0.85),
      };
    });

    const total = best.predictions.reduce((s, v) => s + v, 0);

    return {
      scenarios,
      historicalData,
      caTotal: formatValue(total, isRevenue),
      margin: `${(100 - best.mape).toFixed(1)}%`,
      bestScenario: best.name,
      horizon: fc.horizon,
    };
  }, [hasData, data, isRevenue]);

  // Combine historical + forecast for continuous chart
  const chartData = useMemo(() => {
    if (historicalData.length === 0) return scenarios;
    // Last historical point bridges to forecast
    const bridge = historicalData[historicalData.length - 1];
    return [
      ...historicalData,
      { ...scenarios[0], réel: undefined, base: bridge.réel, optimiste: bridge.réel, pessimiste: bridge.réel },
      ...scenarios,
    ];
  }, [historicalData, scenarios]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Finance" description={`Prévision ${isRevenue ? "du CA" : "des quantités"} et simulation de scénarios`} icon={<Wallet className="h-5 w-5" />} />
      <DataUploadBanner />

      {hasData && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            {isRevenue ? <Wallet className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {isRevenue ? "Chiffre d'affaires (€)" : "Quantité (unités)"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 border border-border px-3 py-1 text-xs font-medium text-foreground">
            Horizon : {horizon} mois
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KPICard title={isRevenue ? "CA prévisionnel" : "Volume prévisionnel"} value={caTotal} changeType="up" icon={<TrendingUp className="h-5 w-5" />} />
        <KPICard title="Fiabilité prévision" value={margin} changeType="up" icon={<ShieldCheck className="h-5 w-5" />} />
        <KPICard title="Meilleur modèle" value={bestScenario} changeType="neutral" icon={<Trophy className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-semibold text-card-foreground">
            Simulation de scénarios ({unitLabel})
          </h3>
          {hasData && (
            <span className="text-xs text-muted-foreground">
              {historicalData.length > 0 ? `${historicalData.length} mois historiques + ` : ""}{scenarios.length} mois de prévisions
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(152, 69%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215, 25%, 35%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(215, 25%, 35%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" tickFormatter={(v) => isRevenue ? `${(v/1000).toFixed(0)}k` : v.toLocaleString()} />
            <Tooltip
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
              formatter={(value: number) => [isRevenue ? `${value.toLocaleString()} €` : `${value.toLocaleString()} ${unitLabel}`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {historicalData.length > 0 && (
              <Area type="monotone" dataKey="réel" stroke="hsl(215, 25%, 35%)" fill="url(#realGrad)" strokeWidth={2} name="Réel (historique)" />
            )}
            <Area type="monotone" dataKey="optimiste" stroke="hsl(152, 69%, 40%)" fill="url(#optGrad)" strokeWidth={2} name="Optimiste (+15%)" />
            <Area type="monotone" dataKey="base" stroke="hsl(217, 91%, 50%)" fill="url(#baseGrad)" strokeWidth={2.5} name="Base (meilleur modèle)" />
            <Area type="monotone" dataKey="pessimiste" stroke="hsl(0, 84%, 60%)" fill="none" strokeWidth={1.5} strokeDasharray="5 5" name="Pessimiste (-15%)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
