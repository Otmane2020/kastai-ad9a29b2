import { TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData } from "@/context/DataContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

const MODEL_COLORS = [
  "hsl(152, 69%, 40%)", "hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
];

export default function Forecast() {
  const { data, hasData } = useData();

  const { chartData, models, backtestData } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      // Demo data
      const demoData = Array.from({ length: 18 }, (_, i) => {
        const base = 400 + i * 15 + Math.sin(i / 3) * 40;
        return {
          period: i < 12 ? `M${i + 1}` : `P+${i - 11}`,
          réel: i < 12 ? Math.round(base + (Math.random() - 0.5) * 30) : undefined,
          "Lissage Expo": Math.round(base + (Math.random() - 0.5) * 15),
          "Moyenne Mobile": Math.round(base + (Math.random() - 0.5) * 25),
          "Tendance": Math.round(base + (Math.random() - 0.5) * 20),
        };
      });
      return {
        chartData: demoData,
        models: [
          { name: "Lissage Expo", mape: "4.2%", bias: "+1.1%", selected: true },
          { name: "Moyenne Mobile", mape: "5.8%", bias: "-0.5%", selected: false },
          { name: "Tendance", mape: "6.1%", bias: "+2.3%", selected: false },
        ],
        backtestData: [
          { p: "Test 1", r: "€1.35M", pr: "€1.32M", e: "-2.2%" },
          { p: "Test 2", r: "€1.50M", pr: "€1.47M", e: "-2.0%" },
        ],
      };
    }

    const ts = data.timeSeries;
    const fc = data.forecasts;

    // Build chart
    const chartData: Record<string, any>[] = [];

    // Historical
    ts.forEach((p, i) => {
      const label = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      const row: Record<string, any> = { period: label, réel: Math.round(p.value) };
      // Add fitted values from each model (approximate: shift predictions backwards is complex, so skip for historical)
      chartData.push(row);
    });

    // Forecast periods
    fc.models.forEach((model) => {
      model.predictions.forEach((pred, i) => {
        const label = `P+${i + 1}`;
        let existing = chartData.find((r) => r.period === label);
        if (!existing) {
          existing = { period: label };
          chartData.push(existing);
        }
        existing[model.name] = Math.round(pred);
      });
    });

    const models = fc.models.map((m, i) => ({
      name: m.name,
      mape: `${m.mape.toFixed(1)}%`,
      bias: `${m.bias >= 0 ? "+" : ""}${m.bias.toFixed(1)}%`,
      selected: i === 0,
    }));

    // Backtesting summary
    const testSize = Math.max(2, Math.min(Math.floor(ts.length * 0.2), 6));
    const testData = ts.slice(-testSize);
    const trainData = ts.slice(0, -testSize);
    const backtestData = [
      {
        p: "Train set",
        r: `${trainData.length} pts`,
        pr: `${(100 - fc.models[0].mape).toFixed(1)}%`,
        e: `MAPE ${fc.models[0].mape.toFixed(1)}%`,
      },
      {
        p: "Test set",
        r: `${testData.length} pts`,
        pr: fc.bestModel,
        e: `Biais ${fc.models[0].bias >= 0 ? "+" : ""}${fc.models[0].bias.toFixed(1)}%`,
      },
    ];

    return { chartData, models, backtestData };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Prévisions" description="Visualisation des forecasts et comparaison des modèles" icon={<TrendingUp className="h-5 w-5" />} />
      <DataUploadBanner />

      {/* Model cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        {models.map((m) => (
          <div key={m.name} className={`rounded-xl border p-4 transition-all cursor-pointer ${m.selected ? "border-primary bg-primary/5 shadow-elevated" : "border-border bg-card shadow-card hover:shadow-elevated"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-xs font-semibold text-card-foreground truncate">{m.name}</span>
              {m.selected && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Best</span>}
            </div>
            <div className="flex gap-3 text-xs">
              <div><span className="text-muted-foreground">MAPE: </span><span className="font-medium text-card-foreground">{m.mape}</span></div>
              <div><span className="text-muted-foreground">Biais: </span><span className="font-medium text-card-foreground">{m.bias}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card mb-6">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Prévisions multi-modèles</h3>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="réel" stroke="hsl(215, 25%, 20%)" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls={false} />
            {models.map((m, i) => (
              <Line key={m.name} type="monotone" dataKey={m.name} stroke={MODEL_COLORS[i]} strokeWidth={m.selected ? 2.5 : 1.5} strokeDasharray={m.selected ? undefined : "4 4"} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Backtesting table */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Résultats du backtesting</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Info</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Données</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Résultat</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Métrique</th>
            </tr>
          </thead>
          <tbody>
            {backtestData.map((row) => (
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
  );
}
