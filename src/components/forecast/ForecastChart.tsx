import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MODEL_COLORS = [
  "hsl(152, 69%, 40%)", "hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
];

interface ForecastChartProps {
  chartData: Record<string, any>[];
  models: { name: string; selected: boolean }[];
  title: string;
  subtitle?: string;
}

export default function ForecastChart({ chartData, models, title, subtitle }: ForecastChartProps) {
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
          <Line type="monotone" dataKey="réel" stroke="hsl(215, 25%, 20%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(215, 25%, 20%)" }} connectNulls={false} />
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
