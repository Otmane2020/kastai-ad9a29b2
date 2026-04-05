import { Plug, Upload, Database, BarChart3, Globe } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";

const connectors = [
  { name: "CSV / Excel", icon: Upload, status: "active" as const, desc: "Import/export avec mapping automatique" },
  { name: "ERP (SAP, Oracle)", icon: Database, status: "available" as const, desc: "Connexion directe aux systèmes ERP" },
  { name: "Power BI", icon: BarChart3, status: "available" as const, desc: "Intégration BI pour dashboards" },
  { name: "Tableau", icon: BarChart3, status: "available" as const, desc: "Connecteur Tableau natif" },
  { name: "API REST", icon: Globe, status: "active" as const, desc: "Endpoints pour intégrations externes" },
];

export default function Connectors() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Connecteurs" description="Import/export de données et intégrations" icon={<Plug className="h-5 w-5" />} />

      {/* Upload zone */}
      <div
        className={cn(
          "mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-all",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-display text-sm font-semibold text-foreground">Glissez vos fichiers ici</p>
        <p className="text-xs text-muted-foreground mt-1">CSV, Excel — mapping automatique intelligent des colonnes</p>
        <button className="mt-4 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          Parcourir
        </button>
      </div>

      {/* Connectors grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    {c.status === "active" ? "Actif" : "Disponible"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                <button className={cn(
                  "mt-3 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  c.status === "active" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary hover:bg-primary/20"
                )}>
                  {c.status === "active" ? "Configuré" : "Connecter"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
