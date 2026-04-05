import { ColumnMapping } from "@/lib/dataParser";

export interface ColumnInfo {
  name: string;
  role: string;
  description: string;
}

export interface AIMapping {
  dateCol: string | null;
  valueCol: string | null;
  revenueCol: string | null;
  quantityCol: string | null;
  productCol: string | null;
  categoryCol: string | null;
  familyCol: string | null;
  subfamilyCol: string | null;
  allColumns: ColumnInfo[];
  businessContext: string;
  suggestedGranularity: "global" | "sku" | "family" | "subfamily";
  confidence: number;
}

export interface ProphetRegressor {
  key: string;
  label: string;
  enabled: boolean;
  type: "column" | "external";
}

export const DEFAULT_PROPHET_EXTERNAL_EVENTS: ProphetRegressor[] = [
  { key: "holidays_fr", label: "🇫🇷 Jours fériés France", enabled: true, type: "external" },
  { key: "black_friday", label: "🛒 Black Friday", enabled: true, type: "external" },
  { key: "christmas", label: "🎄 Noël / Fêtes", enabled: true, type: "external" },
  { key: "valentines", label: "💝 Saint-Valentin", enabled: true, type: "external" },
  { key: "mothers_day", label: "👩 Fête des Mères", enabled: true, type: "external" },
  { key: "fathers_day", label: "👨 Fête des Pères", enabled: true, type: "external" },
  { key: "back_to_school", label: "🎒 Rentrée scolaire", enabled: true, type: "external" },
  { key: "summer_sales", label: "☀️ Soldes d'été", enabled: true, type: "external" },
  { key: "winter_sales", label: "❄️ Soldes d'hiver", enabled: true, type: "external" },
  { key: "easter", label: "🐣 Pâques", enabled: true, type: "external" },
  { key: "weather", label: "🌤️ Données météo", enabled: false, type: "external" },
];

export interface ExtendedMapping extends ColumnMapping {
  revenueCol: string | null;
  quantityCol: string | null;
  familyCol: string | null;
  subfamilyCol: string | null;
}

export interface ForecastPayload {
  fileName: string;
  mapping: ExtendedMapping;
  allColumns: ColumnInfo[];
  contextColumns: string[];
  businessContext: string;
  granularity: "global" | "sku" | "family" | "subfamily";
  data: Record<string, any>[];
  totalRows: number;
  uniqueProducts: string[];
  uniqueCategories: string[];
  uniqueFamilies: string[];
  uniqueSubfamilies: string[];
  dateRange: { min: string; max: string } | null;
  horizon: number;
  forecastTargets: ("revenue" | "quantity")[];
  prophetRegressors: ProphetRegressor[];
}

export function buildForecastPayload(
  rows: Record<string, any>[],
  columns: string[],
  mapping: ExtendedMapping,
  aiMapping: AIMapping | null,
  fileName: string,
  granularity: "global" | "sku" | "family" | "subfamily",
  forecastTargets: ("revenue" | "quantity")[],
  prophetRegressors: ProphetRegressor[]
): ForecastPayload {
  const products = mapping.productCol
    ? [...new Set(rows.map((r) => String(r[mapping.productCol!] ?? "")).filter(Boolean))]
    : [];
  const categories = mapping.categoryCol
    ? [...new Set(rows.map((r) => String(r[mapping.categoryCol!] ?? "")).filter(Boolean))]
    : [];
  const families = mapping.familyCol
    ? [...new Set(rows.map((r) => String(r[mapping.familyCol!] ?? "")).filter(Boolean))]
    : [];
  const subfamilies = mapping.subfamilyCol
    ? [...new Set(rows.map((r) => String(r[mapping.subfamilyCol!] ?? "")).filter(Boolean))]
    : [];

  // All columns not mapped to a primary role are context columns
  const primaryCols = [mapping.dateCol, mapping.valueCol, mapping.revenueCol, mapping.quantityCol, mapping.productCol, mapping.categoryCol, mapping.familyCol, mapping.subfamilyCol].filter(Boolean);
  const contextColumns = columns.filter((c) => !primaryCols.includes(c));

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
    contextColumns,
    businessContext: aiMapping?.businessContext ?? "",
    granularity,
    data: rows,
    totalRows: rows.length,
    uniqueProducts: products,
    uniqueCategories: categories,
    uniqueFamilies: families,
    uniqueSubfamilies: subfamilies,
    dateRange,
    horizon: 6,
    forecastTargets,
    prophetRegressors,
  };
}
