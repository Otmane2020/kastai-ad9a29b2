import { useState, useRef, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, ChevronRight, ChevronLeft, Play, X, AlertCircle, Settings2 } from "lucide-react";
import { parseFile, autoMapColumns, ColumnMapping } from "@/lib/dataParser";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "granularity" | "launch";

const STEP_LABELS: Record<Step, string> = {
  upload: "Import fichier",
  mapping: "Mapping colonnes",
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
}

const initialWizard: WizardState = {
  file: null,
  rows: [],
  columns: [],
  mapping: { dateCol: null, valueCol: null, productCol: null, categoryCol: null },
  granularity: "global",
  preview: [],
};

export default function ImportWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { processData } = useData();
  const [step, setStep] = useState<Step>("upload");
  const [wizard, setWizard] = useState<WizardState>(initialWizard);
  const [parsing, setParsing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const stepIdx = STEPS.indexOf(step);

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
      const mapping = autoMapColumns(columns, rows);
      setWizard({
        file,
        rows,
        columns,
        mapping,
        granularity: mapping.productCol ? "sku" : "global",
        preview: rows.slice(0, 5),
      });
      setParsing(false);
      setStep("mapping");
    } catch (err) {
      setError("Erreur lors du parsing du fichier.");
      setParsing(false);
    }
  }, []);

  const updateMapping = (field: keyof ColumnMapping, value: string | null) => {
    setWizard((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [field]: value === "" ? null : value },
    }));
  };

  const canProceedMapping = wizard.mapping.dateCol && wizard.mapping.valueCol;

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    try {
      await processData(wizard.rows, wizard.columns, wizard.mapping, wizard.file!.name, wizard.granularity);
      setLaunching(false);
      onClose();
      // Reset wizard
      setWizard(initialWizard);
      setStep("upload");
    } catch (err) {
      setError("Erreur lors du calcul des prévisions.");
      setLaunching(false);
    }
  }, [wizard, processData, onClose]);

  const uniqueValues = useMemo(() => {
    if (!wizard.rows.length) return { products: [], categories: [] };
    const prodCol = wizard.mapping.productCol;
    const catCol = wizard.mapping.categoryCol;
    const products = prodCol ? [...new Set(wizard.rows.map((r) => String(r[prodCol] ?? "")).filter(Boolean))] : [];
    const categories = catCol ? [...new Set(wizard.rows.map((r) => String(r[catCol] ?? "")).filter(Boolean))] : [];
    return { products: products.slice(0, 20), categories: categories.slice(0, 20) };
  }, [wizard.rows, wizard.mapping]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-elevated mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-card-foreground">Assistant d'import</h2>
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
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-display text-sm font-semibold text-card-foreground">{wizard.file?.name}</span>
                <span className="text-xs text-muted-foreground">— {wizard.rows.length} lignes · {wizard.columns.length} colonnes</span>
              </div>

              {/* Mapping fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {([
                  { key: "dateCol" as const, label: "Colonne Date", required: true, desc: "Date, période, timestamp" },
                  { key: "valueCol" as const, label: "Colonne Valeur", required: true, desc: "Ventes, quantité, CA" },
                  { key: "productCol" as const, label: "Colonne Produit/SKU", required: false, desc: "Produit, SKU, article" },
                  { key: "categoryCol" as const, label: "Colonne Catégorie/Famille", required: false, desc: "Famille, catégorie, groupe" },
                ]).map((field) => (
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
                      {wizard.columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">{field.desc}</p>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Aperçu des données (5 premières lignes)</h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        {wizard.columns.slice(0, 8).map((col) => (
                          <th key={col} className={cn(
                            "px-3 py-2 text-left font-medium whitespace-nowrap",
                            col === wizard.mapping.dateCol && "text-primary bg-primary/5",
                            col === wizard.mapping.valueCol && "text-success bg-success/5",
                            col === wizard.mapping.productCol && "text-accent bg-accent/5",
                            col === wizard.mapping.categoryCol && "text-warning bg-warning/5",
                            !([wizard.mapping.dateCol, wizard.mapping.valueCol, wizard.mapping.productCol, wizard.mapping.categoryCol].includes(col)) && "text-muted-foreground"
                          )}>
                            {col}
                            {col === wizard.mapping.dateCol && " 📅"}
                            {col === wizard.mapping.valueCol && " 📊"}
                            {col === wizard.mapping.productCol && " 📦"}
                            {col === wizard.mapping.categoryCol && " 🏷️"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wizard.preview.map((row, i) => (
                        <tr key={i} className="border-t border-border/50">
                          {wizard.columns.slice(0, 8).map((col) => (
                            <td key={col} className="px-3 py-1.5 text-card-foreground whitespace-nowrap">
                              {row[col] instanceof Date ? (row[col] as Date).toLocaleDateString("fr-FR") : String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {wizard.columns.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-1">+ {wizard.columns.length - 8} colonnes supplémentaires</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Granularity */}
          {step === "granularity" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-sm font-semibold text-card-foreground mb-1">Niveau de prévision</h3>
                <p className="text-xs text-muted-foreground mb-4">Choisissez à quel niveau lancer les prévisions</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  { value: "global" as const, label: "Global (agrégé)", desc: "Prévision sur le total des ventes", icon: "🌐", always: true },
                  { value: "sku" as const, label: "Par SKU / Produit", desc: `${uniqueValues.products.length} produits détectés`, icon: "📦", always: false, needs: "productCol" as const },
                  { value: "family" as const, label: "Par Famille produit", desc: `${uniqueValues.categories.length} catégories détectées`, icon: "🏷️", always: false, needs: "categoryCol" as const },
                  { value: "subfamily" as const, label: "Par Sous-famille (Produit×Catégorie)", desc: "Croisement produit + catégorie", icon: "🔀", always: false, needsBoth: true },
                ] as const).map((opt) => {
                  const disabled = 
                    (!opt.always && "needs" in opt && opt.needs && !wizard.mapping[opt.needs]) ||
                    (!opt.always && "needsBoth" in opt && opt.needsBoth && (!wizard.mapping.productCol || !wizard.mapping.categoryCol));
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
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Show detected groups */}
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
                  <p className="text-xs font-medium text-card-foreground mb-2">Familles/Catégories détectées :</p>
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
            <div className="space-y-5 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                <Play className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-card-foreground">Prêt à lancer</h3>
                <p className="text-sm text-muted-foreground mt-1">Les prévisions seront calculées et tous les onglets mis à jour automatiquement</p>
              </div>

              {/* Summary */}
              <div className="mx-auto max-w-sm rounded-xl border border-border bg-muted/20 p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fichier</span>
                  <span className="font-medium text-card-foreground">{wizard.file?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lignes</span>
                  <span className="font-medium text-card-foreground">{wizard.rows.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-primary">{wizard.mapping.dateCol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valeur</span>
                  <span className="font-medium text-success">{wizard.mapping.valueCol}</span>
                </div>
                {wizard.mapping.productCol && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Produit/SKU</span>
                    <span className="font-medium text-accent">{wizard.mapping.productCol}</span>
                  </div>
                )}
                {wizard.mapping.categoryCol && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span className="font-medium text-warning">{wizard.mapping.categoryCol}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Granularité</span>
                  <span className="font-medium text-card-foreground">
                    {{ global: "Global", sku: "Par SKU", family: "Par Famille", subfamily: "Par Sous-famille" }[wizard.granularity]}
                  </span>
                </div>
              </div>

              {launching && (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-medium text-primary">Calcul des prévisions en cours...</span>
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
              {launching ? "Calcul en cours..." : "Lancer les prévisions"}
            </button>
          ) : (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1])}
              disabled={step === "mapping" && !canProceedMapping}
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
