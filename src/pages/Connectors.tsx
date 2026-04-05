import { useRef, useState } from "react";
import { Plug, Upload, Database, BarChart3, Globe, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

const connectors = [
  { name: "ERP (SAP, Oracle)", icon: Database, status: "available" as const, desc: "Connexion directe aux systèmes ERP" },
  { name: "Power BI", icon: BarChart3, status: "available" as const, desc: "Intégration BI pour dashboards" },
  { name: "Tableau", icon: BarChart3, status: "available" as const, desc: "Connecteur Tableau natif" },
  { name: "API REST", icon: Globe, status: "active" as const, desc: "Endpoints pour intégrations externes" },
];

export default function Connectors() {
  const { data, uploadFile, hasData } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "tsv", "txt", "xlsx", "xls"].includes(ext || "")) return;
    uploadFile(file);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Connecteurs" description="Import/export de données et intégrations" icon={<Plug className="h-5 w-5" />} />

      {/* Upload zone */}
      <div
        className={cn(
          "mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
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
              <p className="text-xs text-success mt-1">
                Meilleur modèle: {data.forecasts?.bestModel} (MAPE: {data.forecasts?.models[0].mape.toFixed(1)}%)
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-display text-sm font-semibold text-foreground">Glissez vos fichiers ici</p>
            <p className="text-xs text-muted-foreground mt-1">CSV, Excel — mapping automatique intelligent des colonnes</p>
            <p className="text-xs text-muted-foreground mt-0.5">Détection automatique: dates, ventes, produits, catégories</p>
            <button className="mt-4 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Parcourir
            </button>
          </>
        )}
      </div>

      {/* Mapping info */}
      {hasData && data.mapping && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Mapping automatique détecté</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Date", value: data.mapping.dateCol },
              { label: "Valeur", value: data.mapping.valueCol },
              { label: "Produit", value: data.mapping.productCol },
              { label: "Catégorie", value: data.mapping.categoryCol },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-medium text-sm text-card-foreground mt-0.5">
                  {m.value || <span className="text-muted-foreground italic">Non détecté</span>}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Colonnes disponibles: {data.columns.join(", ")}</p>
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
    </div>
  );
}
