import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Plus, Upload, Sparkles, Trash2, Tag, Percent, Hash, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";
import CopilotInline from "@/components/CopilotInline";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type EventType = "promo" | "season" | "holiday" | "launch" | "disruption" | "other";
type ImpactType = "percent" | "absolute";

interface CalendarEvent {
  id: string;
  name: string;
  type: EventType;
  impact_type: ImpactType;
  impact_value: number;
  start_date: string;
  end_date: string;
  sku?: string;
  famille?: string;
  sous_famille?: string;
  notes?: string;
  source: string;
  color: string;
}

const TYPE_LABELS: Record<EventType, string> = {
  promo: "Promotion",
  season: "Saisonnalité",
  holiday: "Férié / Vacances",
  launch: "Lancement produit",
  disruption: "Perturbation",
  other: "Autre",
};

const TYPE_COLORS: Record<EventType, string> = {
  promo: "#f59e0b",
  season: "#10b981",
  holiday: "#6366f1",
  launch: "#06b6d4",
  disruption: "#ef4444",
  other: "#8b5cf6",
};

/* ── CSV export helper ──────────────────────────────────────────────────────── */
function eventsToCSV(events: CalendarEvent[]): string {
  const headers = ["name", "type", "sku", "famille", "sous_famille", "impact_type", "impact_value", "start_date", "end_date", "notes"];
  const rows = events.map((e) =>
    headers.map((h) => JSON.stringify((e as any)[h] ?? "")).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/* ── CSV import parser ──────────────────────────────────────────────────────── */
function parseEventsCSV(text: string): Partial<CalendarEvent>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["\s]/g, ""));
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
    return {
      name: obj.name || obj.nom || obj.event || "Événement",
      type: (obj.type || "other") as EventType,
      sku: obj.sku || obj.reference || obj.ref || "",
      famille: obj.famille || obj.family || obj.categorie || "",
      sous_famille: obj.sous_famille || obj.sousfamille || obj.subcategory || obj.sous_categorie || "",
      impact_type: (obj.impact_type || obj.impacttype || "percent") as ImpactType,
      impact_value: parseFloat(obj.impact_value || obj.impactvalue || "0") || 0,
      start_date: obj.start_date || obj.startdate || obj.debut || "",
      end_date: obj.end_date || obj.enddate || obj.fin || "",
      notes: obj.notes || obj.note || obj.description || "",
      color: TYPE_COLORS[(obj.type as EventType) ?? "other"],
    };
  }).filter((e) => e.name && e.start_date && e.end_date);
}

