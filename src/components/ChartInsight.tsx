/**
 * ChartInsight — auto-generated synthesis/recommendation/alert card
 * shown below each chart on Forecast, Dashboard, Alerts, KPIReports.
 */
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type InsightSeverity = "success" | "warning" | "danger" | "info";

export interface Insight {
  label: string;
  message: string;
  severity: InsightSeverity;
}

interface ChartInsightProps {
  insights: Insight[];
  title?: string;
  className?: string;
}

const icons: Record<InsightSeverity, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertTriangle,
  info: Info,
};

const colors: Record<InsightSeverity, string> = {
  success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400",
};

const iconColors: Record<InsightSeverity, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  info: "text-blue-500",
};

export function buildForecastInsights(params: {
  bestModel: string;
  mape: number | null;
  bias: number | null;
  lastValue: number;
  firstForecast: number;
  seriesLength: number;
}): Insight[] {
  const { bestModel, mape, bias, lastValue, firstForecast, seriesLength } = params;
  const insights: Insight[] = [];

  // Model quality
  if (mape !== null && !isNaN(mape)) {
    if (mape < 8) {
      insights.push({ label: "Excellente précision", message: `${bestModel} — MAPE ${mape.toFixed(1)}% : prévision très fiable.`, severity: "success" });
    } else if (mape < 15) {
      insights.push({ label: "Bonne précision", message: `${bestModel} — MAPE ${mape.toFixed(1)}% : résultats exploitables.`, severity: "info" });
    } else {
      insights.push({ label: "Précision limitée", message: `MAPE ${mape.toFixed(1)}% : données insuffisantes ou forte volatilité. Enrichissez le dataset.`, severity: "warning" });
    }
  } else {
    insights.push({ label: "Métriques indisponibles", message: "Jeu de données trop court pour un backtesting fiable (< 4 points). Ajoutez plus d'historique.", severity: "warning" });
  }

  // Data length warning
  if (seriesLength < 12) {
    insights.push({ label: "Historique court", message: `Seulement ${seriesLength} périodes. Les modèles saisonniers nécessitent au moins 24 points pour être fiables.`, severity: "warning" });
  }

  // Bias
  if (bias !== null && !isNaN(bias) && Math.abs(bias) > 5) {
    const dir = bias > 0 ? "sur-estime" : "sous-estime";
    insights.push({ label: "Biais détecté", message: `Le modèle ${dir} systématiquement de ${Math.abs(bias).toFixed(1)}%. Vérifiez les données d'entraînement.`, severity: "warning" });
  }

  // Trend
  const delta = firstForecast - lastValue;
  const deltaP = lastValue !== 0 ? (delta / lastValue) * 100 : 0;
  if (deltaP > 10) {
    insights.push({ label: "Tendance haussière", message: `Croissance projetée de +${deltaP.toFixed(1)}% dès la première période. Anticipez les besoins en stock.`, severity: "info" });
  } else if (deltaP < -10) {
    insights.push({ label: "Baisse projetée", message: `Repli de ${Math.abs(deltaP).toFixed(1)}% attendu. Réduisez les commandes et revoyez les objectifs.`, severity: "danger" });
  }

  return insights;
}

export default function ChartInsight({ insights, title = "Synthèse & Recommandations", className }: ChartInsightProps) {
  if (insights.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-2.5", className)}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-2">
        {insights.map((ins, i) => {
          const Icon = icons[ins.severity];
          return (
            <div key={i} className={cn("flex items-start gap-3 rounded-lg border px-3 py-2.5", colors[ins.severity])}>
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColors[ins.severity])} />
              <div>
                <span className="text-xs font-semibold">{ins.label} — </span>
                <span className="text-xs">{ins.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
