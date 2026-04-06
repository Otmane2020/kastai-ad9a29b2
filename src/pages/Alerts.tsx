import { ShieldAlert, TrendingDown, Boxes, BellRing, TrendingUp } from "lucide-react";
import CopilotInline from "@/components/CopilotInline";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const demoAlerts = [
  { id: 1, type: "critical" as const, title: "Rupture de stock imminente", desc: "SKU #1042 - Stock < seuil critique", time: "Il y a 2h", icon: Boxes },
  { id: 2, type: "critical" as const, title: "Baisse ventes anormale", desc: "Catégorie Textile: -23% vs prévision", time: "Il y a 4h", icon: TrendingDown },
  { id: 3, type: "warning" as const, title: "Écart prévision détecté", desc: "Modèle sous-performe (MAPE > 8%)", time: "Il y a 6h", icon: ShieldAlert },
  { id: 4, type: "info" as const, title: "Saisonnalité détectée", desc: "Pic de demande prévu dans 14 jours", time: "Hier", icon: BellRing },
];

export default function Alerts() {
  const { data, hasData } = useData();

  const { alerts, recommendations } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      return {
        alerts: demoAlerts,
        recommendations: [
          { action: "Importez vos données", impact: "Activer les alertes intelligentes", priority: "Haute" },
        ],
      };
    }

    const ts = data.timeSeries;
    const values = ts.map((t) => t.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

    // Detect anomalies with z-score
    const generatedAlerts: typeof demoAlerts = [];
    const lastN = ts.slice(-10);
    lastN.forEach((point, i) => {
      const z = std > 0 ? (point.value - mean) / std : 0;
      if (Math.abs(z) > 1.5) {
        generatedAlerts.push({
          id: i + 1,
          type: Math.abs(z) > 2 ? "critical" : "warning",
          title: z < 0 ? "Baisse anormale détectée" : "Pic anormal détecté",
          desc: `${point.product || "Donnée"} — valeur ${Math.round(point.value)} (z-score: ${z.toFixed(1)})`,
          time: point.date.toLocaleDateString("fr-FR"),
          icon: z < 0 ? TrendingDown : TrendingUp,
        });
      }
    });

    // Model performance alerts
    data.forecasts.models.forEach((m) => {
      if (m.mape > 8) {
        generatedAlerts.push({
          id: 100 + generatedAlerts.length,
          type: "warning",
          title: `Modèle ${m.name} sous-performe`,
          desc: `MAPE: ${m.mape.toFixed(1)}% — au-dessus du seuil de 8%`,
          time: "Analyse",
          icon: ShieldAlert,
        });
      }
    });

    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: 1,
        type: "info" as const,
        title: "Aucune anomalie détectée",
        desc: "Toutes les valeurs sont dans les intervalles normaux",
        time: "Maintenant",
        icon: BellRing,
      });
    }

    // Recommendations
    const best = data.forecasts.models[0];
    const recs = [
      { action: `Utiliser ${best.name} pour les prévisions`, impact: `MAPE de ${best.mape.toFixed(1)}% seulement`, priority: "Haute" },
    ];
    if (best.bias > 2) recs.push({ action: "Ajuster le biais positif", impact: `Biais de +${best.bias.toFixed(1)}%`, priority: "Moyenne" });
    if (best.bias < -2) recs.push({ action: "Corriger la sous-estimation", impact: `Biais de ${best.bias.toFixed(1)}%`, priority: "Haute" });

    const trend = values.slice(-3).reduce((a, b) => a + b, 0) / 3 - values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    if (trend < 0) recs.push({ action: "Tendance baissière détectée", impact: "Réajuster objectifs", priority: "Urgent" });
    else recs.push({ action: "Tendance haussière confirmée", impact: "Augmenter les objectifs", priority: "Moyenne" });

    return { alerts: generatedAlerts, recommendations: recs };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Alertes & Recommandations" description="Détection d'anomalies et suggestions automatiques" icon={<ShieldAlert className="h-5 w-5" />} />
      <DataUploadBanner />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">
            Alertes {hasData && <span className="text-muted-foreground font-normal">({alerts.length})</span>}
          </h3>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={cn(
                "rounded-xl border p-4 shadow-card transition-all hover:shadow-elevated",
                a.type === "critical" && "border-destructive/30 bg-destructive/5",
                a.type === "warning" && "border-warning/30 bg-warning/5",
                a.type === "info" && "border-primary/30 bg-primary/5"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    a.type === "critical" && "bg-destructive/10 text-destructive",
                    a.type === "warning" && "bg-warning/10 text-warning",
                    a.type === "info" && "bg-primary/10 text-primary"
                  )}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{a.desc}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{a.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Recommandations IA</h3>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-all">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-card-foreground">{r.action}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ml-2",
                    r.priority === "Urgent" && "bg-destructive/10 text-destructive",
                    r.priority === "Haute" && "bg-warning/10 text-warning",
                    r.priority === "Moyenne" && "bg-primary/10 text-primary"
                  )}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{r.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CopilotInline
        context="Page Alertes — anomalies détectées via z-score, ruptures de stock, écarts de prévision"
        insight="2 alertes critiques nécessitent une action immédiate : rupture SKU #1042 et baisse anormale Textile -23%. Je recommande un réapprovisionnement d'urgence et une révision du modèle de prévision Textile."
        chips={["Rupture stock", "Anomalies", "Actions prioritaires", "Prévision corrective"]}
      />
    </div>
  );
}
