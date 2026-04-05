import { useState, useCallback, useRef, useEffect } from "react";
import { Cable, DatabaseZap, PieChart, Globe2, FileUp, CircleCheck, CloudUpload, Clock4, CirclePlay, Trash2, Timer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ImportWizard from "@/components/ImportWizard";
import { useData } from "@/context/DataContext";
import { parseFile, autoMapColumns } from "@/lib/dataParser";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const connectors = [
  { name: "ERP (SAP, Oracle)", icon: DatabaseZap, status: "available" as const, desc: "Connexion directe aux systèmes ERP" },
  { name: "Power BI", icon: PieChart, status: "available" as const, desc: "Intégration BI pour dashboards" },
  { name: "Tableau", icon: PieChart, status: "available" as const, desc: "Connecteur Tableau natif" },
  { name: "API REST", icon: Globe2, status: "active" as const, desc: "Endpoints pour intégrations externes" },
];

interface ImportHistoryEntry {
  id: string;
  fileName: string;
  date: string;
  rows: number;
  columns: number;
  mapping: string;
  status: "success" | "error";
}

function getImportHistory(): ImportHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("kastai_import_history") || "[]");
  } catch { return []; }
}

function addToHistory(entry: Omit<ImportHistoryEntry, "id" | "date">) {
  const history = getImportHistory();
  history.unshift({ ...entry, id: crypto.randomUUID(), date: new Date().toISOString() });
  localStorage.setItem("kastai_import_history", JSON.stringify(history.slice(0, 20)));
}

function clearHistory() {
  localStorage.removeItem("kastai_import_history");
}

