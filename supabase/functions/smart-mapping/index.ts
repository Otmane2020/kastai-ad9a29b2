import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { columns, sampleRows, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a data analyst expert. Analyze this CSV/Excel file and map the columns intelligently.

File name: "${fileName}"
Columns: ${JSON.stringify(columns)}
First 2 rows of data:
${JSON.stringify(sampleRows, null, 2)}

Your task:
1. Identify which column contains DATES (timestamps, periods, months, years)
2. Identify which column contains the main NUMERIC VALUE to forecast (sales, revenue, quantity, amount)
3. Identify which column contains REVENUE / CA (chiffre d'affaires, montant, turnover)
4. Identify which column contains QUANTITY (quantité, volume, units, pièces)
5. Identify which column contains PRODUCT/SKU identifiers (product name, SKU, item, reference)
6. Identify which column contains CATEGORY (catégorie, type, segment)
7. Identify which column contains FAMILY (famille, product family, gamme)
8. Identify which column contains SUBFAMILY (sous-famille, sub-family, sous-gamme)
9. Identify ALL other columns and their semantic role (price, promo, region, store, channel, cost, margin, etc.)
10. Describe the business context of this dataset in 1-2 sentences
11. Suggest the best forecasting granularity: "global", "sku", "family", or "subfamily"

Be smart: a column named "Mois" is a date, "CA" is revenue, "Réf" is a product reference, "Qté" is quantity, "Promo" is a promotion flag, etc.
Consider the actual data values, not just column names.
ALL other columns (price, promo, region, discount, etc.) should be included as context for forecasting regressors.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a data mapping expert. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "map_columns",
              description: "Return the intelligent column mapping for a dataset",
              parameters: {
                type: "object",
                properties: {
                  dateCol: { type: "string", description: "Column name for dates/periods. null if not found." },
                  valueCol: { type: "string", description: "Column name for the main numeric value to forecast." },
                  revenueCol: { type: "string", description: "Column for revenue/CA/turnover. null if not found." },
                  quantityCol: { type: "string", description: "Column for quantity/volume. null if not found." },
                  productCol: { type: "string", description: "Column name for product/SKU identifiers. null if not found." },
                  categoryCol: { type: "string", description: "Column name for category. null if not found." },
                  familyCol: { type: "string", description: "Column name for product family. null if not found." },
                  subfamilyCol: { type: "string", description: "Column name for sub-family. null if not found." },
                  allColumns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string", enum: ["date", "value", "revenue", "quantity", "product", "category", "family", "subfamily", "price", "promo", "discount", "region", "store", "channel", "cost", "margin", "other"] },
                        description: { type: "string" },
                      },
                      required: ["name", "role", "description"],
                      additionalProperties: false,
                    },
                  },
                  businessContext: { type: "string", description: "1-2 sentence description of what this dataset represents" },
                  suggestedGranularity: { type: "string", enum: ["global", "sku", "family", "subfamily"] },
                  confidence: { type: "number", description: "Confidence score 0-100 for the mapping" },
                },
                required: ["dateCol", "valueCol", "revenueCol", "quantityCol", "productCol", "categoryCol", "familyCol", "subfamilyCol", "allColumns", "businessContext", "suggestedGranularity", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "map_columns" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No mapping result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapping = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(mapping), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-mapping error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
