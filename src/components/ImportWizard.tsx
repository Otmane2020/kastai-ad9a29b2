import { useState, useRef, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, ChevronRight, ChevronLeft, Play, X, AlertCircle, Sparkles, Brain, Loader2, Server } from "lucide-react";
import { parseFile, autoMapColumns, ColumnMapping } from "@/lib/dataParser";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { AIMapping, ColumnInfo, buildForecastPayload } from "@/lib/forecastPayload";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "granularity" | "launch";

const STEP_LABELS: Record<Step, string> = {
  upload: "Import fichier",
  mapping: "Mapping IA",
  granularity: "Granularité",
  launch: "Lancer les prévisions",
};

const STEPS: Step[] = ["upload", "mapping", "granularity", "launch"];

interface WizardState {
  file: File | null;
  rows: Record<string, any>[];
  columns: string[];
  mapping: ColumnMapping;
  granularity: "global" | "sku" | "family" | "subfamily";
  preview: Record<string, any>[];
  aiMapping: AIMapping | null;
  aiAnalyzing: boolean;
  allColumnInfos: ColumnInfo[];
  businessContext: string;
}

const initialWizard: WizardState = {
  file: null,
  rows: [],
  columns: [],
  mapping: { dateCol: null, valueCol: null, productCol: null, categoryCol: null },
  granularity: "global",
  preview: [],
  aiMapping: null,
  aiAnalyzing: false,
  allColumnInfos: [],
  businessContext: "",
};

