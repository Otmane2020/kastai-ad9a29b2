import { TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData, TimeSeriesPoint } from "@/context/DataContext";
import { ForecastResult } from "@/lib/forecastEngine";
import { useMemo, useState } from "react";
import ForecastFilters, { ViewLevel, VIEW_LABELS, HorizonFilter } from "@/components/forecast/ForecastFilters";
import ForecastChart from "@/components/forecast/ForecastChart";
import { HorizonTable, ModelComparisonTable, SKUTable, BacktestTable, MAPEBarChart } from "@/components/forecast/ForecastTables";
import GroupCards from "@/components/forecast/GroupCards";
import ModelCards from "@/components/forecast/ModelCards";

function aggregateMonthly(ts: TimeSeriesPoint[]): { label: string; value: number; date: Date }[] {
  const buckets = new Map<string, { total: number; date: Date }>();
  for (const p of ts) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets.has(key)) buckets.set(key, { total: 0, date: new Date(p.date.getFullYear(), p.date.getMonth(), 1) });
    buckets.get(key)!.total += p.value;
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      label: v.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      value: Math.round(v.total),
      date: v.date,
    }));
}

function getGroups(ts: TimeSeriesPoint[], level: ViewLevel): Map<string, TimeSeriesPoint[]> {
  const groups = new Map<string, TimeSeriesPoint[]>();
  for (const p of ts) {
    let key: string;
    switch (level) {
      case "sku": key = p.product || "Inconnu"; break;
      case "family": key = p.category || "Inconnu"; break;
      case "subfamily": key = `${p.product || "?"}×${p.category || "?"}`; break;
      default: key = "Global"; break;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return groups;
}

export default function Forecast() {
  const { data, hasData } = useData();
  const [viewLevel, setViewLevel] = useState<ViewLevel>("global");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonFilter>("6M");

  const availableLevels = useMemo(() => {
    const levels: ViewLevel[] = ["global"];
    if (hasData && data.mapping?.productCol) levels.push("sku");
    if (hasData && data.mapping?.categoryCol) levels.push("family");
    if (hasData && data.mapping?.productCol && data.mapping?.categoryCol) levels.push("subfamily");
    return levels;
  }, [hasData, data.mapping]);

  const groups = useMemo(() => {
    if (!hasData) return [];
    const g = getGroups(data.timeSeries, viewLevel);
    return Array.from(g.entries())
      .map(([key, pts]) => ({ key, count: pts.length, total: pts.reduce((s, p) => s + p.value, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [hasData, data.timeSeries, viewLevel]);

  useMemo(() => {
    if (viewLevel === "global") {
      setSelectedGroup(null);
    } else if (groups.length > 0 && (!selectedGroup || !groups.find((g) => g.key === selectedGroup))) {
      setSelectedGroup(groups[0].key);
    }
  }, [viewLevel, groups]);

  const { chartData, models, backtestData, forecastInfo } = useMemo(() => {
    if (!hasData || !data.forecasts) {
      const demoData = Array.from({ length: 12 }, (_, i) => {
        const base = 400 + i * 15 + Math.sin(i / 3) * 40;
        return {
          period: i < 9 ? `M${i + 1}` : `P+${i - 8}`,
          réel: i < 9 ? Math.round(base + (Math.random() - 0.5) * 30) : undefined,
          "Lissage Expo": Math.round(base + (Math.random() - 0.5) * 15),
          "Moyenne Mobile": Math.round(base + (Math.random() - 0.5) * 25),
        };
      });
      return {
        chartData: demoData,
        models: [
          { name: "Lissage Expo", mape: "4.2%", bias: "+1.1%", mapeNum: 4.2, selected: true },
          { name: "Moyenne Mobile", mape: "5.8%", bias: "-0.5%", mapeNum: 5.8, selected: false },
        ],
        backtestData: [
          { p: "Train set", r: "9 pts", pr: "95.8%", e: "MAPE 4.2%" },
          { p: "Test set", r: "3 pts", pr: "Lissage Expo", e: "Biais +1.1%" },
        ],
        forecastInfo: null,
      };
    }

    let activeFc: ForecastResult;
    let activeTs: TimeSeriesPoint[];

    if (viewLevel === "global") {
      activeFc = data.forecasts;
      activeTs = data.timeSeries;
    } else {
      const gf = data.groupForecasts.find((g) => g.groupKey === selectedGroup);
      if (gf) { activeFc = gf.forecasts; activeTs = gf.timeSeries; }
      else { activeFc = data.forecasts; activeTs = data.timeSeries; }
    }

    const monthly = aggregateMonthly(activeTs);
    const chartData: Record<string, any>[] = monthly.map((m) => ({ period: m.label, réel: m.value }));

    if (activeFc) {
      activeFc.models.forEach((model) => {
        model.predictions.forEach((pred, i) => {
          const label = `P+${i + 1}`;
          let existing = chartData.find((r) => r.period === label);
          if (!existing) { existing = { period: label }; chartData.push(existing); }
          existing[model.name] = Math.round(pred);
        });
      });
    }

    const models = activeFc.models.map((m, i) => ({
      name: m.name,
      mape: `${m.mape.toFixed(1)}%`,
      bias: `${m.bias >= 0 ? "+" : ""}${m.bias.toFixed(1)}%`,
      mapeNum: m.mape,
      selected: i === 0,
    }));

    const testSize = Math.max(2, Math.min(Math.floor(activeTs.length * 0.2), 6));
    const backtestData = [
      { p: "Train set", r: `${activeTs.length - testSize} pts`, pr: `${(100 - activeFc.models[0].mape).toFixed(1)}%`, e: `MAPE ${activeFc.models[0].mape.toFixed(1)}%` },
      { p: "Test set", r: `${testSize} pts`, pr: activeFc.bestModel, e: `Biais ${activeFc.models[0].bias >= 0 ? "+" : ""}${activeFc.models[0].bias.toFixed(1)}%` },
    ];

    return {
      chartData, models, backtestData,
      forecastInfo: { bestModel: activeFc.bestModel, points: activeTs.length, horizon: activeFc.horizon },
    };
  }, [hasData, data, viewLevel, selectedGroup]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Prévisions" description="Visualisation des forecasts et comparaison des modèles" icon={<TrendingUp className="h-5 w-5" />} />
      <DataUploadBanner />

      {hasData && availableLevels.length > 1 && (
        <ForecastFilters
          viewLevel={viewLevel} setViewLevel={setViewLevel}
          availableLevels={availableLevels}
          selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
          groups={groups}
          selectedHorizon={selectedHorizon} setSelectedHorizon={setSelectedHorizon}
          forecastInfo={forecastInfo}
        />
      )}

      {hasData && viewLevel !== "global" && (
        <GroupCards groups={groups} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} groupForecasts={data.groupForecasts} />
      )}

      <ModelCards models={models} />

      <ForecastChart
        chartData={chartData}
        models={models}
        title={`Prévisions multi-modèles${viewLevel !== "global" && selectedGroup ? ` — ${selectedGroup}` : ""}`}
        subtitle={viewLevel === "global" ? "Données agrégées (mensuel)" : `Niveau: ${VIEW_LABELS[viewLevel]}`}
      />

      {/* Detailed tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BacktestTable data={backtestData} />
        <MAPEBarChart models={models} />
      </div>

      <HorizonTable models={models} horizon={selectedHorizon} />
      <ModelComparisonTable models={models} />

      {hasData && data.groupForecasts.length > 0 && (
        <SKUTable groupForecasts={data.groupForecasts} />
      )}
    </div>
  );
}
