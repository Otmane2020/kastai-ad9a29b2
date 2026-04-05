import { PieChart, ArrowDownToLine } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import KPICard from "@/components/KPICard";
import { useData } from "@/context/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useMemo } from "react";

export default function KPIReports() {
  const { data, hasData } = useData();

  const { monthlyKPI, radarData, mapeAvg, biasAvg, modelsCount } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      return {
        monthlyKPI: [
          { month: "Jan", précision: 94 }, { month: "Fév", précision: 95 },
          { month: "Mar", précision: 96 }, { month: "Avr", précision: 93 },
          { month: "Mai", précision: 97 }, { month: "Jun", précision: 95 },
        ],
        radarData: [
          { metric: "Précision", value: 95 }, { metric: "Réactivité", value: 88 },
          { metric: "Couverture", value: 92 }, { metric: "Stabilité", value: 90 },
        ],
        mapeAvg: "3.9%", biasAvg: "+0.3%", modelsCount: "4",
      };
    }

    const fc = data.forecasts;
    const avgMape = fc.models.reduce((s, m) => s + m.mape, 0) / fc.models.length;
    const avgBias = fc.models.reduce((s, m) => s + m.bias, 0) / fc.models.length;

    // Build per-model accuracy as "monthly" chart
    const monthlyKPI = fc.models.map((m) => ({
      month: m.name.split("(")[0].trim().slice(0, 10),
      précision: parseFloat((100 - m.mape).toFixed(1)),
    }));

    const best = fc.models[0];
    const radarData = [
      { metric: "Précision", value: Math.round(100 - best.mape) },
      { metric: "Stabilité", value: Math.round(Math.max(0, 100 - Math.abs(best.bias) * 5)) },
      { metric: "Couverture", value: Math.round(Math.min(100, data.timeSeries.length / 2)) },
      { metric: "Réactivité", value: Math.round(100 - best.mae / (data.timeSeries.reduce((s, t) => s + t.value, 0) / data.timeSeries.length) * 100) },
    ];

    return {
      monthlyKPI,
      radarData,
      mapeAvg: `${avgMape.toFixed(1)}%`,
      biasAvg: `${avgBias >= 0 ? "+" : ""}${avgBias.toFixed(1)}%`,
      modelsCount: `${fc.models.length}`,
    };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="KPI & Rapports"
        description="Analyse de performance et génération de rapports"
        icon={<PieChart className="h-5 w-5" />}
        actions={
          <button className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <ArrowDownToLine className="h-4 w-4" />Exporter PDF
          </button>
        }
      />
      <DataUploadBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KPICard title="MAPE moyen" value={mapeAvg} changeType="up" icon={<PieChart className="h-5 w-5" />} />
        <KPICard title="Biais moyen" value={biasAvg} changeType="neutral" icon={<PieChart className="h-5 w-5" />} />
        <KPICard title="Modèles testés" value={modelsCount} changeType="neutral" icon={<PieChart className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Précision par modèle (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyKPI}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="précision" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Radar de performance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(214, 20%, 90%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="hsl(217, 91%, 50%)" fill="hsl(217, 91%, 50%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
