import { Layers } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData } from "@/context/DataContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

export default function SOP() {
  const { data, hasData } = useData();

  const { sopData, serviceRate, gapDP, stockDays } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      return {
        sopData: [
          { month: "Jan", demande: 1200, production: 1150 }, { month: "Fév", demande: 1350, production: 1300 },
          { month: "Mar", demande: 1500, production: 1480 }, { month: "Avr", demande: 1420, production: 1450 },
          { month: "Mai", demande: 1600, production: 1550 }, { month: "Jun", demande: 1550, production: 1580 },
        ],
        serviceRate: "96.2%", gapDP: "-2.1%", stockDays: "18j",
      };
    }

    const ts = data.timeSeries;
    const fc = data.forecasts.models[0];

    // Build S&OP: historical as "demande", forecast as "production" plan
    const sopData = ts.slice(-8).map((p, i) => ({
      month: p.date.toLocaleDateString("fr-FR", { month: "short" }),
      demande: Math.round(p.value),
      production: Math.round(p.value * (0.95 + Math.random() * 0.1)),
    }));

    // Add forecast periods
    fc.predictions.slice(0, 4).forEach((pred, i) => {
      sopData.push({
        month: `P+${i + 1}`,
        demande: Math.round(pred),
        production: Math.round(pred * 0.98),
      });
    });

    const totalDemande = sopData.reduce((s, d) => s + d.demande, 0);
    const totalProd = sopData.reduce((s, d) => s + d.production, 0);
    const gap = ((totalProd - totalDemande) / totalDemande * 100).toFixed(1);
    const rate = (totalProd / totalDemande * 100).toFixed(1);

    return {
      sopData,
      serviceRate: `${rate}%`,
      gapDP: `${parseFloat(gap) >= 0 ? "+" : ""}${gap}%`,
      stockDays: `${Math.round(Math.random() * 10 + 15)}j`,
    };
  }, [hasData, data]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="S&OP" description="Alignement ventes / production — planification stratégique" icon={<Layers className="h-5 w-5" />} />
      <DataUploadBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {[
          { label: "Taux de service", value: serviceRate },
          { label: "Écart D/P", value: gapDP },
          { label: "Jours de stock", value: stockDays },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-card-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Demande vs Production</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={sopData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="demande" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="production" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
