import { Boxes } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { cn } from "@/lib/utils";

const inventory = [
  { sku: "SKU-1042", product: "Laptop Pro 15\"", stock: 12, optimal: 50, status: "critique" as const, recommendation: "Commander 38 unités" },
  { sku: "SKU-2087", product: "Écran 27\" 4K", stock: 8, optimal: 35, status: "critique" as const, recommendation: "Commander 27 unités" },
  { sku: "SKU-3156", product: "Clavier mécanique", stock: 15, optimal: 40, status: "bas" as const, recommendation: "Commander 25 unités" },
  { sku: "SKU-3087", product: "Souris ergonomique", stock: 180, optimal: 60, status: "surstock" as const, recommendation: "Promotion -15%" },
  { sku: "SKU-4201", product: "Câble USB-C", stock: 95, optimal: 100, status: "ok" as const, recommendation: "Aucune action" },
  { sku: "SKU-5012", product: "Hub USB", stock: 45, optimal: 50, status: "ok" as const, recommendation: "Surveillance" },
];

export default function Inventory() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Optimisation des stocks" description="Recommandations de réapprovisionnement intelligent" icon={<Package className="h-5 w-5" />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs text-muted-foreground">Critiques</p>
          <p className="font-display text-2xl font-bold text-destructive">2</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-xs text-muted-foreground">Stocks bas</p>
          <p className="font-display text-2xl font-bold text-warning">1</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">Surstocks</p>
          <p className="font-display text-2xl font-bold text-primary">1</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <p className="text-xs text-muted-foreground">Optimaux</p>
          <p className="font-display text-2xl font-bold text-success">2</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">SKU</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Produit</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Stock</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Optimal</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">Statut</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Recommandation</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.sku} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-5 py-3 font-medium text-card-foreground">{item.product}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{item.stock}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{item.optimal}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      item.status === "critique" && "bg-destructive/10 text-destructive",
                      item.status === "bas" && "bg-warning/10 text-warning",
                      item.status === "surstock" && "bg-primary/10 text-primary",
                      item.status === "ok" && "bg-success/10 text-success"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
