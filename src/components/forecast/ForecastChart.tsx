import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const MODEL_COLORS = [
  "hsl(152, 69%, 40%)", "hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 60%, 55%)",
  "hsl(330, 80%, 50%)", "hsl(170, 70%, 40%)", "hsl(45, 85%, 45%)",
  "hsl(260, 70%, 55%)", "hsl(15, 85%, 50%)", "hsl(190, 80%, 40%)",
  "hsl(340, 75%, 45%)",
];

const BACKTEST_COLORS = [
  "hsl(152, 69%, 60%)", "hsl(217, 91%, 70%)", "hsl(199, 89%, 68%)",
  "hsl(38, 92%, 70%)", "hsl(0, 84%, 75%)", "hsl(280, 60%, 70%)",
  "hsl(330, 80%, 70%)", "hsl(170, 70%, 60%)", "hsl(45, 85%, 65%)",
  "hsl(260, 70%, 70%)", "hsl(15, 85%, 70%)", "hsl(190, 80%, 60%)",
  "hsl(340, 75%, 65%)",
];

interface ForecastChartProps {
  chartData: Record<string, any>[];
  models: { name: string; selected: boolean }[];
  title: string;
  subtitle?: string;
}

export default function ForecastChart({ chartData, models, title, subtitle }: ForecastChartProps) {
  // Detect backtest keys
  const backtestKeys = models.map(m => `${m.name} (backtest)`).filter(key =>
    chartData.some(d => d[key] != null)
  );
  const hasTestSet = chartData.some(d => d["réel (test)"] != null);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-card-foreground">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 50%)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(214, 20%, 90%)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Historical actual (train) */}
          <Line type="monotone" dataKey="réel" stroke="hsl(215, 25%, 20%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(215, 25%, 20%)" }} connectNulls={false} name="Réel (train)" />
          {/* Test set actual */}
          {hasTestSet && (
            <Line type="monotone" dataKey="réel (test)" stroke="hsl(280, 60%, 55%)" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: "hsl(280, 60%, 55%)", strokeWidth: 2, stroke: "white" }} connectNulls={false} name="Réel (test 20%)" />
          )}
          {/* Backtest predictions on test set */}
          {backtestKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={BACKTEST_COLORS[i % BACKTEST_COLORS.length]}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 3, fill: BACKTEST_COLORS[i % BACKTEST_COLORS.length], strokeWidth: 1, stroke: "white" }}
              connectNulls={false}
            />
          ))}
          {/* Future forecast lines */}
          {models.map((m, i) => (
            <Line
              key={m.name}
              type="monotone"
              dataKey={m.name}
              stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
              strokeWidth={m.selected ? 2.5 : 1.5}
              strokeDasharray={m.selected ? undefined : "6 3"}
              dot={m.selected ? { r: 3, fill: MODEL_COLORS[i % MODEL_COLORS.length] } : false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
