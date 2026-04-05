import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ColumnMapping } from "@/lib/dataParser";
import { runAllModels, ForecastResult } from "@/lib/forecastEngine";

export type Granularity = "global" | "sku" | "family" | "subfamily";
export type ForecastTarget = "revenue" | "quantity";

export interface DataRow {
  [key: string]: string | number | Date | null;
}

export interface TimeSeriesPoint {
  date: Date;
  value: number;
  product?: string;
  category?: string;
}

export interface GroupForecast {
  groupKey: string;
  timeSeries: TimeSeriesPoint[];
  forecasts: ForecastResult;
}

export interface DataState {
  raw: DataRow[];
  columns: string[];
  mapping: ColumnMapping | null;
  fileName: string | null;
  timeSeries: TimeSeriesPoint[];
  forecasts: ForecastResult | null;
  isProcessing: boolean;
  granularity: Granularity;
  groupForecasts: GroupForecast[];
  groupKeys: string[];
  horizon: number;
  forecastTarget: ForecastTarget;
}

interface DataContextType {
  data: DataState;
  processData: (rows: DataRow[], columns: string[], mapping: ColumnMapping, fileName: string, granularity: Granularity, horizon?: number, forecastTarget?: ForecastTarget, serverResult?: any) => Promise<void>;
  clearData: () => void;
  hasData: boolean;
}

const initialState: DataState = {
  raw: [],
  columns: [],
  mapping: null,
  fileName: null,
  timeSeries: [],
  forecasts: null,
  isProcessing: false,
  granularity: "global",
  groupForecasts: [],
  groupKeys: [],
  horizon: 6,
  forecastTarget: "revenue",
};

const DataContext = createContext<DataContextType | undefined>(undefined);

function buildTimeSeries(rows: DataRow[], mapping: ColumnMapping, forecastTarget: ForecastTarget): TimeSeriesPoint[] {
  const timeSeries: TimeSeriesPoint[] = [];
  if (!mapping.dateCol) return timeSeries;

  const extMapping = mapping as any;

  // Pick value column based on target
  let valueColumn: string | null = null;
  if (forecastTarget === "quantity") {
    valueColumn = extMapping.quantityCol || mapping.valueCol || extMapping.revenueCol;
  } else {
    valueColumn = extMapping.revenueCol || mapping.valueCol || extMapping.quantityCol;
  }
  if (!valueColumn) return timeSeries;

  const productCol = mapping.productCol || extMapping.familyCol;
  const categoryCol = mapping.categoryCol || extMapping.subfamilyCol;

  for (const row of rows) {
    const dateRaw = row[mapping.dateCol];
    const valueRaw = row[valueColumn];
    if (dateRaw == null || valueRaw == null) continue;

    let date: Date;
    if (dateRaw instanceof Date) {
      date = dateRaw;
    } else if (typeof dateRaw === "number") {
      date = new Date((dateRaw - 25569) * 86400 * 1000);
    } else {
      const s = String(dateRaw).trim();
      const euMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
      if (euMatch) {
        const [, d, m, y] = euMatch;
        const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        date = new Date(year, parseInt(m) - 1, parseInt(d));
      } else {
        date = new Date(s);
      }
    }

    let value: number;
    if (typeof valueRaw === "number") {
      value = valueRaw;
    } else {
      const cleaned = String(valueRaw).replace(/\s/g, "").replace(/,/g, ".");
      value = parseFloat(cleaned);
    }

    if (isNaN(date.getTime()) || isNaN(value)) continue;

    timeSeries.push({
      date,
      value,
      product: productCol ? String(row[productCol] ?? "") : undefined,
      category: categoryCol ? String(row[categoryCol] ?? "") : undefined,
    });
  }
  timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return timeSeries;
}

function aggregateToMonthly(points: TimeSeriesPoint[]): { date: Date; value: number }[] {
  const buckets = new Map<string, { date: Date; total: number }>();
  for (const p of points) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
    if (!buckets.has(key)) {
      buckets.set(key, { date: new Date(p.date.getFullYear(), p.date.getMonth(), 1), total: 0 });
    }
    buckets.get(key)!.total += p.value;
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => ({ date: b.date, value: b.total }));
}

