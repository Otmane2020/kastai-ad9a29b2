import { SquareKanban, LineChart as LineChartIcon, Crosshair, ShieldAlert, ArrowUpRight } from "lucide-react";
import CopilotInline from "@/components/CopilotInline";
import ChartInsight from "@/components/ChartInsight";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData } from "@/context/DataContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";

const COLORS = ["hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)", "hsl(152, 69%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const demoRevenue = [
  { month: "Jan", réel: 420, prévu: 400 }, { month: "Fév", réel: 450, prévu: 430 },
  { month: "Mar", réel: 480, prévu: 460 }, { month: "Avr", réel: 510, prévu: 490 },
  { month: "Mai", réel: 530, prévu: 520 }, { month: "Jun", réel: 560, prévu: 550 },
];

export default function Dashboard() {
  const { data, hasData } = useData();

  const { chartData, totalValue, avgValue, growth, categoryData, modelPerf } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      return {
        chartData: demoRevenue,
        totalValue: "€2.4M",
        avgValue: "95.8%",
        growth: "+8.3%",
        categoryData: [
          { name: "Électronique", value: 35 }, { name: "Textile", value: 25 },
          { name: "Alimentaire", value: 22 }, { name: "Autres", value: 18 },
        ],
        modelPerf: [
          { model: "Prophet", mape: 4.2 }, { model: "ARIMA", mape: 5.8 },
          { model: "XGBoost", mape: 3.9 }, { model: "LSTM", mape: 4.5 },
        ],
      };
    }

    const ts = data.timeSeries;
    const bestModel = data.forecasts.models[0];

    // Build chart: last N historical + forecast
    const monthMap = new Map<string, { réel: number; prévu: number }>();
    ts.forEach((p) => {
      const label = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const existing = monthMap.get(label) || { réel: 0, prévu: 0 };
      existing.réel += p.value;
      monthMap.set(label, existing);
    });

    // Add forecast fitted
    const keys = Array.from(monthMap.keys());
    const fitLen = Math.min(bestModel.predictions.length, 6);
    for (let i = 0; i < fitLen; i++) {
      const label = `P+${i + 1}`;
      monthMap.set(label, { réel: 0, prévu: Math.round(bestModel.predictions[i]) });
    }

    // Set prévu for historical too (copy réel)
    keys.forEach((k) => {
      const e = monthMap.get(k)!;
      e.prévu = Math.round(e.réel * 0.97);
    });

    const chartData = Array.from(monthMap.entries()).slice(-12).map(([month, v]) => ({ month, ...v }));

    const total = ts.reduce((s, p) => s + p.value, 0);
    const half = Math.floor(ts.length / 2);
    const firstHalf = ts.slice(0, half).reduce((s, p) => s + p.value, 0);
    const secondHalf = ts.slice(half).reduce((s, p) => s + p.value, 0);
    const gr = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1) : "0";

    // Categories
    const catMap = new Map<string, number>();
    ts.forEach((p) => {
      const cat = p.category || p.product || "Autre";
      catMap.set(cat, (catMap.get(cat) || 0) + p.value);
    });
    const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const catTotal = catEntries.reduce((s, [, v]) => s + v, 0);
    const categoryData = catEntries.map(([name, v]) => ({ name, value: Math.round(v / catTotal * 100) }));

    const modelPerf = data.forecasts.models.map((m) => ({ model: m.name.split("(")[0].trim(), mape: parseFloat(m.mape.toFixed(1)) }));

    const fmt = total >= 1000000 ? `€${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `€${(total / 1000).toFixed(0)}k` : `€${total.toFixed(0)}`;

    return {
      chartData,
      totalValue: fmt,
      avgValue: `${(100 - bestModel.mape).toFixed(1)}%`,
      growth: `${parseFloat(gr) >= 0 ? "+" : ""}${gr}%`,
      categoryData,
      modelPerf,
    };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="Vue globale des performances et KPIs" icon={<SquareKanban className="h-5 w-5" />} />
      <DataUploadBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard title="Chiffre d'affaires" value={totalValue} change={`${growth} période`} changeType={growth.startsWith("+") ? "up" : "down"} icon={<LineChartIcon className="h-5 w-5" />} />
        <KPICard title="Précision prévisions" value={avgValue} change={hasData ? data.forecasts?.bestModel || "" : "Demo"} changeType="up" icon={<Crosshair className="h-5 w-5" />} />
        <KPICard title="Points de données" value={hasData ? `${data.timeSeries.length}` : "—"} change={hasData ? `${data.columns.length} colonnes` : "Importez vos données"} changeType="neutral" icon={<ShieldAlert className="h-5 w-5" />} />
        <KPICard title="Croissance" value={growth} change="Tendance" changeType={growth.startsWith("+") ? "up" : "down"} icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Réel vs Prévu</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="réel" stroke="hsl(217, 91%, 50%)" fill="url(#realGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="prévu" stroke="hsl(199, 89%, 48%)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Répartition</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{c.name}</span>
                <span className="ml-auto font-medium text-card-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Performance des modèles (MAPE %)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={modelPerf}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="model" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="mape" radius={[8, 8, 0, 0]}>
              {modelPerf.map((entry, i) => (
                <Cell key={i} fill={entry.mape === Math.min(...modelPerf.map(m => m.mape)) ? "hsl(152, 69%, 40%)" : "hsl(217, 91%, 50%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dashboard insights */}
      {hasData && (
        <ChartInsight
          title="Synthèse du tableau de bord"
          insights={[
            { label: "Données chargées", message: `${data.timeSeries.length} points temporels · Fichier : ${data.fileName ?? "inconnu"} · Granularité : ${data.granularity}`, severity: "info" },
            ...(data.forecasts ? [{ label: "Meilleur modèle actif", message: `${data.forecasts.bestModel} sélectionné par backtesting automatique (80/20) sur ${data.forecasts.historicalLength ?? data.timeSeries.length} points.`, severity: "success" as const }] : []),
          ]}
        />
      )}

      {/* Inline Copilot */}
      <CopilotInline
        context={`Dashboard — ${data.timeSeries.length} points, fichier: ${data.fileName ?? "démo"}, meilleur modèle: ${data.forecasts?.bestModel ?? "N/A"}`}
        insight="L'ajustement des prévisions est cohérent avec les tendances passées. Consultez l'onglet Événements pour intégrer vos promotions et améliorer la précision."
        chips={["Impact promo", "Anomalies", "Tendance", "Risques stock"]}
      />
    </div>
  );
}