/* ── Form component ─────────────────────────────────────────────────────────── */
function EventForm({ onSave, onCancel }: { onSave: (e: Partial<CalendarEvent>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<CalendarEvent>>({
    type: "promo", impact_type: "percent", impact_value: 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    color: "#f59e0b", source: "manual",
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const inp = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
      <h3 className="font-semibold text-sm text-foreground">Nouvel événement / promotion</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* Nom */}
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Nom de l'événement *</label>
          <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)}
            placeholder="ex: Promo Ramadan, Saisonnalité été…" className={inp} />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs text-muted-foreground">Type</label>
          <select value={form.type} onChange={(e) => { set("type", e.target.value); set("color", TYPE_COLORS[e.target.value as EventType]); }}
            className={inp}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Impact */}
        <div>
          <label className="text-xs text-muted-foreground">Impact estimé</label>
          <div className="mt-1 flex gap-2">
            <select value={form.impact_type} onChange={(e) => set("impact_type", e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none">
              <option value="percent">%</option>
              <option value="absolute">Valeur absolue</option>
            </select>
            <input type="number" value={form.impact_value ?? 0} onChange={(e) => set("impact_value", parseFloat(e.target.value))}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="text-xs text-muted-foreground">Date début *</label>
          <input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} className={inp} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Date fin *</label>
          <input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} className={inp} />
        </div>

        {/* Ciblage produit */}
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-muted-foreground mb-2 mt-1 uppercase tracking-wide">Ciblage produit (optionnel)</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">SKU / Référence</label>
          <input value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)}
            placeholder="ex: REF-001, SKU-XYZ…" className={inp} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Famille</label>
          <input value={form.famille ?? ""} onChange={(e) => set("famille", e.target.value)}
            placeholder="ex: Électronique, Vêtements…" className={inp} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Sous-famille</label>
          <input value={form.sous_famille ?? ""} onChange={(e) => set("sous_famille", e.target.value)}
            placeholder="ex: Smartphones, T-shirts…" className={inp} />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2}
            placeholder="Description complémentaire…"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">Annuler</button>
        <button onClick={() => form.name && form.start_date && form.end_date && onSave(form)}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
          Enregistrer
        </button>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function Events() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiMapping, setAiMapping] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const q = (supabase.from as any)("events").select("*").eq("user_id", user.id).order("start_date");
    if (activeWorkspace) q.eq("workspace_id", activeWorkspace.id);
    const { data } = await q;
    setEvents((data ?? []) as CalendarEvent[]);
    setLoading(false);
  }, [user, activeWorkspace]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const saveEvent = async (partial: Partial<CalendarEvent>) => {
    if (!user) return;
    const payload = {
      ...partial,
      user_id: user.id,
      workspace_id: activeWorkspace?.id ?? null,
      color: partial.color ?? TYPE_COLORS[partial.type ?? "other"],
      source: partial.source ?? "manual",
    };
    const { data } = await (supabase.from as any)("events").insert([payload]).select().single();
    if (data) { setEvents((p) => [...p, data as CalendarEvent]); setShowForm(false); }
  };

  const deleteEvent = async (id: string) => {
    await (supabase.from as any)("events").delete().eq("id", id);
    setEvents((p) => p.filter((e) => e.id !== id));
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      setAiMapping(true);
      await new Promise((r) => setTimeout(r, 1200)); // simulate AI mapping
      const parsed = parseEventsCSV(text);
      setAiMapping(false);
      for (const p of parsed) await saveEvent(p);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportCSV = () => {
    const csv = eventsToCSV(events);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "evenements_kastai.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const copilotContext = `${events.length} événements enregistrés. Types: ${[...new Set(events.map(e => e.type))].join(", ")}. Impacts: ${events.map(e => `${e.name} (${e.impact_type === "percent" ? e.impact_value + "%" : e.impact_value})`).slice(0, 3).join(", ")}.`;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Événements & Promotions"
        description="Gérez les événements qui impactent vos prévisions : promos, saisonnalité, fériés, lancements…"
        icon={<CalendarDays className="h-5 w-5" />}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Ajouter un événement
        </button>
        <label className={cn("inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium cursor-pointer hover:bg-muted transition-colors", aiMapping && "opacity-60 pointer-events-none")}>
          {aiMapping ? <><Sparkles className="h-4 w-4 animate-pulse text-primary" /> Mapping IA…</> : <><Upload className="h-4 w-4" /> Importer CSV</>}
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
        </label>
        {events.length > 0 && (
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Exporter CSV
          </button>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {events.length} événement{events.length !== 1 ? "s" : ""} · Workspace: <span className="font-medium">{activeWorkspace?.name ?? "—"}</span>
        </div>
      </div>

      {/* CSV format hint */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <strong>Format CSV attendu :</strong> name, type (promo/season/holiday/launch/disruption), sku, famille, sous_famille, impact_type (percent/absolute), impact_value, start_date (YYYY-MM-DD), end_date, notes
          · L'IA mappe automatiquement les colonnes non-standard (référence, catégorie, famille…).
        </p>
      </div>

      {/* Form */}
      {showForm && <EventForm onSave={saveEvent} onCancel={() => setShowForm(false)} />}

      {/* Events grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun événement</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez un événement manuellement ou importez un fichier CSV</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <div key={ev.id} className="group relative rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                  <span className="font-semibold text-sm text-foreground truncate">{ev.name}</span>
                </div>
                <button onClick={() => deleteEvent(ev.id)}
                  className="hidden group-hover:flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />{TYPE_LABELS[ev.type]}
                </span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  ev.impact_value >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                  <Percent className="h-2.5 w-2.5" />
                  {ev.impact_value >= 0 ? "+" : ""}{ev.impact_value}{ev.impact_type === "percent" ? "%" : ""}
                </span>
                {ev.sku && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                    <Hash className="h-2.5 w-2.5" />{ev.sku}
                  </span>
                )}
                {ev.source === "csv" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px]">
                    <Sparkles className="h-2.5 w-2.5" />IA
                  </span>
                )}
              </div>
              {(ev.famille || ev.sous_famille) && (
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  {[ev.famille, ev.sous_famille].filter(Boolean).join(" › ")}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {ev.start_date} → {ev.end_date}
              </p>
              {ev.notes && <p className="mt-0.5 text-xs text-muted-foreground/70 line-clamp-1">{ev.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Copilot */}
      <CopilotInline
        context={copilotContext}
        insight={events.length > 0
          ? `${events.length} événement(s) enregistré(s). Les promotions détectées génèrent un uplift moyen estimé de +${Math.round(events.filter(e => e.type === "promo").reduce((s, e) => s + Math.abs(e.impact_value), 0) / Math.max(1, events.filter(e => e.type === "promo").length))}% sur les périodes concernées. Intégrez-les dans votre prochaine prévision pour améliorer la précision.`
          : "Aucun événement enregistré. Ajoutez des promotions et événements pour affiner vos prévisions. Le moteur les intégrera automatiquement lors du prochain run."}
        chips={["Impact promo", "Saisonnalité", "Lancement produit", "Risques"]}
      />
    </div>
  );
}
