import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ColumnMapping } from "@/lib/dataParser";
import { runAllModels, ForecastResult } from "@/lib/forecastEngine";

export type Granularity = "global" | "sku" | "family" | "subfamily";

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
}

interface DataContextType {
  data: DataState;
  processData: (rows: DataRow[], columns: string[], mapping: ColumnMapping, fileName: string, granularity: Granularity, serverResult?: any) => Promise<void>;
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
};

const DataContext = createContext<DataContextType | undefined>(undefined);

function buildTimeSeries(rows: DataRow[], mapping: ColumnMapping): TimeSeriesPoint[] {
  const timeSeries: TimeSeriesPoint[] = [];
  if (!mapping.dateCol) return timeSeries;

  // Resolve value column: valueCol > revenueCol > quantityCol
  const extMapping = mapping as any;
  const valueColumn = mapping.valueCol || extMapping.revenueCol || extMapping.quantityCol;
  if (!valueColumn) return timeSeries;

  // Detect product/category columns including extended mapping
  const productCol = mapping.productCol || extMapping.familyCol;
  const categoryCol = mapping.categoryCol || extMapping.subfamilyCol;

  for (const row of rows) {
    const dateRaw = row[mapping.dateCol];
    const valueRaw = row[valueColumn];
    if (dateRaw == null || valueRaw == null) continue;

    // Robust date parsing: handle European formats (DD/MM/YYYY), Excel serial numbers
    let date: Date;
    if (dateRaw instanceof Date) {
      date = dateRaw;
    } else if (typeof dateRaw === "number") {
      // Excel serial date
      date = new Date((dateRaw - 25569) * 86400 * 1000);
    } else {
      const s = String(dateRaw).trim();
      // Try DD/MM/YYYY or DD-MM-YYYY
      const euMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
      if (euMatch) {
        const [, d, m, y] = euMatch;
        const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        date = new Date(year, parseInt(m) - 1, parseInt(d));
      } else {
        date = new Date(s);
      }
    }

    // Robust value parsing: handle comma decimals, spaces
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
    rows: DataRow[], columns: string[], mapping: ColumnMapping, fileName: string, granularity: Granularity, serverResult?: any
  ) => {
    setData((prev) => ({ ...prev, isProcessing: true }));

    try {
      const timeSeries = buildTimeSeries(rows, mapping);
      const values = timeSeries.map((t) => t.value);
      const forecasts = values.length >= 6 ? runAllModels(values, 6) : null;

      // Group forecasts
      const groups = new Map<string, TimeSeriesPoint[]>();
      if (granularity !== "global") {
        for (const point of timeSeries) {
          const key = getGroupKey(point, granularity);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(point);
        }
      }

      const groupForecasts: GroupForecast[] = [];
      const groupKeys: string[] = [];
      for (const [groupKey, pts] of groups.entries()) {
        const gValues = pts.map((p) => p.value);
        if (gValues.length >= 6) {
          groupForecasts.push({
            groupKey,
            timeSeries: pts,
            forecasts: runAllModels(gValues, 6),
          });
          groupKeys.push(groupKey);
        }
      }

      // Sort groups by total value descending
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
