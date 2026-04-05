import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { CloudUpload, FileUp, CircleCheck, ChevronRight, ChevronLeft, CirclePlay, X, TriangleAlert, Zap, Loader2, ServerCog, CalendarRange, CloudSun, Globe, Package, Tag, GitBranch, DollarSign, Hash, CalendarDays, BarChart3, Crosshair, Rocket, CheckSquare, Square, Columns3 } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { parseFile, autoMapColumns, ColumnMapping } from "@/lib/dataParser";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { AIMapping, ColumnInfo, ExtendedMapping, ProphetRegressor, DEFAULT_PROPHET_EXTERNAL_EVENTS, buildForecastPayload } from "@/lib/forecastPayload";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type Step = "upload" | "mapping" | "granularity" | "launch";

const STEP_LABELS: Record<Step, string> = {
  upload: "Import fichier",
  mapping: "Mapping IA",
  granularity: "Granularité & Cibles",
  launch: "Lancer les prévisions",
};

const STEPS: Step[] = ["upload", "mapping", "granularity", "launch"];

export type ForecastHorizon = "1D" | "1W" | "2W" | "1M" | "3M" | "6M" | "12M" | "24M";
export type ForecastGranularity = "global" | "sku" | "family" | "subfamily";
export type ForecastTarget = "revenue" | "quantity";

export const HORIZON_OPTIONS: { value: ForecastHorizon; label: string }[] = [
  { value: "1D", label: "Jour" },
  { value: "1W", label: "1 Semaine" },
  { value: "2W", label: "2 Semaines" },
  { value: "1M", label: "1 Mois" },
  { value: "3M", label: "3 Mois" },
  { value: "6M", label: "6 Mois" },
  { value: "12M", label: "12 Mois" },
  { value: "24M", label: "24 Mois" },
];

export function horizonToMonths(h: ForecastHorizon): number {
  switch (h) {
    case "1D": return 1;
    case "1W": return 1;
    case "2W": return 1;
    case "1M": return 1;
    case "3M": return 3;
    case "6M": return 6;
    case "12M": return 12;
    case "24M": return 24;
    default: return 6;
  }
}

function getMaxHorizonMonths(horizons: ForecastHorizon[]): number {
  if (horizons.length === 0) return 6;
  return Math.max(...horizons.map(horizonToMonths));
}

export const GRANULARITY_OPTIONS: { value: ForecastGranularity; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "global", label: "Global (agrégé)", icon: <Globe className="h-4 w-4" />, desc: "Prévision sur le total des ventes" },
  { value: "sku", label: "Par SKU / Produit", icon: <Package className="h-4 w-4" />, desc: "Prévision par référence produit" },
  { value: "family", label: "Par Famille produit", icon: <Tag className="h-4 w-4" />, desc: "Prévision par famille / catégorie" },
  { value: "subfamily", label: "Par Sous-famille", icon: <GitBranch className="h-4 w-4" />, desc: "Croisement produit + catégorie" },
];

export const TARGET_OPTIONS: { value: ForecastTarget; label: string; icon: React.ReactNode; tab: string }[] = [
  { value: "revenue", label: "Chiffre d'affaires (CA)", icon: <DollarSign className="h-4 w-4" />, tab: "Finance" },
  { value: "quantity", label: "Quantité", icon: <Hash className="h-4 w-4" />, tab: "Forecast" },
];

interface WizardState {
  file: File | null;
  rows: Record<string, any>[];
  columns: string[];
  mapping: ExtendedMapping;
  granularity: ForecastGranularity;
  selectedHorizons: ForecastHorizon[];
  selectedGranularities: ForecastGranularity[];
  selectedTargets: ForecastTarget[];
  preview: Record<string, any>[];
  aiMapping: AIMapping | null;
  aiAnalyzing: boolean;
  allColumnInfos: ColumnInfo[];
  businessContext: string;
  prophetRegressors: ProphetRegressor[];
}

