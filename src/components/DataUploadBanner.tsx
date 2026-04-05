import { useState } from "react";
import { CloudUpload, FileUp, CircleCheck, X, Zap } from "lucide-react";
import { useData } from "@/context/DataContext";
import ImportWizard from "@/components/ImportWizard";
import { cn } from "@/lib/utils";

export default function DataUploadBanner() {
  const { data, clearData, hasData } = useData();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (data.isProcessing) {
    return (
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium text-primary">Analyse en cours... mapping automatique et prévisions</span>
        </div>
      </div>
    );
  }

  if (hasData) {
    const granLabel = { global: "Global", sku: "Par SKU", family: "Par Famille", subfamily: "Par Sous-famille" }[data.granularity];
    return (
      <div className="mb-4 rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <span className="text-sm font-medium text-foreground">{data.fileName}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {data.timeSeries.length} points · {data.mapping?.dateCol} → {data.mapping?.valueCol}
                {data.mapping?.productCol && ` · ${data.mapping.productCol}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{granLabel}</span>
            {data.groupForecasts.length > 0 && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {data.groupForecasts.length} groupes
              </span>
            )}
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              {data.forecasts?.bestModel}
            </span>
            <button onClick={clearData} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-border bg-card/50 p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition-all"
        onClick={() => setWizardOpen(true)}
      >
        <div className="flex items-center justify-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Importez un fichier CSV/Excel</span> pour activer les prévisions sur vos données
          </span>
          <Upload className="h-4 w-4 text-primary" />
        </div>
      </div>
      <ImportWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
