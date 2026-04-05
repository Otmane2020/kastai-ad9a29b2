import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { parseFile, autoMapColumns, ColumnMapping } from "@/lib/dataParser";
import { runAllModels, ForecastResult } from "@/lib/forecastEngine";

export interface DataRow {
  [key: string]: string | number | Date | null;
}

export interface DataState {
  raw: DataRow[];
  columns: string[];
  mapping: ColumnMapping | null;
  fileName: string | null;
  timeSeries: { date: Date; value: number; product?: string; category?: string }[];
  forecasts: ForecastResult | null;
  isProcessing: boolean;
}

interface DataContextType {
  data: DataState;
  uploadFile: (file: File) => Promise<void>;
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
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(initialState);

  const uploadFile = useCallback(async (file: File) => {
    setData((prev) => ({ ...prev, isProcessing: true }));

    try {
      const { rows, columns } = await parseFile(file);
      const mapping = autoMapColumns(columns, rows);

      // Build time series from mapped columns
      const timeSeries: DataState["timeSeries"] = [];
      for (const row of rows) {
        if (!mapping.dateCol || !mapping.valueCol) continue;
        const dateRaw = row[mapping.dateCol];
        const valueRaw = row[mapping.valueCol];
        if (dateRaw == null || valueRaw == null) continue;

        const date = dateRaw instanceof Date ? dateRaw : new Date(String(dateRaw));
        const value = typeof valueRaw === "number" ? valueRaw : parseFloat(String(valueRaw));
        if (isNaN(date.getTime()) || isNaN(value)) continue;

        timeSeries.push({
          date,
          value,
          product: mapping.productCol ? String(row[mapping.productCol] ?? "") : undefined,
          category: mapping.categoryCol ? String(row[mapping.categoryCol] ?? "") : undefined,
        });
      }

      // Sort by date
      timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Run forecasting engine
      const values = timeSeries.map((t) => t.value);
      const forecasts = values.length >= 6 ? runAllModels(values, 6) : null;

      setData({
        raw: rows,
        columns,
        mapping,
        fileName: file.name,
        timeSeries,
        forecasts,
        isProcessing: false,
      });
    } catch (err) {
      console.error("Import error:", err);
      setData((prev) => ({ ...prev, isProcessing: false }));
    }
  }, []);

  const clearData = useCallback(() => setData(initialState), []);

  return (
    <DataContext.Provider value={{ data, uploadFile, clearData, hasData: data.timeSeries.length > 0 }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