const initialWizard: WizardState = {
  file: null,
  rows: [],
  columns: [],
  mapping: { dateCol: null, valueCol: null, productCol: null, categoryCol: null, revenueCol: null, quantityCol: null, familyCol: null, subfamilyCol: null },
  granularity: "global",
  selectedHorizons: ["6M"],
  selectedGranularities: ["global"],
  selectedTargets: ["revenue", "quantity"],
  preview: [],
  aiMapping: null,
  aiAnalyzing: false,
  allColumnInfos: [],
  businessContext: "",
  prophetRegressors: [...DEFAULT_PROPHET_EXTERNAL_EVENTS],
};

export default function ImportWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { processData } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [wizard, setWizard] = useState<WizardState>(initialWizard);
  const [parsing, setParsing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [launchMode, setLaunchMode] = useState<"local" | "server">("local");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  // Scroll content to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Helper: generate a hash from columns to identify same file structure
  const getColumnsHash = (cols: string[]) => cols.slice().sort().join("|");

  // Apply AI result to wizard state
  const applyAIResult = useCallback((aiResult: AIMapping) => {
    const contextRoles = ["price", "promo", "discount", "region", "store", "channel", "cost", "margin"];
    const columnRegressors: ProphetRegressor[] = (aiResult.allColumns || [])
      .filter((c) => contextRoles.includes(c.role) || c.role === "other")
      .map((c) => ({ key: c.name, label: `${c.name} (${c.role})`, enabled: true, type: "column" as const }));

    setWizard((prev) => ({
      ...prev,
      aiAnalyzing: false,
      aiMapping: aiResult,
      mapping: {
        dateCol: aiResult.dateCol,
        valueCol: aiResult.valueCol,
        revenueCol: aiResult.revenueCol || aiResult.valueCol,
        quantityCol: aiResult.quantityCol || null,
        productCol: aiResult.productCol,
        categoryCol: aiResult.categoryCol,
        familyCol: aiResult.familyCol || null,
        subfamilyCol: aiResult.subfamilyCol || null,
      },
      granularity: aiResult.suggestedGranularity || (aiResult.productCol ? "sku" : "global"),
      allColumnInfos: aiResult.allColumns || [],
      businessContext: aiResult.businessContext || "",
      prophetRegressors: [...columnRegressors, ...DEFAULT_PROPHET_EXTERNAL_EVENTS],
    }));
  }, []);

  // AI-powered smart mapping with cache
  const runAIMapping = useCallback(async (columns: string[], rows: Record<string, any>[], fileName: string) => {
    setWizard((prev) => ({ ...prev, aiAnalyzing: true }));
    const hash = getColumnsHash(columns);

    try {
      // Check cache: look for a previous AI mapping with same columns_hash
      const { data: cached } = await supabase
        .from("uploaded_files")
        .select("ai_mapping")
        .eq("columns_hash", hash)
        .not("ai_mapping", "is", null)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.ai_mapping) {
        console.log("AI mapping loaded from cache (tokens saved)");
        applyAIResult(cached.ai_mapping as unknown as AIMapping);
        return;
      }

      // No cache: call AI
      const { data, error } = await supabase.functions.invoke("smart-mapping", {
        body: { columns, sampleRows: rows.slice(0, 2), fileName },
      });

      if (error) throw error;

      const aiResult = data as AIMapping;
      applyAIResult(aiResult);

      // Save to cache in background
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("uploaded_files").insert({
            user_id: user.id,
            file_name: fileName,
            row_count: rows.length,
            column_count: columns.length,
            columns: columns as any,
            columns_hash: hash,
            ai_mapping: aiResult as any,
            mapping: {
              dateCol: aiResult.dateCol,
              valueCol: aiResult.valueCol,
              revenueCol: aiResult.revenueCol,
              quantityCol: aiResult.quantityCol,
              productCol: aiResult.productCol,
              categoryCol: aiResult.categoryCol,
              familyCol: aiResult.familyCol,
              subfamilyCol: aiResult.subfamilyCol,
            } as any,
            granularity: aiResult.suggestedGranularity || "global",
          });
        }
      } catch (saveErr) {
        console.warn("Failed to cache AI mapping:", saveErr);
      }
    } catch (err) {
      console.warn("AI mapping failed, using regex fallback:", err);
      const fallback = autoMapColumns(columns, rows);
      setWizard((prev) => ({
        ...prev,
        aiAnalyzing: false,
        mapping: { ...prev.mapping, ...fallback },
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

      runAIMapping(columns, rows, file.name);
    } catch (err) {
      setError("Erreur lors du parsing du fichier.");
      setParsing(false);
    }
  }, [runAIMapping]);

  const updateMapping = (field: keyof ExtendedMapping, value: string | null) => {
    setWizard((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: value === "" ? null : value },
    }));
  };

  const canProceedMapping = wizard.mapping.dateCol && (wizard.mapping.valueCol || wizard.mapping.revenueCol || wizard.mapping.quantityCol);

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setLaunchProgress(10);
    setError(null);

    try {
      setLaunchProgress(25);
      if (launchMode === "server") {
        const serverUrl = localStorage.getItem("kastai_server_url") || "http://localhost:8000";
        const serverKey = localStorage.getItem("kastai_server_key") || "";
        const payload = buildForecastPayload(
          wizard.rows, wizard.columns, wizard.mapping, wizard.aiMapping, wizard.file!.name, wizard.granularity,
          wizard.selectedTargets, wizard.prophetRegressors
        );

        setLaunchProgress(40);
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

        setLaunchProgress(70);
        const serverResult = await res.json();
        await processData(wizard.rows, wizard.columns, wizard.mapping, wizard.file!.name, wizard.granularity, maxHorizon, serverResult);
      } else {
        setLaunchProgress(50);
        await processData(wizard.rows, wizard.columns, wizard.mapping, wizard.file!.name, wizard.granularity, maxHorizon);
      }

      setLaunchProgress(100);
      
      // Save forecast run to history (file may already be saved from AI cache step)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const hash = getColumnsHash(wizard.columns);
          // Find or create the file record
          const { data: existingFile } = await supabase
            .from("uploaded_files")
            .select("id")
            .eq("user_id", user.id)
            .eq("columns_hash", hash)
            .eq("file_name", wizard.file!.name)
            .order("uploaded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let fileId = existingFile?.id;
          if (!fileId) {
            const { data: newFile } = await supabase.from("uploaded_files").insert({
              user_id: user.id,
              file_name: wizard.file!.name,
              row_count: wizard.rows.length,
              column_count: wizard.columns.length,
              columns: wizard.columns as any,
              columns_hash: hash,
              mapping: wizard.mapping as any,
              ai_mapping: wizard.aiMapping as any,
              granularity: wizard.granularity,
            }).select("id").single();
            fileId = newFile?.id;
          }

          await supabase.from("forecast_runs").insert({
            user_id: user.id,
            file_id: fileId || null,
            file_name: wizard.file!.name,
            granularity: wizard.granularity,
            horizon: 6,
            total_points: wizard.rows.length,
            best_model: "SES",
            models_results: {} as any,
          });
        }
      } catch (histErr) {
        console.warn("History save failed:", histErr);
      }

      // Small delay for visual satisfaction
      await new Promise((r) => setTimeout(r, 400));

      setLaunching(false);
      setLaunchProgress(0);
      onClose();
      setWizard(initialWizard);
      setStep("upload");

      toast({
        title: "Prévisions calculées",
        description: `${wizard.file?.name} — modèles exécutés avec succès`,
      });

      navigate("/forecast");
    } catch (err: any) {
      setError(err.message || "Erreur lors du calcul des prévisions.");
      setLaunching(false);
      setLaunchProgress(0);
      toast({
        title: "Erreur de prévision",
        description: err.message || "Vérifiez vos données et réessayez.",
        variant: "destructive",
      });
    }
  }, [wizard, processData, onClose, launchMode, navigate, toast]);

  const uniqueValues = useMemo(() => {
    if (!wizard.rows.length) return { products: [], categories: [], families: [], subfamilies: [] };
    const prodCol = wizard.mapping.productCol;
    const catCol = wizard.mapping.categoryCol;
    const famCol = wizard.mapping.familyCol;
    const subCol = wizard.mapping.subfamilyCol;
    const products = prodCol ? [...new Set(wizard.rows.map((r) => String(r[prodCol] ?? "")).filter(Boolean))] : [];
    const categories = catCol ? [...new Set(wizard.rows.map((r) => String(r[catCol] ?? "")).filter(Boolean))] : [];
    const families = famCol ? [...new Set(wizard.rows.map((r) => String(r[famCol] ?? "")).filter(Boolean))] : [];
    const subfamilies = subCol ? [...new Set(wizard.rows.map((r) => String(r[subCol] ?? "")).filter(Boolean))] : [];
    return { products: products.slice(0, 20), categories: categories.slice(0, 20), families: families.slice(0, 20), subfamilies: subfamilies.slice(0, 20) };
  }, [wizard.rows, wizard.mapping]);

  const serverConfigured = !!localStorage.getItem("kastai_server_url");

  const toggleRegressor = (key: string) => {
    setWizard((prev) => ({
      ...prev,
      prophetRegressors: prev.prophetRegressors.map((r) =>
        r.key === key ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  };

  if (!open) return null;

  const mappingFields: { key: keyof ExtendedMapping; label: string; required: boolean }[] = [
    { key: "dateCol", label: "Colonne Date", required: true },
    { key: "revenueCol", label: "CA / Chiffre d'affaires", required: false },
    { key: "quantityCol", label: "Quantité / Volume", required: false },
    { key: "valueCol", label: "Valeur principale (fallback)", required: false },
    { key: "productCol", label: "Produit / SKU", required: false },
    { key: "categoryCol", label: "Catégorie", required: false },
    { key: "familyCol", label: "Famille", required: false },
    { key: "subfamilyCol", label: "Sous-famille", required: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-elevated mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="KastAI" className="h-5 w-5 rounded-sm object-cover" />
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
                {i < stepIdx ? <CircleCheck className="h-4 w-4" /> : i + 1}
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
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: CloudUpload */}
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
                  <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-display text-base font-semibold text-foreground">Glissez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground mt-2">CSV, TSV, Excel (.xlsx, .xls)</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" /> L'IA analysera automatiquement vos colonnes
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
            <div className="relative space-y-5 min-h-[300px]">
              {/* AI analysis overlay */}
              {wizard.aiAnalyzing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-2xl animate-fade-in">
                  <div className="flex flex-col items-center gap-5 max-w-sm text-center p-8 rounded-2xl border border-primary/20 bg-card shadow-elevated">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-[3px] border-primary/20 flex items-center justify-center">
                        <img src={logoIcon} alt="KastAI" className="h-8 w-8 rounded-full object-cover animate-pulse" />
                      </div>
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-[3px] border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-base font-bold text-card-foreground">IA en cours d'analyse</h3>
                      <p className="text-sm text-muted-foreground">Lecture des <span className="font-semibold text-primary">2 premières lignes</span> pour comprendre le contexte de vos données</p>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Columns3 className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>Détection des colonnes et rôles sémantiques...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Crosshair className="h-3.5 w-3.5 text-primary animate-pulse [animation-delay:300ms]" />
                        <span>Identification de la granularité optimale...</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BarChart3 className="h-3.5 w-3.5 text-primary animate-pulse [animation-delay:600ms]" />
                        <span>Préparation du contexte métier...</span>
                      </div>
                    </div>
                    <Progress value={45} className="w-full h-1.5" />
                    <p className="text-[10px] text-muted-foreground">Vous pourrez ajuster le mapping manuellement ensuite</p>
                  </div>
                </div>
              )}

              {/* AI result banner */}
              {wizard.aiMapping && !wizard.aiAnalyzing && (
                <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                  <div className="flex items-start gap-3">
                    <img src={logoIcon} alt="KastAI" className="h-5 w-5 rounded-sm object-cover mt-0.5" />
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
                <FileUp className="h-5 w-5 text-primary" />
                <span className="font-display text-sm font-semibold text-card-foreground">{wizard.file?.name}</span>
                <span className="text-xs text-muted-foreground">— {wizard.rows.length} lignes · {wizard.columns.length} colonnes</span>
              </div>

              {/* Main mapping fields - extended */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Mapping principal (modifiable)</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {mappingFields.map((field) => {
                    const aiInfo = wizard.allColumnInfos.find((c) => c.name === wizard.mapping[field.key]);
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label className="flex items-center gap-1 text-xs font-medium text-card-foreground">
                          {field.label}
                          {field.required && <span className="text-destructive">*</span>}
                        </label>
                        <select
                          value={wizard.mapping[field.key] || ""}
                          onChange={(e) => updateMapping(field.key, e.target.value)}
                          className={cn(
                            "w-full rounded-lg border bg-background px-2.5 py-2 text-xs transition-colors",
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
                        {aiInfo && <p className="text-[10px] text-success truncate">{aiInfo.description}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All columns info */}
              {wizard.allColumnInfos.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Toutes les colonnes détectées ({wizard.allColumnInfos.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {wizard.allColumnInfos.map((col) => {
                      const primaryCols = Object.values(wizard.mapping).filter(Boolean);
                      const isMapped = primaryCols.includes(col.name);
                      return (
                        <div key={col.name} className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                          isMapped ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                        )}>
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0",
                            col.role === "date" && "bg-primary/10 text-primary",
                            (col.role === "value" || col.role === "revenue") && "bg-success/10 text-success",
                            col.role === "quantity" && "bg-accent/10 text-accent",
                            col.role === "product" && "bg-accent/10 text-accent",
                            (col.role === "category" || col.role === "family" || col.role === "subfamily") && "bg-warning/10 text-warning",
                            (col.role === "promo" || col.role === "discount") && "bg-destructive/10 text-destructive",
                            !["date", "value", "revenue", "quantity", "product", "category", "family", "subfamily", "promo", "discount"].includes(col.role) && "bg-muted text-muted-foreground"
                          )}>
                            {col.role}
                          </span>
                          <span className="font-medium text-card-foreground truncate">{col.name}</span>
                          <span className="text-muted-foreground ml-auto truncate max-w-[100px]">{col.description}</span>
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
                          const mapped = Object.entries(wizard.mapping).find(([, v]) => v === col);
                          return (
                            <th key={col} className={cn(
                              "px-3 py-2 text-left font-medium whitespace-nowrap",
                              mapped && mapped[0] === "dateCol" && "text-primary bg-primary/5",
                              mapped && (mapped[0] === "valueCol" || mapped[0] === "revenueCol") && "text-success bg-success/5",
                              mapped && mapped[0] === "quantityCol" && "text-accent bg-accent/5",
                              mapped && mapped[0] === "productCol" && "text-accent bg-accent/5",
                              mapped && (mapped[0] === "categoryCol" || mapped[0] === "familyCol" || mapped[0] === "subfamilyCol") && "text-warning bg-warning/5",
                              !mapped && "text-muted-foreground"
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

          {/* Step 3: Granularity, Targets, Prophet regressors */}
          {step === "granularity" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-1">Configuration des prévisions</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {wizard.businessContext
                    ? `Contexte IA : ${wizard.businessContext}`
                    : "Choisissez les cibles, niveaux et horizons de prévision"}
                </p>
              </div>

              {/* Forecast targets */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5"><Crosshair className="h-3.5 w-3.5" /> Valeurs à prévoir (multi-sélection)</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TARGET_OPTIONS.map((t) => {
                    const isSelected = wizard.selectedTargets.includes(t.value);
                    const colMapped = t.value === "revenue" ? wizard.mapping.revenueCol : wizard.mapping.quantityCol;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setWizard((prev) => ({
                          ...prev,
                          selectedTargets: isSelected
                            ? prev.selectedTargets.filter((x) => x !== t.value)
                            : [...prev.selectedTargets, t.value],
                        }))}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-elevated"
                            : "border-border bg-card hover:border-primary/40 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{t.icon}</span>
                          <span className="font-display text-sm font-semibold text-card-foreground">{t.label}</span>
                          {isSelected && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">✓</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Onglet {t.tab} · Colonne : {colMapped || "non mappée"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horizons multiselect - PROMINENT */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">⏱️ Horizons de prévision (multi-sélection)</h4>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {HORIZON_OPTIONS.map((h) => {
                    const isSelected = wizard.selectedHorizons.includes(h.value);
                    return (
                      <button
                        key={h.value}
                        onClick={() => setWizard((prev) => ({
                          ...prev,
                          selectedHorizons: isSelected
                            ? prev.selectedHorizons.filter((x) => x !== h.value)
                            : [...prev.selectedHorizons, h.value],
                        }))}
                        className={cn(
                          "rounded-lg border px-2 py-2.5 text-xs font-medium transition-all text-center",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <div className="text-sm mb-0.5">{isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}</div>
                        {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granularity multiselect */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Niveaux de prévision (multi-sélection)</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {GRANULARITY_OPTIONS.map((opt) => {
                    const disabled =
                      (opt.value === "sku" && !wizard.mapping.productCol) ||
                      (opt.value === "family" && !wizard.mapping.familyCol && !wizard.mapping.categoryCol) ||
                      (opt.value === "subfamily" && !wizard.mapping.subfamilyCol);
                    const isSelected = wizard.selectedGranularities.includes(opt.value);
                    const isAISuggested = wizard.aiMapping?.suggestedGranularity === opt.value;
                    const detectedCount = opt.value === "sku" ? uniqueValues.products.length :
                      opt.value === "family" ? (uniqueValues.families.length || uniqueValues.categories.length) :
                      opt.value === "subfamily" ? uniqueValues.subfamilies.length : 0;
                    return (
                      <button
                        key={opt.value}
                        disabled={!!disabled}
                        onClick={() => setWizard((prev) => ({
                          ...prev,
                          selectedGranularities: isSelected
                            ? prev.selectedGranularities.filter((x) => x !== opt.value)
                            : [...prev.selectedGranularities, opt.value],
                          granularity: !isSelected ? opt.value : prev.granularity,
                        }))}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-elevated"
                            : disabled
                              ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                              : "border-border bg-card hover:border-primary/40 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          <span>{opt.icon}</span>
                          <span className="font-display text-xs font-semibold text-card-foreground">{opt.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-1">{opt.desc}</p>
                        <div className="flex gap-1 flex-wrap">
                          {isAISuggested && <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">Suggestion IA</span>}
                          {detectedCount > 0 && <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">{detectedCount} détectés</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prophet regressors & events */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide flex items-center gap-1.5">
                  <CloudSun className="h-3.5 w-3.5" />
                  Régresseurs Prophet & Événements
                </h4>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Colonnes contextuelles et événements externes utilisés par le modèle Prophet pour affiner les prévisions
                </p>

                {/* Column regressors */}
                {wizard.prophetRegressors.filter((r) => r.type === "column").length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-medium text-card-foreground mb-2 flex items-center gap-1"><Columns3 className="h-3 w-3" /> Colonnes contextuelles (promo, prix, etc.)</p>
                    <div className="flex flex-wrap gap-2">
                      {wizard.prophetRegressors.filter((r) => r.type === "column").map((r) => (
                        <button
                          key={r.key}
                          onClick={() => toggleRegressor(r.key)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                            r.enabled
                              ? "border-success/50 bg-success/10 text-success"
                              : "border-border bg-muted/30 text-muted-foreground"
                          )}
                        >
                          {r.enabled ? "✓ " : ""}{r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* External events */}
                <div>
                  <p className="text-[10px] font-medium text-card-foreground mb-2 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Événements & données externes</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {wizard.prophetRegressors.filter((r) => r.type === "external").map((r) => (
                      <button
                        key={r.key}
                        onClick={() => toggleRegressor(r.key)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-all text-left",
                          r.enabled
                            ? "border-primary/50 bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detected values */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {uniqueValues.products.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-card-foreground mb-2 flex items-center gap-1"><Package className="h-3.5 w-3.5" /> SKU détectés :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueValues.products.map((p) => (
                        <span key={p} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] text-accent font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {uniqueValues.families.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-card-foreground mb-2 flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Familles :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueValues.families.map((f) => (
                        <span key={f} className="rounded-full bg-warning/10 px-2.5 py-0.5 text-[10px] text-warning font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {uniqueValues.subfamilies.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-card-foreground mb-2 flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> Sous-familles :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueValues.subfamilies.map((s) => (
                        <span key={s} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] text-primary font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {uniqueValues.categories.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs font-medium text-card-foreground mb-2 flex items-center gap-1"><Columns3 className="h-3.5 w-3.5" /> Catégories :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uniqueValues.categories.map((c) => (
                        <span key={c} className="rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] text-success font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Launch */}
          {step === "launch" && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary mb-3">
                  <CirclePlay className="h-8 w-8 text-primary-foreground" />
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
                      <Zap className="h-4 w-4 text-primary" />
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
                      <ServerCog className="h-4 w-4 text-accent" />
                      <span className="font-display text-sm font-semibold text-card-foreground">Serveur Python</span>
                      {!serverConfigured && <span className="text-[9px] text-warning bg-warning/10 rounded-full px-1.5 py-0.5">Non configuré</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">ARIMA, Prophet + régresseurs, XGBoost, LSTM</p>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fichier</span>
                  <span className="font-medium text-card-foreground">{wizard.file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lignes × Colonnes</span>
                  <span className="font-medium text-card-foreground">{wizard.rows.length} × {wizard.columns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Crosshair className="h-3 w-3" /> Cibles</span>
                  <span className="font-medium text-primary">
                    {wizard.selectedTargets.map((t) => t === "revenue" ? "CA (Finance)" : "Quantité (Forecast)").join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Date</span>
                  <span className="font-medium text-primary">{wizard.mapping.dateCol || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> CA</span>
                  <span className="font-medium text-success">{wizard.mapping.revenueCol || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> Quantité</span>
                  <span className="font-medium text-accent">{wizard.mapping.quantityCol || "—"}</span>
                </div>
                {wizard.mapping.productCol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Produit</span>
                    <span className="font-medium text-accent">{wizard.mapping.productCol}</span>
                  </div>
                )}
                {wizard.mapping.familyCol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Famille</span>
                    <span className="font-medium text-warning">{wizard.mapping.familyCol}</span>
                  </div>
                )}
                {wizard.mapping.subfamilyCol && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><GitBranch className="h-3 w-3" /> Sous-famille</span>
                    <span className="font-medium text-warning">{wizard.mapping.subfamilyCol}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-muted-foreground">Granularités</span>
                  <span className="font-medium text-card-foreground">
                    {wizard.selectedGranularities.map((g) => ({ global: "Global", sku: "SKU", family: "Famille", subfamily: "Sous-famille" }[g])).join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horizons</span>
                  <span className="font-medium text-card-foreground">{wizard.selectedHorizons.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prophet régresseurs</span>
                  <span className="font-medium text-card-foreground text-right max-w-[250px] truncate">
                    {wizard.prophetRegressors.filter((r) => r.enabled).length} actifs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moteur</span>
                  <span className="font-medium text-card-foreground">
                    {launchMode === "local" ? "JavaScript (local)" : "Python (serveur)"}
                  </span>
                </div>
                {wizard.businessContext && (
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">
                      <img src={logoIcon} alt="KastAI" className="h-3 w-3 inline mr-1 rounded-sm" />
                      {wizard.businessContext}
                    </p>
                  </div>
                )}
              </div>

              {launching && (
                <div className="space-y-3">
                  <Progress value={launchProgress} className="h-2" />
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm font-medium text-primary">
                      {launchProgress < 30 ? "Préparation des données..." :
                       launchProgress < 60 ? "Calcul des modèles..." :
                       launchProgress < 90 ? "Backtesting & métriques..." :
                       "Finalisation ✨"}
                    </span>
                  </div>
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
              className={cn(
                "flex items-center gap-2 rounded-lg gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50",
                !launching && "hover:opacity-90 hover:scale-105 hover:shadow-lg active:scale-95",
                launching && "animate-pulse"
              )}
            >
              {launching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CirclePlay className="h-4 w-4" />
              )}
              {launching ? "Calcul en cours..." : "Lancer les prévisions"}
            </button>
          ) : (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1])}
              disabled={(step === "mapping" && !canProceedMapping) || wizard.aiAnalyzing}
              className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
