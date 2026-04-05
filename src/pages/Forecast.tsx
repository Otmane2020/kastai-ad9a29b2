import { TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const forecastData = Array.from({ length: 24 }, (_, i) => {
  const month = new Date(2024, i);
  const label = month.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  const base = 400 + i * 15 + Math.sin(i / 3) * 40;
  const isHistorical = i < 12;
  return {
    month: label,
    réel: isHistorical ? Math.round(base + (Math.random() - 0.5) * 30) : undefined,
    prophet: Math.round(base + (Math.random() - 0.5) * 15),
    arima: Math.round(base + (Math.random() - 0.5) * 25 + 10),
    xgboost: Math.round(base + (Math.random() - 0.5) * 20 - 5),
    intervalle_haut: Math.round(base + 50),
    intervalle_bas: Math.round(base - 50),
  };
});

const models = [
  { name: "Prophet", mape: "4.2%", bias: "+1.1%", selected: false },
  { name: "XGBoost", mape: "3.9%", bias: "-0.5%", selected: true },
  { name: "ARIMA", mape: "5.8%", bias: "+2.3%", selected: false },
  { name: "LSTM", mape: "4.5%", bias: "-0.8%", selected: false },
];

export default function Forecast() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Prévisions" description="Visualisation des forecasts et comparaison des modèles" icon={<TrendingUp className="h-5 w-5" />} />

      {/* Model selector */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {models.map((m) => (
          <div key={m.name} className={`rounded-xl border p-4 transition-all cursor-pointer ${m.selected ? "border-primary bg-primary/5 shadow-elevated" : "border-border bg-card shadow-card hover:shadow-elevated"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-sm font-semibold text-card-foreground">{m.name}</span>
              {m.selected && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Meilleur</span>}
            </div>
            <div className="flex gap-4 text-xs">
              <div><span className="text-muted-foreground">MAPE: </span><span className="font-medium text-card-foreground">{m.mape}</span></div>
              <div><span className="text-muted-foreground">Biais: </span><span className="font-medium text-card-foreground">{m.bias}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Prévisions multi-modèles (€k)</h3>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="réel" stroke="hsl(215, 25%, 20%)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="prophet" stroke="hsl(217, 91%, 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="xgboost" stroke="hsl(152, 69%, 40%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="arima" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Backtesting table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Résultats du backtesting</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Période</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Réel</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Prédit</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Erreur</th>
              </tr>
            </thead>
            <tbody>
              {[{ p: "Q1 2024", r: "€1.35M", pr: "€1.32M", e: "-2.2%" }, { p: "Q2 2024", r: "€1.50M", pr: "€1.47M", e: "-2.0%" }, { p: "Q3 2024", r: "€1.76M", pr: "€1.71M", e: "-2.8%" }].map((row) => (
                <tr key={row.p} className="border-b border-border/50">
                  <td className="py-3 text-card-foreground">{row.p}</td>
                  <td className="py-3 text-right text-card-foreground">{row.r}</td>
                  <td className="py-3 text-right text-primary font-medium">{row.pr}</td>
                  <td className="py-3 text-right text-success font-medium">{row.e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
