import { ColumnMapping } from "@/lib/dataParser";

export interface ColumnInfo {
  name: string;
  role: string;
  description: string;
}

export interface AIMapping {
  dateCol: string | null;
  valueCol: string | null;
  productCol: string | null;
  categoryCol: string | null;
  allColumns: ColumnInfo[];
  businessContext: string;
  suggestedGranularity: "global" | "sku" | "family" | "subfamily";
  confidence: number;
}

export interface ForecastPayload {
  fileName: string;
  mapping: ColumnMapping;
  allColumns: ColumnInfo[];
  businessContext: string;
  granularity: "global" | "sku" | "family" | "subfamily";
  data: Record<string, any>[];
  totalRows: number;
  uniqueProducts: string[];
  uniqueCategories: string[];
  dateRange: { min: string; max: string } | null;
  horizon: number;
}

export function buildForecastPayload(
  rows: Record<string, any>[],
  columns: string[],
  mapping: ColumnMapping,
  aiMapping: AIMapping | null,
  fileName: string,
  granularity: "global" | "sku" | "family" | "subfamily"
): ForecastPayload {
  // Extract unique products/categories
  const products = mapping.productCol
    ? [...new Set(rows.map((r) => String(r[mapping.productCol!] ?? "")).filter(Boolean))]
    : [];
  const categories = mapping.categoryCol
    ? [...new Set(rows.map((r) => String(r[mapping.categoryCol!] ?? "")).filter(Boolean))]
    : [];

  // Date range
  let dateRange: { min: string; max: string } | null = null;
  if (mapping.dateCol) {
    const dates = rows
      .map((r) => {
        const v = r[mapping.dateCol!];
        if (v instanceof Date) return v;
        const d = new Date(String(v));
        return isNaN(d.getTime()) ? null : d;
      })
      .filter(Boolean) as Date[];
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      dateRange = {
        min: dates[0].toISOString(),
        max: dates[dates.length - 1].toISOString(),
      };
    }
  }

  return {
    fileName,
    mapping,
    allColumns: aiMapping?.allColumns ?? columns.map((c) => ({ name: c, role: "other", description: "" })),
    businessContext: aiMapping?.businessContext ?? "",
    granularity,
    data: rows,
    totalRows: rows.length,
    uniqueProducts: products,
    uniqueCategories: categories,
    dateRange,
    horizon: 6,
  };
}
