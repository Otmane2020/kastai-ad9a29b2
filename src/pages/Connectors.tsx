import { useState } from "react";
import { Plug, Database, BarChart3, Globe, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ImportWizard from "@/components/ImportWizard";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

const connectors = [
  { name: "ERP (SAP, Oracle)", icon: Database, status: "available" as const, desc: "Connexion directe aux systèmes ERP" },
  { name: "Power BI", icon: BarChart3, status: "available" as const, desc: "Intégration BI pour dashboards" },
  { name: "Tableau", icon: BarChart3, status: "available" as const, desc: "Connecteur Tableau natif" },
  { name: "API REST", icon: Globe, status: "active" as const, desc: "Endpoints pour intégrations externes" },
];

export default function Connectors() {
  const { data, hasData } = useData();
  const [wizardOpen, setWizardOpen] = useState(false);

  const granLabel = { global: "Global", sku: "Par SKU", family: "Par Famille", subfamily: "Par Sous-famille" }[data.granularity];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Connecteurs" description="Import/export de données et intégrations" icon={<Plug className="h-5 w-5" />} />

      {/* Upload zone */}
      <div
        className={cn(
          "mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          hasData ? "border-success/30 bg-success/5" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
        )}
        onClick={() => !hasData && setWizardOpen(true)}
      >
        {hasData ? (
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="text-left">
              <p className="font-display text-sm font-semibold text-foreground">{data.fileName} — importé ✓</p>
              <p className="text-xs text-muted-foreground">
                {data.timeSeries.length} points · Mapping: {data.mapping?.dateCol} → {data.mapping?.valueCol}
                {data.mapping?.productCol && ` · Produit: ${data.mapping.productCol}`}
                {data.mapping?.categoryCol && ` · Catégorie: ${data.mapping.categoryCol}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Granularité: {granLabel}
                {data.groupForecasts.length > 0 && ` · ${data.groupForecasts.length} groupes analysés`}
                {" · "}Meilleur modèle: {data.forecasts?.bestModel} (MAPE: {data.forecasts?.models[0].mape.toFixed(1)}%)
              </p>
            </div>
          </div>
        ) : (
          <div onClick={() => setWizardOpen(true)}>
            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-display text-sm font-semibold text-foreground">Assistant d'import CSV / Excel</p>
            <p className="text-xs text-muted-foreground mt-1">Mapping automatique intelligent · Choix de granularité · Prévisions en un clic</p>
            <button className="mt-4 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Lancer l'import
            </button>
          </div>
        )}
      </div>

      {/* Mapping info */}
      {hasData && data.mapping && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Mapping des colonnes</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Date", value: data.mapping.dateCol, emoji: "📅" },
              { label: "Valeur", value: data.mapping.valueCol, emoji: "📊" },
              { label: "Produit/SKU", value: data.mapping.productCol, emoji: "📦" },
              { label: "Catégorie", value: data.mapping.categoryCol, emoji: "🏷️" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{m.emoji} {m.label}</p>
                <p className="font-medium text-sm text-card-foreground mt-0.5">
                  {m.value || <span className="text-muted-foreground italic">Non mappé</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other connectors */}
      <h3 className="font-display text-sm font-semibold text-foreground mb-4">Autres connecteurs</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {connectors.map((c) => (
          <div key={c.name} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold text-card-foreground">{c.name}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    c.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {c.status === "active" ? "Actif" : "Bientôt"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImportWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
