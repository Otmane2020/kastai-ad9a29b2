import { AlertTriangle, TrendingDown, Package, Bell } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const alerts = [
  { id: 1, type: "critical" as const, title: "Rupture de stock imminente", desc: "SKU #1042 - Stock < seuil critique (3 jours restants)", time: "Il y a 2h", icon: Package },
  { id: 2, type: "critical" as const, title: "Baisse ventes anormale", desc: "Catégorie Textile: -23% vs prévision cette semaine", time: "Il y a 4h", icon: TrendingDown },
  { id: 3, type: "warning" as const, title: "Écart prévision détecté", desc: "Le modèle ARIMA sous-performe (MAPE > 8%) sur la région Sud", time: "Il y a 6h", icon: AlertTriangle },
  { id: 4, type: "info" as const, title: "Saisonnalité détectée", desc: "Pic de demande prévu dans 14 jours - catégorie Électronique", time: "Hier", icon: Bell },
  { id: 5, type: "warning" as const, title: "Surstock détecté", desc: "SKU #3087 - 45 jours de stock vs 20 jours objectif", time: "Hier", icon: Package },
];

const recommendations = [
  { action: "Réapprovisionner SKU #1042", impact: "Éviter €45k de ventes perdues", priority: "Urgent" },
  { action: "Ajuster prévisions Textile -15%", impact: "Améliorer MAPE de 2.1%", priority: "Haute" },
  { action: "Promotion sur SKU #3087", impact: "Réduire surstock de 25 jours", priority: "Moyenne" },
  { action: "Augmenter stock Électronique +20%", impact: "Capter pic saisonnier", priority: "Haute" },
];

export default function Alerts() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Alertes & Recommandations" description="Détection d'anomalies et suggestions automatiques" icon={<AlertTriangle className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Alertes récentes</h3>
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
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
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    r.priority === "Urgent" && "bg-destructive/10 text-destructive",
                    r.priority === "Haute" && "bg-warning/10 text-warning",
                    r.priority === "Moyenne" && "bg-primary/10 text-primary"
                  )}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Impact estimé : {r.impact}</p>
                <button className="mt-3 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  Appliquer
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
