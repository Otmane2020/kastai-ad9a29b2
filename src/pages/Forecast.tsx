import { LineChart as LineChartIcon, DollarSign, Hash, ServerCog, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import DataUploadBanner from "@/components/DataUploadBanner";
import { useData, TimeSeriesPoint } from "@/context/DataContext";
import { ForecastResult, runAllModels } from "@/lib/forecastEngine";
import { useCallback, useMemo, useState } from "react";
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
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const handleToggleModel = useCallback((name: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const availableLevels = useMemo(() => {
    const levels: ViewLevel[] = ["global"];
    if (!hasData || !data.mapping) return levels;
    const ext = data.mapping as any;
    const hasProduct = !!(data.mapping.productCol || ext.familyCol);
    const hasCategory = !!(data.mapping.categoryCol || ext.subfamilyCol);
    if (hasProduct) levels.push("sku");
    if (hasCategory) levels.push("family");
    if (hasProduct && hasCategory) levels.push("subfamily");
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

  const { chartData, models, backtestData, forecastInfo, lastDate } = useMemo(() => {
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
          { name: "Lissage Expo", mape: "4.2%", bias: "+1.1%", mapeNum: 4.2, selected: true, predictions: [] },
          { name: "Moyenne Mobile", mape: "5.8%", bias: "-0.5%", mapeNum: 5.8, selected: false, predictions: [] },
        ],
        backtestData: [
          { p: "Train set", r: "9 pts", pr: "95.8%", e: "MAPE 4.2%" },
          { p: "Test set", r: "3 pts", pr: "Lissage Expo", e: "Biais +1.1%" },
        ],
        forecastInfo: null,
        lastDate: new Date(),
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
    const chartData: Record<string, any>[] = [];
    const horizon = activeFc.horizon;

    // Backtesting: split historical data 80/20
    const testSize = Math.max(2, Math.min(Math.floor(monthly.length * 0.2), horizon));
    const trainEnd = monthly.length - testSize;

    // Re-run models on train data to get proper backtest predictions
    const trainValues = monthly.slice(0, trainEnd).map(m => m.value);
    let backtestFc: ForecastResult | null = null;
    if (trainValues.length >= 4) {
      backtestFc = runAllModels(trainValues, testSize);
    }

    // Build chart with train/test split visualization
    monthly.forEach((m, idx) => {
      const point: Record<string, any> = { period: m.label };
      if (idx < trainEnd) {
        point["réel"] = m.value;
      } else {
        point["réel (test)"] = m.value;
      }
      // Add backtest predictions on test period
      if (idx >= trainEnd && backtestFc) {
        const testIdx = idx - trainEnd;
        backtestFc.models.forEach((bm) => {
          if (testIdx < bm.predictions.length) {
            point[`${bm.name} (backtest)`] = Math.round(bm.predictions[testIdx]);
          }
        });
      }
      chartData.push(point);
    });

    // Future forecast lines from last real value
    const lastDateVal = monthly.length > 0 ? new Date(monthly[monthly.length - 1].date) : new Date();
    const lastRealValue = monthly.length > 0 ? monthly[monthly.length - 1].value : 0;

    activeFc.models.forEach((model) => {
      // Continuity: connect last real point to forecast
      if (chartData.length > 0) {
        chartData[chartData.length - 1][model.name] = lastRealValue;
      }

      model.predictions.forEach((pred, i) => {
        const futureDate = new Date(lastDateVal.getFullYear(), lastDateVal.getMonth() + (i + 1), 1);
        const label = futureDate.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        let existing = chartData.find((r) => r.period === label);
        if (!existing) { existing = { period: label }; chartData.push(existing); }
        existing[model.name] = Math.round(pred);
      });
    });

    const lastDateResult = monthly.length > 0 ? new Date(monthly[monthly.length - 1].date) : new Date();

    const modelNames = activeFc.models.map(m => m.name);
    if (selectedModels.size === 0 || !modelNames.some(n => selectedModels.has(n))) {
      // Auto-select best model on first load
      const bestName = activeFc.models[0]?.name;
      if (bestName) setSelectedModels(new Set([bestName]));
    }

    const models = activeFc.models.map((m) => ({
      name: m.name,
      mape: `${m.mape.toFixed(1)}%`,
      bias: `${m.bias >= 0 ? "+" : ""}${m.bias.toFixed(1)}%`,
      mapeNum: m.mape,
      selected: selectedModels.has(m.name) || (selectedModels.size === 0 && m.name === activeFc.models[0]?.name),
      predictions: m.predictions,
    }));

    const backtestData = [
      { p: "Train set (80%)", r: `${trainEnd} mois`, pr: `${(100 - activeFc.models[0].mape).toFixed(1)}%`, e: `MAPE ${activeFc.models[0].mape.toFixed(1)}%` },
      { p: "Test set (20%)", r: `${testSize} mois`, pr: activeFc.bestModel, e: `Biais ${activeFc.models[0].bias >= 0 ? "+" : ""}${activeFc.models[0].bias.toFixed(1)}%` },
    ];

    return {
      chartData, models, backtestData,
      forecastInfo: { bestModel: activeFc.bestModel, points: activeTs.length, horizon: activeFc.horizon },
      lastDate: lastDateResult,
    };
  }, [hasData, data, viewLevel, selectedGroup, selectedModels]);

  const targetLabel = data.forecastTarget === "quantity" ? "Quantité" : "Chiffre d'affaires (CA)";
  const targetUnit = data.forecastTarget === "quantity" ? "unités" : "€";
  const TargetIcon = data.forecastTarget === "quantity" ? Hash : DollarSign;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Prévisions" description="Visualisation des forecasts et comparaison des modèles" icon={<LineChartIcon className="h-5 w-5" />} />

      {/* Target & horizon badge */}
      {hasData && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <TargetIcon className="h-3.5 w-3.5" />
            {targetLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 border border-border px-3 py-1 text-xs font-medium text-foreground">
            Horizon : {data.horizon} mois
          </span>
          {data.forecasts && data.forecasts.models.length > 5 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1 text-xs font-semibold text-success">
              <ServerCog className="h-3.5 w-3.5" />
              Serveur ML — {data.forecasts.models.length} modèles
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Moteur JS local
            </span>
          )}
        </div>
      )}

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

      <ModelCards models={models} onToggle={handleToggleModel} />

      <ForecastChart
        chartData={chartData}
        models={models}
        title={`Prévisions multi-modèles${viewLevel !== "global" && selectedGroup ? ` — ${selectedGroup}` : ""}`}
        subtitle={`${targetLabel} (${targetUnit})${viewLevel === "global" ? " — Données agrégées (mensuel)" : ` — Niveau: ${VIEW_LABELS[viewLevel]}`}`}
      />

      {/* Detailed tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BacktestTable data={backtestData} />
        <MAPEBarChart models={models} />
      </div>

      <HorizonTable models={models} horizon={selectedHorizon} lastDate={lastDate} />
      <ModelComparisonTable models={models} />

      {hasData && data.groupForecasts.length > 0 && (
        <SKUTable groupForecasts={data.groupForecasts} lastDate={lastDate} />
      )}
    </div>
  );
}
