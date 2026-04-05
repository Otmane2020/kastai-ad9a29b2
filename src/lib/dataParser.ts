import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ColumnMapping {
  dateCol: string | null;
  valueCol: string | null;
  productCol: string | null;
  categoryCol: string | null;
}

export async function parseFile(file: File): Promise<{ rows: Record<string, any>[]; columns: string[] }> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          const columns = result.meta.fields || [];
          resolve({ rows: result.data as Record<string, any>[], columns });
        },
        error: reject,
      });
    });
  }

  // Excel
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns };
}

const DATE_PATTERNS = /^(date|jour|day|mois|month|période|period|timestamp|time|dt|fecha)$/i;
const VALUE_PATTERNS = /^(ventes?|sales?|revenue|ca|chiffre|montant|amount|valeur|value|quantity|qty|quantité|total|volume|demand|demande)$/i;
const PRODUCT_PATTERNS = /^(produit|product|item|sku|article|référence|ref|name|nom|designation)$/i;
const CATEGORY_PATTERNS = /^(catégorie|category|cat|famille|family|type|group|groupe|segment|classe|class)$/i;

function matchColumn(columns: string[], pattern: RegExp): string | null {
  return columns.find((c) => pattern.test(c.trim())) || null;
}

function guessDateColumn(columns: string[], rows: Record<string, any>[]): string | null {
  // Try pattern match first
  const patternMatch = matchColumn(columns, DATE_PATTERNS);
  if (patternMatch) return patternMatch;

  // Try detecting date-like values
  for (const col of columns) {
    const sample = rows.slice(0, 10).map((r) => r[col]);
    const dateCount = sample.filter((v) => {
      if (v instanceof Date) return true;
      if (typeof v === "string") {
        const d = new Date(v);
        return !isNaN(d.getTime()) && v.length > 4;
      }
      return false;
    }).length;
    if (dateCount >= sample.length * 0.6) return col;
  }
  return null;
}

function guessValueColumn(columns: string[], rows: Record<string, any>[], excludeCols: string[]): string | null {
  const patternMatch = matchColumn(
    columns.filter((c) => !excludeCols.includes(c)),
    VALUE_PATTERNS
  );
  if (patternMatch) return patternMatch;

  // Find first numeric column
  for (const col of columns) {
    if (excludeCols.includes(col)) continue;
    const sample = rows.slice(0, 10).map((r) => r[col]);
    const numCount = sample.filter((v) => typeof v === "number" && !isNaN(v)).length;
    if (numCount >= sample.length * 0.6) return col;
  }
  return null;
}

export function autoMapColumns(columns: string[], rows: Record<string, any>[]): ColumnMapping {
  const dateCol = guessDateColumn(columns, rows);
  const valueCol = guessValueColumn(columns, rows, dateCol ? [dateCol] : []);
  const productCol = matchColumn(
    columns.filter((c) => c !== dateCol && c !== valueCol),
    PRODUCT_PATTERNS
  );
  const categoryCol = matchColumn(
    columns.filter((c) => c !== dateCol && c !== valueCol && c !== productCol),
    CATEGORY_PATTERNS
  );

  return { dateCol, valueCol, productCol, categoryCol };
}
