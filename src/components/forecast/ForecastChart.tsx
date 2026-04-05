import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

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
  lastHistoricalPeriod?: string;
  lowerBound?: number[];
  upperBound?: number[];
}

export default function ForecastChart({
  chartData,
  models,
  title,
  subtitle,
  lastHistoricalPeriod,
  lowerBound,
  upperBound,
}: ForecastChartProps) {
  const backtestKeys = models.map(m => `${m.name} (backtest)`).filter(key =>
    chartData.some(d => d[key] != null)
  );
  const hasTestSet = chartData.some(d => d["réel (test)"] != null);
  const hasConfidence = lowerBound && upperBound && lowerBound.length > 0;

  // Inject confidence band into chart data points (forecast periods only)
  const enrichedData = hasConfidence
    ? (() => {
        let forecastIdx = 0;
        return chartData.map(point => {
          const isForecastPoint =
            point["réel"] == null &&
            point["réel (test)"] == null &&
            models.some(m => point[m.name] != null);
          if (isForecastPoint && lowerBound![forecastIdx] != null) {
            const result = {
              ...point,
              confidenceLow: Math.round(lowerBound![forecastIdx]),
              confidenceHigh: Math.round(upperBound![forecastIdx]),
            };
            forecastIdx++;
            return result;
          }
          return point;
        });
      })()
    : chartData;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-sm font-semibold text-card-foreground">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {hasConfidence && (
        <p className="text-[10px] text-muted-foreground mb-3">
          Zone bleue = intervalle de confiance 95% (meilleur modèle)
        </p>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={enrichedData}>
          <defs>
            <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 50%)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 50%)" />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(214, 20%, 90%)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* Bande de confiance ±95% — dessinée en premier pour rester derrière les lignes */}
          {hasConfidence && (
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              stroke="none"
              fill="url(#confidenceGrad)"
              legendType="none"
              connectNulls
              activeDot={false}
            />
          )}
          {hasConfidence && (
            <Area
              type="monotone"
              dataKey="confidenceLow"
              stroke="none"
              fill="white"
              legendType="none"
              connectNulls
              activeDot={false}
            />
          )}

          {/* Ligne verticale séparant historique et prévision */}
          {lastHistoricalPeriod && (
            <ReferenceLine
              x={lastHistoricalPeriod}
              stroke="hsl(215, 25%, 60%)"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: "Aujourd'hui",
                position: "insideTopRight",
                fontSize: 10,
                fill: "hsl(215, 25%, 50%)",
              }}
            />
          )}

          {/* Données réelles (train) */}
          <Line
            type="monotone"
            dataKey="réel"
            stroke="hsl(215, 25%, 20%)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "hsl(215, 25%, 20%)" }}
            connectNulls
            name="Réel (train)"
          />

          {/* Données réelles (test 20%) */}
          {hasTestSet && (
            <Line
              type="monotone"
              dataKey="réel (test)"
              stroke="hsl(280, 60%, 55%)"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: "hsl(280, 60%, 55%)", strokeWidth: 2, stroke: "white" }}
              connectNulls
              name="Réel (test 20%)"
            />
          )}

          {/* Prédictions backtest — modèles sélectionnés uniquement */}
          {backtestKeys.map((key, i) => {
            const modelName = key.replace(" (backtest)", "");
            const isSelected = models.find(m => m.name === modelName)?.selected;
            if (!isSelected) return null;
            return (
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
            );
          })}

          {/* Prévisions futures — modèles sélectionnés */}
          {models.map((m, i) =>
            m.selected ? (
              <Line
                key={m.name}
                type="monotone"
                dataKey={m.name}
                stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: MODEL_COLORS[i % MODEL_COLORS.length] }}
              />
            ) : null
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