export default function ImportWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { processData } = useData();
  const [step, setStep] = useState<Step>("upload");
  const [wizard, setWizard] = useState<WizardState>(initialWizard);
  const [parsing, setParsing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMode, setLaunchMode] = useState<"local" | "server">("local");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  // AI-powered smart mapping
  const runAIMapping = useCallback(async (columns: string[], rows: Record<string, any>[], fileName: string) => {
    setWizard((prev) => ({ ...prev, aiAnalyzing: true }));
    try {
      const { data, error } = await supabase.functions.invoke("smart-mapping", {
        body: { columns, sampleRows: rows.slice(0, 2), fileName },
      });

      if (error) throw error;

      const aiResult = data as AIMapping;
      setWizard((prev) => ({
        ...prev,
        aiAnalyzing: false,
        aiMapping: aiResult,
        mapping: {
          dateCol: aiResult.dateCol,
          valueCol: aiResult.valueCol,
          productCol: aiResult.productCol,
          categoryCol: aiResult.categoryCol,
        },
        granularity: aiResult.suggestedGranularity || (aiResult.productCol ? "sku" : "global"),
        allColumnInfos: aiResult.allColumns || [],
        businessContext: aiResult.businessContext || "",
      }));
    } catch (err) {
      console.warn("AI mapping failed, using regex fallback:", err);
      // Fallback to regex-based mapping
      const fallback = autoMapColumns(columns, rows);
      setWizard((prev) => ({
        ...prev,
        aiAnalyzing: false,
        mapping: fallback,
        granularity: fallback.productCol ? "sku" : "global",
      }));
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "tsv", "txt", "xlsx", "xls"].includes(ext || "")) {
      setError("Format non supporté. Utilisez CSV, TSV ou Excel.");
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const { rows, columns } = await parseFile(file);
      if (rows.length === 0) {
        setError("Fichier vide ou illisible.");
        setParsing(false);
        return;
      }

      setWizard((prev) => ({
        ...prev,
        file,
        rows,
        columns,
        preview: rows.slice(0, 5),
      }));
      setParsing(false);
      setStep("mapping");

      // Launch AI mapping in background
      runAIMapping(columns, rows, file.name);
    } catch (err) {
      setError("Erreur lors du parsing du fichier.");
      setParsing(false);
    }
  }, [runAIMapping]);

  const updateMapping = (field: keyof ColumnMapping, value: string | null) => {
    setWizard((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: value === "" ? null : value },
    }));
  };

  const canProceedMapping = wizard.mapping.dateCol && wizard.mapping.valueCol;

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setError(null);

    try {
      if (launchMode === "server") {
        // Send to Python server
        const serverUrl = localStorage.getItem("kastai_server_url") || "http://localhost:8000";
        const serverKey = localStorage.getItem("kastai_server_key") || "";
        const payload = buildForecastPayload(
          wizard.rows, wizard.columns, wizard.mapping, wizard.aiMapping, wizard.file!.name, wizard.granularity
        );

        const res = await fetch(`${serverUrl}/api/forecast`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(serverKey ? { Authorization: `Bearer ${serverKey}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(120000),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(`Serveur Python: ${res.status} ${errText}`);
        }

        const serverResult = await res.json();
        // Process with server result (pass through to DataContext with server forecasts)
        await processData(wizard.rows, wizard.columns, wizard.mapping, wizard.file!.name, wizard.granularity, serverResult);
      } else {
        // Local JS engine
        await processData(wizard.rows, wizard.columns, wizard.mapping, wizard.file!.name, wizard.granularity);
      }

      setLaunching(false);
      onClose();
      setWizard(initialWizard);
      setStep("upload");
    } catch (err: any) {
      setError(err.message || "Erreur lors du calcul des prévisions.");
      setLaunching(false);
    }
  }, [wizard, processData, onClose, launchMode]);

  const uniqueValues = useMemo(() => {
    if (!wizard.rows.length) return { products: [], categories: [] };
    const prodCol = wizard.mapping.productCol;
    const catCol = wizard.mapping.categoryCol;
    const products = prodCol ? [...new Set(wizard.rows.map((r) => String(r[prodCol] ?? "")).filter(Boolean))] : [];
    const categories = catCol ? [...new Set(wizard.rows.map((r) => String(r[catCol] ?? "")).filter(Boolean))] : [];
    return { products: products.slice(0, 20), categories: categories.slice(0, 20) };
  }, [wizard.rows, wizard.mapping]);

  const serverConfigured = !!localStorage.getItem("kastai_server_url");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-elevated mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-card-foreground">Assistant d'import intelligent</h2>
          </div>
          <button onClick={() => { onClose(); setWizard(initialWizard); setStep("upload"); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border bg-muted/20">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                i < stepIdx ? "bg-success text-success-foreground" :
                i === stepIdx ? "gradient-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {i < stepIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block truncate",
                i === stepIdx ? "text-card-foreground" : "text-muted-foreground"
              )}>
                {STEP_LABELS[s]}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === "upload" && (
            <div
              className={cn(
                "rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer",
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
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
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-primary font-medium">Analyse du fichier en cours...</span>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-display text-base font-semibold text-foreground">Glissez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground mt-2">CSV, TSV, Excel (.xlsx, .xls)</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" /> L'IA analysera automatiquement vos colonnes
                  </p>
                  <button className="mt-4 rounded-lg gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                    Parcourir
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === "mapping" && (
            <div className="space-y-5">
              {/* AI analysis status */}
              {wizard.aiAnalyzing && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-pulse">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-primary">IA en cours d'analyse...</p>
                    <p className="text-xs text-muted-foreground">Analyse des 2 premières lignes pour comprendre le contexte de vos données</p>
                  </div>
                </div>
              )}

              {/* AI result banner */}
              {wizard.aiMapping && !wizard.aiAnalyzing && (
                <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-success mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-success">Mapping IA terminé</p>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          {wizard.aiMapping.confidence}% confiance
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{wizard.businessContext}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-display text-sm font-semibold text-card-foreground">{wizard.file?.name}</span>
                <span className="text-xs text-muted-foreground">— {wizard.rows.length} lignes · {wizard.columns.length} colonnes</span>
              </div>

              {/* Main mapping fields */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Mapping principal (modifiable)</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {([
                    { key: "dateCol" as const, label: "📅 Colonne Date", required: true },
                    { key: "valueCol" as const, label: "📊 Colonne Valeur (à prévoir)", required: true },
                    { key: "productCol" as const, label: "📦 Colonne Produit/SKU", required: false },
                    { key: "categoryCol" as const, label: "🏷️ Colonne Catégorie/Famille", required: false },
                  ]).map((field) => {
                    const aiInfo = wizard.allColumnInfos.find((c) => c.name === wizard.mapping[field.key]);
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="flex items-center gap-1 text-sm font-medium text-card-foreground">
                          {field.label}
                          {field.required && <span className="text-destructive">*</span>}
                        </label>
                        <select
                          value={wizard.mapping[field.key] || ""}
                          onChange={(e) => updateMapping(field.key, e.target.value)}
                          className={cn(
                            "w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors",
                            wizard.mapping[field.key]
                              ? "border-success/50 text-card-foreground"
                              : field.required ? "border-warning/50 text-muted-foreground" : "border-border text-muted-foreground"
                          )}
                        >
                          <option value="">— Non mappé —</option>
                          {wizard.columns.map((col) => {
                            const info = wizard.allColumnInfos.find((c) => c.name === col);
                            return (
                              <option key={col} value={col}>
                                {col}{info ? ` (${info.role})` : ""}
                              </option>
                            );
                          })}
                        </select>
                        {aiInfo && <p className="text-xs text-success">{aiInfo.description}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All columns info */}
              {wizard.allColumnInfos.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Toutes les colonnes détectées par l'IA ({wizard.allColumnInfos.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {wizard.allColumnInfos.map((col) => {
                      const isMapped = [wizard.mapping.dateCol, wizard.mapping.valueCol, wizard.mapping.productCol, wizard.mapping.categoryCol].includes(col.name);
                      return (
                        <div key={col.name} className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                          isMapped ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                        )}>
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            col.role === "date" && "bg-primary/10 text-primary",
                            col.role === "value" && "bg-success/10 text-success",
                            col.role === "product" && "bg-accent/10 text-accent",
                            col.role === "category" && "bg-warning/10 text-warning",
                            !["date", "value", "product", "category"].includes(col.role) && "bg-muted text-muted-foreground"
                          )}>
                            {col.role}
                          </span>
                          <span className="font-medium text-card-foreground">{col.name}</span>
                          <span className="text-muted-foreground ml-auto truncate max-w-[150px]">{col.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Aperçu des données</h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        {wizard.columns.map((col) => {
                          const info = wizard.allColumnInfos.find((c) => c.name === col);
                          return (
                            <th key={col} className={cn(
                              "px-3 py-2 text-left font-medium whitespace-nowrap",
                              col === wizard.mapping.dateCol && "text-primary bg-primary/5",
                              col === wizard.mapping.valueCol && "text-success bg-success/5",
                              col === wizard.mapping.productCol && "text-accent bg-accent/5",
                              col === wizard.mapping.categoryCol && "text-warning bg-warning/5",
                              !([wizard.mapping.dateCol, wizard.mapping.valueCol, wizard.mapping.productCol, wizard.mapping.categoryCol].includes(col)) && "text-muted-foreground"
                            )}>
                              <div>{col}</div>
                              {info && <div className="text-[9px] font-normal opacity-70">{info.role}</div>}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {wizard.preview.map((row, i) => (
                        <tr key={i} className="border-t border-border/50">
                          {wizard.columns.map((col) => (
                            <td key={col} className="px-3 py-1.5 text-card-foreground whitespace-nowrap">
                              {row[col] instanceof Date ? (row[col] as Date).toLocaleDateString("fr-FR") : String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Granularity */}
          {step === "granularity" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-1">Niveau de prévision</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {wizard.businessContext
                    ? `Contexte IA : ${wizard.businessContext}`
                    : "Choisissez à quel niveau lancer les prévisions"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  { value: "global" as const, label: "Global (agrégé)", desc: "Prévision sur le total des ventes", icon: "🌐", always: true },
                  { value: "sku" as const, label: "Par SKU / Produit", desc: `${uniqueValues.products.length} produits détectés`, icon: "📦", always: false, needs: "productCol" as const },
                  { value: "family" as const, label: "Par Famille produit", desc: `${uniqueValues.categories.length} catégories détectées`, icon: "🏷️", always: false, needs: "categoryCol" as const },
                  { value: "subfamily" as const, label: "Par Sous-famille", desc: "Croisement produit + catégorie", icon: "🔀", always: false, needsBoth: true },
                ] as const).map((opt) => {
                  const disabled =
                    (!opt.always && "needs" in opt && opt.needs && !wizard.mapping[opt.needs]) ||
                    (!opt.always && "needsBoth" in opt && opt.needsBoth && (!wizard.mapping.productCol || !wizard.mapping.categoryCol));
                  const isAISuggested = wizard.aiMapping?.suggestedGranularity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={!!disabled}
                      onClick={() => setWizard((prev) => ({ ...prev, granularity: opt.value }))}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        wizard.granularity === opt.value
                          ? "border-primary bg-primary/5 shadow-elevated"
                          : disabled
                            ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-card cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{opt.icon}</span>
                        <span className="font-display text-sm font-semibold text-card-foreground">{opt.label}</span>
                        {isAISuggested && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">Suggestion IA</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {wizard.granularity === "sku" && uniqueValues.products.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-card-foreground mb-2">Produits/SKU détectés :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueValues.products.map((p) => (
                      <span key={p} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {wizard.granularity === "family" && uniqueValues.categories.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-card-foreground mb-2">Familles/Catégories :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueValues.categories.map((c) => (
                      <span key={c} className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs text-warning font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Launch */}
          {step === "launch" && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-3">
                  <Play className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-bold text-card-foreground">Prêt à lancer</h3>
                <p className="text-sm text-muted-foreground mt-1">Tous les onglets seront mis à jour automatiquement</p>
              </div>

              {/* Engine choice */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Moteur de prévision</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setLaunchMode("local")}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      launchMode === "local" ? "border-primary bg-primary/5 shadow-elevated" : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-display text-sm font-semibold text-card-foreground">Moteur JS (local)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Lissage expo, Holt, moyenne mobile, tendance linéaire</p>
                  </button>
                  <button
                    onClick={() => setLaunchMode("server")}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      launchMode === "server" ? "border-primary bg-primary/5 shadow-elevated" : "border-border bg-card hover:border-primary/40",
                      !serverConfigured && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="h-4 w-4 text-accent" />
                      <span className="font-display text-sm font-semibold text-card-foreground">Serveur Python</span>
                      {!serverConfigured && <span className="text-[9px] text-warning bg-warning/10 rounded-full px-1.5 py-0.5">Non configuré</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">ARIMA, Prophet, XGBoost, LSTM — via /superadmin</p>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fichier</span>
                  <span className="font-medium text-card-foreground">{wizard.file?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lignes × Colonnes</span>
                  <span className="font-medium text-card-foreground">{wizard.rows.length} × {wizard.columns.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">📅 Date</span>
                  <span className="font-medium text-primary">{wizard.mapping.dateCol || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">📊 Valeur</span>
                  <span className="font-medium text-success">{wizard.mapping.valueCol || "—"}</span>
                </div>
                {wizard.mapping.productCol && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">📦 Produit</span>
                    <span className="font-medium text-accent">{wizard.mapping.productCol}</span>
                  </div>
                )}
                {wizard.mapping.categoryCol && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">🏷️ Catégorie</span>
                    <span className="font-medium text-warning">{wizard.mapping.categoryCol}</span>
                  </div>
                )}
                {wizard.allColumnInfos.filter((c) => !["date", "value", "product", "category"].includes(c.role)).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Autres champs</span>
                    <span className="font-medium text-card-foreground">
                      {wizard.allColumnInfos.filter((c) => !["date", "value", "product", "category"].includes(c.role)).map((c) => c.name).join(", ")}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Granularité</span>
                  <span className="font-medium text-card-foreground">
                    {{ global: "Global", sku: "Par SKU", family: "Par Famille", subfamily: "Par Sous-famille" }[wizard.granularity]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moteur</span>
                  <span className="font-medium text-card-foreground">
                    {launchMode === "local" ? "JavaScript (local)" : "Python (serveur)"}
                  </span>
                </div>
                {wizard.businessContext && (
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">
                      <Brain className="h-3 w-3 inline mr-1" />
                      {wizard.businessContext}
                    </p>
                  </div>
                )}
              </div>

              {launching && (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm font-medium text-primary">
                    {launchMode === "server" ? "Envoi au serveur Python..." : "Calcul des prévisions..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={() => {
              if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
              else { onClose(); setWizard(initialWizard); setStep("upload"); }
            }}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {stepIdx === 0 ? "Annuler" : "Retour"}
          </button>

          {step === "launch" ? (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {launching ? "En cours..." : "Lancer les prévisions"}
            </button>
          ) : (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1])}
              disabled={(step === "mapping" && !canProceedMapping) || wizard.aiAnalyzing}
              className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {wizard.aiAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse IA...
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