function getGroupKey(point: TimeSeriesPoint, granularity: Granularity): string {
  switch (granularity) {
    case "sku": return point.product || "Inconnu";
    case "family": return point.category || "Inconnu";
    case "subfamily": return `${point.product || "?"}×${point.category || "?"}`;
    default: return "Global";
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(initialState);

  const processData = useCallback(async (
    rows: DataRow[], columns: string[], mapping: ColumnMapping, fileName: string, granularity: Granularity, horizon: number = 6, forecastTarget: ForecastTarget = "revenue", serverResult?: any
  ) => {
    setData((prev) => ({ ...prev, isProcessing: true }));

    try {
      const timeSeries = buildTimeSeries(rows, mapping, forecastTarget);

      let forecasts: ForecastResult | null = null;
      let groupForecasts: GroupForecast[] = [];

      if (serverResult && serverResult.models && Array.isArray(serverResult.models)) {
        // Use server results (13 ML models from Railway)
        forecasts = {
          models: serverResult.models.map((m: any) => ({
            name: m.name || m.model_name || "Unknown",
            predictions: m.predictions || m.forecast || [],
            mape: m.mape ?? m.metrics?.mape ?? 0,
            bias: m.bias ?? m.metrics?.bias ?? 0,
            mae: m.mae ?? m.metrics?.mae ?? 0,
          })),
          bestModel: serverResult.best_model || serverResult.bestModel || serverResult.models[0]?.name || "Unknown",
          horizon: serverResult.horizon || horizon,
          historicalLength: serverResult.historical_length || timeSeries.length,
          lowerBound: serverResult.lower_bound || [],
          upperBound: serverResult.upper_bound || [],
        };
        forecasts.models.sort((a, b) => a.mape - b.mape);
        forecasts.bestModel = forecasts.models[0]?.name || forecasts.bestModel;

        // Use server group forecasts if available
        if (serverResult.groups && Array.isArray(serverResult.groups)) {
          groupForecasts = serverResult.groups.map((g: any) => ({
            groupKey: g.group_key || g.groupKey || "Unknown",
            timeSeries: timeSeries.filter((p) => {
              const key = getGroupKey(p, granularity);
              return key === (g.group_key || g.groupKey);
            }),
            forecasts: {
              models: (g.models || []).map((m: any) => ({
                name: m.name || m.model_name || "Unknown",
                predictions: m.predictions || m.forecast || [],
                mape: m.mape ?? m.metrics?.mape ?? 0,
                bias: m.bias ?? m.metrics?.bias ?? 0,
                mae: m.mae ?? m.metrics?.mae ?? 0,
              })),
              bestModel: g.best_model || g.models?.[0]?.name || "Unknown",
              horizon: g.horizon || horizon,
              historicalLength: g.historical_length || 0,
            },
          }));
        }
      } else {
        // Fallback: local JS models
        const monthlyGlobal = aggregateToMonthly(timeSeries);
        const monthlyValues = monthlyGlobal.map((m) => m.value);
        forecasts = monthlyValues.length >= 4 ? runAllModels(monthlyValues, horizon) : null;

        const groups = new Map<string, TimeSeriesPoint[]>();
        if (granularity !== "global") {
          for (const point of timeSeries) {
            const key = getGroupKey(point, granularity);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(point);
          }
        }

        for (const [groupKey, pts] of groups.entries()) {
          const monthlyGroup = aggregateToMonthly(pts);
          const gValues = monthlyGroup.map((m) => m.value);
          if (gValues.length >= 4) {
            groupForecasts.push({
              groupKey,
              timeSeries: pts,
              forecasts: runAllModels(gValues, horizon),
            });
          }
        }
      }

      groupForecasts.sort((a, b) => {
        const totalA = a.timeSeries.reduce((s, p) => s + p.value, 0);
        const totalB = b.timeSeries.reduce((s, p) => s + p.value, 0);
        return totalB - totalA;
      });

      setData({
        raw: rows,
        columns,
        mapping,
        fileName,
        timeSeries,
        forecasts,
        isProcessing: false,
        granularity,
        groupForecasts,
        groupKeys: groupForecasts.map((g) => g.groupKey),
        horizon,
        forecastTarget,
      });
    } catch (err) {
      console.error("Processing error:", err);
      setData((prev) => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const clearData = useCallback(() => setData(initialState), []);

  return (
    <DataContext.Provider value={{ data, processData, clearData, hasData: data.timeSeries.length > 0 }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
