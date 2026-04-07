import { useState, useEffect, useCallback } from "react";
import { Factory, Plus, Trash2, Package, GitBranch, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Product { id: string; sku: string; name: string; family: string; }
interface Line { id: string; name: string; site: string; capacity_per_day: number; }
interface Mapping { id: string; product_id: string; line_id: string; unit_time: number; yield_pct: number; }

const db = supabase.from as any;

export default function SOPStructure() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [tab, setTab] = useState<"products" | "lines" | "mapping">("mapping");
  const [loading, setLoading] = useState(true);

  // New item forms
  const [newProduct, setNewProduct] = useState({ sku: "", name: "", family: "" });
  const [newLine, setNewLine] = useState({ name: "", site: "", capacity_per_day: 480 });
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewLine, setShowNewLine] = useState(false);
  const [newMapping, setNewMapping] = useState({ product_id: "", line_id: "", unit_time: 5, yield_pct: 95 });
  const [showNewMapping, setShowNewMapping] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, lRes, mRes] = await Promise.all([
      db("sop_products").select("*").eq("user_id", user.id).order("created_at"),
      db("sop_lines").select("*").eq("user_id", user.id).order("created_at"),
      db("sop_mappings").select("*").eq("user_id", user.id).order("created_at"),
    ]);
    setProducts((pRes.data ?? []) as Product[]);
    setLines((lRes.data ?? []) as Line[]);
    setMappings((mRes.data ?? []) as Mapping[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addProduct = async () => {
    if (!user || !newProduct.sku || !newProduct.name) return;
    const { data } = await db("sop_products").insert([{ ...newProduct, user_id: user.id }]).select().single();
    if (data) { setProducts(p => [...p, data as Product]); setNewProduct({ sku: "", name: "", family: "" }); setShowNewProduct(false); }
  };

  const deleteProduct = async (id: string) => {
    await db("sop_products").delete().eq("id", id);
    setProducts(p => p.filter(x => x.id !== id));
    setMappings(m => m.filter(x => x.product_id !== id));
  };

  const addLine = async () => {
    if (!user || !newLine.name) return;
    const { data } = await db("sop_lines").insert([{ ...newLine, user_id: user.id }]).select().single();
    if (data) { setLines(l => [...l, data as Line]); setNewLine({ name: "", site: "", capacity_per_day: 480 }); setShowNewLine(false); }
  };

  const deleteLine = async (id: string) => {
    await db("sop_lines").delete().eq("id", id);
    setLines(l => l.filter(x => x.id !== id));
    setMappings(m => m.filter(x => x.line_id !== id));
  };

  const addMapping = async () => {
    if (!user || !newMapping.product_id || !newMapping.line_id) return;
    const { data } = await db("sop_mappings").insert([{ ...newMapping, user_id: user.id }]).select().single();
    if (data) { setMappings(m => [...m, data as Mapping]); setShowNewMapping(false); setNewMapping({ product_id: "", line_id: "", unit_time: 5, yield_pct: 95 }); }
  };

  const deleteMapping = async (id: string) => {
    await db("sop_mappings").delete().eq("id", id);
    setMappings(m => m.filter(x => x.id !== id));
  };

  const updateMapping = async (id: string, field: string, value: number) => {
    await db("sop_mappings").update({ [field]: value }).eq("id", id);
    setMappings(m => m.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getLine = (id: string) => lines.find(l => l.id === id);

  if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Structure industrielle" description="Produits, lignes de production et mapping" icon={<Factory className="h-5 w-5" />} />

      <div className="flex gap-1 mb-6 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { key: "mapping" as const, label: "Mapping Produit → Ligne", icon: GitBranch },
          { key: "products" as const, label: `Produits (${products.length})`, icon: Package },
          { key: "lines" as const, label: `Lignes (${lines.length})`, icon: Factory },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
              tab === t.key ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── MAPPING TAB ── */}
      {tab === "mapping" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Mapping Produit → Ligne(s)</h3>
            <button onClick={() => setShowNewMapping(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>

          {showNewMapping && (
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
              <select value={newMapping.product_id} onChange={e => setNewMapping({ ...newMapping, product_id: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs flex-1">
                <option value="">Produit...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
              <select value={newMapping.line_id} onChange={e => setNewMapping({ ...newMapping, line_id: e.target.value })}
                className="rounded border border-border bg-background px-2 py-1.5 text-xs flex-1">
                <option value="">Ligne...</option>
                {lines.map(l => <option key={l.id} value={l.id}>{l.name} ({l.site})</option>)}
              </select>
              <input type="number" value={newMapping.unit_time} onChange={e => setNewMapping({ ...newMapping, unit_time: Number(e.target.value) || 1 })}
                className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs" placeholder="min" />
              <input type="number" value={newMapping.yield_pct} onChange={e => setNewMapping({ ...newMapping, yield_pct: Math.min(100, Number(e.target.value)) })}
                className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs" placeholder="%" />
              <button onClick={addMapping} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground"><Save className="h-3 w-3" /></button>
              <button onClick={() => setShowNewMapping(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {mappings.length === 0 && !showNewMapping ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucun mapping. Ajoutez d'abord des produits et des lignes, puis créez des mappings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produit</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ligne</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Temps unit. (min)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rendement (%)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cap./jour</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(m => {
                    const prod = getProduct(m.product_id);
                    const line = getLine(m.line_id);
                    const capPerDay = line ? Math.floor((line.capacity_per_day / m.unit_time) * (m.yield_pct / 100)) : 0;
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-card-foreground">{prod?.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-card-foreground">{prod?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-card-foreground font-medium">{line?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{line?.site ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" value={m.unit_time}
                            onChange={e => updateMapping(m.id, "unit_time", Number(e.target.value) || 1)}
                            className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input type="number" value={m.yield_pct}
                            onChange={e => updateMapping(m.id, "yield_pct", Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs" />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-card-foreground">{capPerDay}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteMapping(m.id)} className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {tab === "products" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Catalogue produits</h3>
            <button onClick={() => setShowNewProduct(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          {showNewProduct && (
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
              <input value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="SKU" className="rounded border border-border bg-background px-2 py-1.5 text-xs w-24" />
              <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Nom du produit" className="rounded border border-border bg-background px-2 py-1.5 text-xs flex-1" />
              <input value={newProduct.family} onChange={e => setNewProduct({ ...newProduct, family: e.target.value })}
                placeholder="Famille" className="rounded border border-border bg-background px-2 py-1.5 text-xs w-32" />
              <button onClick={addProduct} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground">OK</button>
              <button onClick={() => setShowNewProduct(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          {products.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun produit. Cliquez sur "Ajouter" pour créer votre premier produit.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Famille</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lignes assignées</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-card-foreground">{p.sku}</td>
                      <td className="px-4 py-3 text-card-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.family}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                          {mappings.filter(m => m.product_id === p.id).length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteProduct(p.id)} className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LINES TAB ── */}
      {tab === "lines" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Lignes de production</h3>
            <button onClick={() => setShowNewLine(true)} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          {showNewLine && (
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
              <input value={newLine.name} onChange={e => setNewLine({ ...newLine, name: e.target.value })}
                placeholder="Nom de la ligne" className="rounded border border-border bg-background px-2 py-1.5 text-xs flex-1" />
              <input value={newLine.site} onChange={e => setNewLine({ ...newLine, site: e.target.value })}
                placeholder="Site" className="rounded border border-border bg-background px-2 py-1.5 text-xs w-32" />
              <input type="number" value={newLine.capacity_per_day} onChange={e => setNewLine({ ...newLine, capacity_per_day: Number(e.target.value) || 480 })}
                placeholder="Cap/jour (min)" className="rounded border border-border bg-background px-2 py-1.5 text-xs w-24" />
              <button onClick={addLine} className="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground">OK</button>
              <button onClick={() => setShowNewLine(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}
          {lines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucune ligne. Cliquez sur "Ajouter" pour créer votre première ligne de production.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Capacité (min/jour)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Produits assignés</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.site}</td>
                      <td className="px-4 py-3 text-right text-card-foreground">{l.capacity_per_day} min</td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                          {mappings.filter(m => m.line_id === l.id).length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteLine(l.id)} className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