export default function Connectors() {
  const { data, hasData, processData, clearData } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [history, setHistory] = useState<ImportHistoryEntry[]>(getImportHistory);
  const [dbFiles, setDbFiles] = useState<any[]>([]);
  const [forecastRuns, setForecastRuns] = useState<Record<string, any>>({});
  const [launchingFileId, setLaunchingFileId] = useState<string | null>(null);

  // Fetch uploaded files + forecast runs from database
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [filesRes, runsRes] = await Promise.all([
        supabase
          .from("uploaded_files")
          .select("id, file_name, row_count, column_count, granularity, uploaded_at, mapping")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: false })
          .limit(20),
        supabase
          .from("forecast_runs")
          .select("id, file_id, best_model, best_mape, total_points, group_count, created_at, models_results, granularity, horizon, file_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (filesRes.data) setDbFiles(filesRes.data);
      if (runsRes.data) {
        const map: Record<string, any> = {};
        runsRes.data.forEach((r) => { if (r.file_id && !map[r.file_id]) map[r.file_id] = r; });
        setForecastRuns(map);
      }
    })();
  }, [wizardOpen]);

  // Launch forecast for a specific file
  const handleLaunchFromFile = useCallback(async (fileId: string) => {
    setLaunchingFileId(fileId);
    try {
      const run = forecastRuns[fileId];
      const file = dbFiles.find(f => f.id === fileId);
      const serverResult = run?.models_results as any;
      const hasValidResults = serverResult && serverResult.models && Array.isArray(serverResult.models) && serverResult.models.length > 0;
      
      if (run && hasValidResults && file) {
        // Already calculated with valid results — load into DataContext
        const mapping = file.mapping as any;
        
        if (hasData && data.raw.length > 0 && data.fileName === file.file_name) {
          await processData(data.raw, data.columns, mapping, file.file_name, (file.granularity || "global") as any, run.horizon || 6, "revenue", serverResult);
        } else {
          await processData([], file.mapping ? Object.values(mapping).filter(Boolean).map(String) : [], mapping, file.file_name, (file.granularity || "global") as any, run.horizon || 6, "revenue", serverResult);
        }
        navigate("/forecast");
        toast({ title: "Prévisions chargées", description: `Résultats restaurés (${run.best_model})` });
      } else {
        // No valid forecast — need to re-import and run
        if (hasData && data.raw.length > 0 && data.fileName === file?.file_name) {
          await processData(data.raw, data.columns, data.mapping!, data.fileName!, data.granularity);
          navigate("/forecast");
          toast({ title: "Prévisions calculées", description: "Modèles exécutés avec succès" });
        } else {
          toast({ title: "Réimportation nécessaire", description: "Veuillez réimporter ce fichier pour lancer les prévisions." });
        }
      }
    } catch (err) {
      console.error("Launch from file error:", err);
      toast({ title: "Erreur", description: "Impossible de charger les prévisions.", variant: "destructive" });
    }
    setLaunchingFileId(null);
  }, [forecastRuns, hasData, data, processData, navigate, toast, dbFiles]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const granLabel = { global: "Global", sku: "Par SKU", family: "Par Famille", subfamily: "Par Sous-famille" }[data.granularity];

  // Quick load: import file + run forecast directly
  const handleQuickLoad = useCallback(async (file: File) => {
    setQuickLoading(true);
    try {
      const { rows, columns } = await parseFile(file);
      if (rows.length === 0) { setQuickLoading(false); return; }
      const mapping = autoMapColumns(columns, rows);
      const granularity = mapping.productCol ? "sku" : "global";
      await processData(rows, columns, mapping, file.name, granularity);
      addToHistory({ fileName: file.name, rows: rows.length, columns: columns.length, mapping: `${mapping.dateCol} → ${mapping.valueCol}`, status: "success" });
      toast({ title: "Prévisions calculées", description: `${file.name} — modèles exécutés avec succès` });
      navigate("/forecast");
    } catch (err) {
      console.error("Quick load error:", err);
      addToHistory({ fileName: file.name, rows: 0, columns: 0, mapping: "Erreur", status: "error" });
      toast({ title: "Erreur", description: "Impossible de traiter le fichier.", variant: "destructive" });
    }
    setQuickLoading(false);
  }, [processData, navigate, toast]);

  // Re-run forecast on current data
  const handleReloadForecast = useCallback(async () => {
    if (!hasData) return;
    setLoadingForecast(true);
    try {
      await processData(data.raw, data.columns, data.mapping!, data.fileName!, data.granularity);
      toast({ title: "Prévisions relancées", description: "Modèles recalculés avec succès" });
      navigate("/forecast");
    } catch (err) {
      console.error("Reload forecast error:", err);
      toast({ title: "Erreur", description: "Impossible de relancer les prévisions.", variant: "destructive" });
    }
    setLoadingForecast(false);
  }, [hasData, data, processData, navigate, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Connecteurs" description="Import/export de données et intégrations" icon={<Cable className="h-5 w-5" />} />

      {/* CloudUpload zone */}
      <div
        className={cn(
          "mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          hasData ? "border-success/30 bg-success/5" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
        )}
        onClick={() => !hasData && setWizardOpen(true)}
      >
        {hasData ? (
          <div className="flex items-center justify-center gap-3">
            <CircleCheck className="h-8 w-8 text-success" />
            <div className="text-left flex-1">
              <p className="font-display text-sm font-semibold text-foreground">{data.fileName} — importé ✓</p>
              <p className="text-xs text-muted-foreground">
                {data.timeSeries.length} points · Mapping: {data.mapping?.dateCol} → {data.mapping?.valueCol || (data.mapping as any)?.revenueCol || (data.mapping as any)?.quantityCol}
                {data.mapping?.productCol && ` · Produit: ${data.mapping.productCol}`}
                {data.mapping?.categoryCol && ` · Catégorie: ${data.mapping.categoryCol}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Granularité: {granLabel}
                {data.groupForecasts.length > 0 && ` · ${data.groupForecasts.length} groupes analysés`}
                {data.forecasts && ` · Meilleur modèle: ${data.forecasts.bestModel} (MAPE: ${data.forecasts.models[0].mape.toFixed(1)}%)`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); handleReloadForecast(); }}
                disabled={loadingForecast}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loadingForecast ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <CirclePlay className="h-3.5 w-3.5" />
                )}
                Relancer prévisions
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setWizardOpen(true); }}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground hover:bg-muted/50 transition-colors"
              >
                <CloudUpload className="h-3.5 w-3.5" />
                Nouvel import
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); clearData(); }}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setWizardOpen(true)}>
            <FileUp className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-display text-sm font-semibold text-foreground">Assistant d'import CSV / Excel</p>
            <p className="text-xs text-muted-foreground mt-1">Mapping automatique intelligent · Choix de granularité · Prévisions en un clic</p>
            <button className="mt-4 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Lancer l'import
            </button>
          </div>
        )}
      </div>

      {/* Quick Load: CSV/Excel → forecast in one click */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CirclePlay className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-card-foreground">Chargement rapide</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Import + prévisions automatiques</span>
        </div>
        <input
          ref={quickInputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQuickLoad(f); }}
        />
        <button
          onClick={() => quickInputRef.current?.click()}
          disabled={quickLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm font-medium transition-all",
            quickLoading
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-card-foreground cursor-pointer"
          )}
        >
          {quickLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Analyse et calcul des prévisions...
            </>
          ) : (
            <>
              <CloudUpload className="h-4 w-4" />
              Charger un fichier CSV/Excel → Load prévision
            </>
          )}
        </button>
      </div>

      {/* Mapping info */}
      {hasData && data.mapping && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Mapping des colonnes</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Date", value: data.mapping.dateCol, emoji: "" },
              { label: "Valeur", value: data.mapping.valueCol || (data.mapping as any)?.revenueCol || (data.mapping as any)?.quantityCol, emoji: "" },
              { label: "Produit/SKU", value: data.mapping.productCol, emoji: "" },
              { label: "Catégorie", value: data.mapping.categoryCol, emoji: "" },
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

      {/* Fichiers importés (base de données) */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock4 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-semibold text-card-foreground">Historique des imports</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{dbFiles.length} fichier(s) enregistré(s)</span>
        </div>
        {dbFiles.length === 0 && history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun import effectué</p>
        ) : (
          <div className="space-y-2">
            {/* DB files first */}
            {dbFiles.map((f) => {
              const mapping = f.mapping as any;
              const mappingLabel = mapping ? `${mapping.dateCol || "?"} → ${mapping.valueCol || mapping.revenueCol || mapping.quantityCol || "?"}` : "—";
              const run = forecastRuns[f.id];
              const sr = run?.models_results as any;
              const hasValidRun = run && sr && sr.models && Array.isArray(sr.models) && sr.models.length > 0;
              return (
                <div key={f.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 text-xs">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CircleCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground truncate">{f.file_name}</p>
                    <p className="text-muted-foreground">
                      {f.row_count ?? "?"} lignes · {f.column_count ?? "?"} col · {mappingLabel} · {f.granularity ?? "global"}
                    </p>
                    {hasValidRun && (
                      <p className="text-success mt-0.5">
                        ✓ {run.best_model} · MAPE {run.best_mape?.toFixed(1) ?? "—"}% · {run.group_count ?? 0} groupes
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLaunchFromFile(f.id)}
                      disabled={launchingFileId === f.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        hasValidRun
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {launchingFileId === f.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <CirclePlay className="h-3 w-3" />
                      )}
                      {hasValidRun ? "Voir" : "Lancer"}
                    </button>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Fallback: localStorage entries not in DB */}
            {history.filter(h => !dbFiles.some(f => f.file_name === h.fileName)).slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 text-xs">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  entry.status === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {entry.status === "success" ? <CircleCheck className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground truncate">{entry.fileName}</p>
                  <p className="text-muted-foreground">
                    {entry.rows} lignes · {entry.columns} col · {entry.mapping}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <Timer className="h-3 w-3" />
                  {new Date(entry.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
