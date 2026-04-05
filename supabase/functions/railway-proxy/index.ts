import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RAILWAY_API_URL = Deno.env.get("RAILWAY_API_URL");
    if (!RAILWAY_API_URL) throw new Error("RAILWAY_API_URL is not configured");

    const body = await req.json();
    const { endpoint, method = "POST", payload } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedEndpoints = ["/api/forecast", "/api/upload", "/api/kpi", "/api/alerts", "/health"];
    if (!allowedEndpoints.some(e => endpoint.startsWith(e))) {
      return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUrl = `${RAILWAY_API_URL.replace(/\/$/, "")}${endpoint}`;

    // Special handling for /api/upload: convert CSV content to multipart file upload
    if (endpoint === "/api/upload" && payload?.file_content_csv) {
      const csvContent = payload.file_content_csv;
      const fileName = payload.file_name || "data.csv";

      const formData = new FormData();
      const blob = new Blob([csvContent], { type: "text/csv" });
      formData.append("file", blob, fileName.replace(/\.(xlsx|xls)$/i, ".csv"));

      // Append other fields the Railway API might expect
      if (payload.mapping) formData.append("mapping", JSON.stringify(payload.mapping));
      if (payload.all_columns) formData.append("all_columns", JSON.stringify(payload.all_columns));
      if (payload.context_columns) formData.append("context_columns", JSON.stringify(payload.context_columns));
      if (payload.business_context) formData.append("business_context", payload.business_context);
      if (payload.granularity) formData.append("granularity", payload.granularity);
      if (payload.forecast_targets) formData.append("forecast_targets", JSON.stringify(payload.forecast_targets));
      if (payload.date_range) formData.append("date_range", JSON.stringify(payload.date_range));
      if (payload.total_rows) formData.append("total_rows", String(payload.total_rows));

      // Send explicit column names so the server doesn't auto-detect wrong ones
      if (payload.mapping?.dateCol) formData.append("date_column", payload.mapping.dateCol);
      if (payload.mapping?.revenueCol) formData.append("value_column", payload.mapping.revenueCol);
      if (payload.mapping?.quantityCol) formData.append("quantity_column", payload.mapping.quantityCol);
      if (payload.mapping?.productCol) formData.append("product_column", payload.mapping.productCol);
      if (payload.mapping?.categoryCol || payload.mapping?.familyCol) formData.append("category_column", payload.mapping.categoryCol || payload.mapping.familyCol);
      if (payload.mapping?.subfamilyCol) formData.append("subfamily_column", payload.mapping.subfamilyCol);
      // Also send as target_column for APIs that use that name
      const targetCol = payload.mapping?.revenueCol || payload.mapping?.valueCol || payload.mapping?.quantityCol;
      if (targetCol) formData.append("target_column", targetCol);

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard JSON proxy
    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (method === "POST" && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(apiUrl, fetchOptions);
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("railway-proxy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
