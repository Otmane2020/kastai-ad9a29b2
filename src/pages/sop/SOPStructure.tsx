import { useState } from "react";
import { Factory, Plus, Trash2, Package, GitBranch } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  family: string;
}

interface Line {
  id: string;
  name: string;
  site: string;
  capacityPerDay: number;
}

interface Mapping {
  productId: string;
  lineId: string;
  unitTime: number; // minutes
  yield: number; // %
}

const DEMO_PRODUCTS: Product[] = [
  { id: "p1", sku: "SKU-001", name: "Produit Alpha", family: "Famille A" },
  { id: "p2", sku: "SKU-002", name: "Produit Beta", family: "Famille A" },
  { id: "p3", sku: "SKU-003", name: "Produit Gamma", family: "Famille B" },
  { id: "p4", sku: "SKU-004", name: "Produit Delta", family: "Famille B" },
];

const DEMO_LINES: Line[] = [
  { id: "l1", name: "Ligne 1", site: "Usine Nord", capacityPerDay: 480 },
  { id: "l2", name: "Ligne 2", site: "Usine Nord", capacityPerDay: 480 },
  { id: "l3", name: "Ligne 3", site: "Usine Sud", capacityPerDay: 600 },
];

const DEMO_MAPPINGS: Mapping[] = [
  { productId: "p1", lineId: "l1", unitTime: 5, yield: 97 },
  { productId: "p1", lineId: "l2", unitTime: 6, yield: 95 },
  { productId: "p2", lineId: "l1", unitTime: 8, yield: 93 },
  { productId: "p3", lineId: "l3", unitTime: 3, yield: 98 },
  { productId: "p4", lineId: "l2", unitTime: 7, yield: 94 },
  { productId: "p4", lineId: "l3", unitTime: 4, yield: 96 },
];

export default function SOPStructure() {
  const [products] = useState<Product[]>(DEMO_PRODUCTS);
  const [lines] = useState<Line[]>(DEMO_LINES);
  const [mappings, setMappings] = useState<Mapping[]>(DEMO_MAPPINGS);
  const [tab, setTab] = useState<"products" | "lines" | "mapping">("mapping");

  const getProduct = (id: string) => products.find((p) => p.id === id);
  const getLine = (id: string) => lines.find((l) => l.id === id);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Structure industrielle" description="Produits, lignes de production et mapping" icon={<Factory className="h-5 w-5" />} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg bg-muted/50 p-1 w-fit">
        {([
          { key: "mapping" as const, label: "Mapping Produit → Ligne", icon: GitBranch },
          { key: "products" as const, label: "Produits", icon: Package },
          { key: "lines" as const, label: "Lignes de production", icon: Factory },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
              tab === t.key ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mapping" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Mapping Produit → Ligne(s)</h3>
            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
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
                {mappings.map((m, i) => {
                  const prod = getProduct(m.productId);
                  const line = getLine(m.lineId);
                  const capPerDay = line ? Math.floor((line.capacityPerDay / m.unitTime) * (m.yield / 100)) : 0;
                  return (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-card-foreground">{prod?.sku}</td>
                      <td className="px-4 py-3 text-card-foreground">{prod?.name}</td>
                      <td className="px-4 py-3 text-card-foreground font-medium">{line?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{line?.site}</td>
                      <td className="px-4 py-3 text-right text-card-foreground">
                        <input
                          type="number"
                          value={m.unitTime}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[i] = { ...m, unitTime: Number(e.target.value) || 1 };
                            setMappings(updated);
                          }}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-card-foreground">
                        <input
                          type="number"
                          value={m.yield}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[i] = { ...m, yield: Math.min(100, Math.max(0, Number(e.target.value))) };
                            setMappings(updated);
                          }}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-right text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-card-foreground">{capPerDay}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setMappings(mappings.filter((_, j) => j !== i))}
                          className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Catalogue produits</h3>
            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Famille</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lignes assignées</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-card-foreground">{p.sku}</td>
                    <td className="px-4 py-3 text-card-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.family}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                        {mappings.filter((m) => m.productId === p.id).length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "lines" && (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-display text-sm font-semibold text-card-foreground">Lignes de production</h3>
            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Capacité (min/jour)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Produits assignés</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{l.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.site}</td>
                    <td className="px-4 py-3 text-right text-card-foreground">{l.capacityPerDay} min</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                        {mappings.filter((m) => m.lineId === l.id).length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
