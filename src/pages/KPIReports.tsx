import { BarChart3, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const monthlyKPI = [
  { month: "Jan", précision: 94, volume: 1200 }, { month: "Fév", précision: 95, volume: 1350 },
  { month: "Mar", précision: 96, volume: 1500 }, { month: "Avr", précision: 93, volume: 1420 },
  { month: "Mai", précision: 97, volume: 1600 }, { month: "Jun", précision: 95, volume: 1550 },
];

const radarData = [
  { metric: "Précision", value: 95 }, { metric: "Réactivité", value: 88 },
  { metric: "Couverture", value: 92 }, { metric: "Stabilité", value: 90 },
  { metric: "Scalabilité", value: 85 }, { metric: "Coût", value: 78 },
];

export default function KPIReports() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="KPI & Rapports"
        description="Analyse de performance et génération de rapports"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <button className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Download className="h-4 w-4" />Exporter PDF
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <KPICard title="MAPE moyen" value="3.9%" change="-0.8% vs trimestre" changeType="up" icon={<BarChart3 className="h-5 w-5" />} />
        <KPICard title="Biais moyen" value="+0.3%" change="Quasi neutre" changeType="neutral" icon={<BarChart3 className="h-5 w-5" />} />
        <KPICard title="Modèles actifs" value="4" change="XGBoost en tête" changeType="neutral" icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Précision mensuelle (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyKPI}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis domain={[85, 100]} tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
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
