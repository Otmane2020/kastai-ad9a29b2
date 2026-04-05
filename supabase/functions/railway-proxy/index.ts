import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-railway-endpoint, x-railway-method",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RAILWAY_API_URL = Deno.env.get("RAILWAY_API_URL");
    if (!RAILWAY_API_URL) throw new Error("RAILWAY_API_URL is not configured");

    const contentType = req.headers.get("content-type") || "";
    const allowedEndpoints = ["/api/forecast", "/api/upload", "/api/kpi", "/api/alerts", "/health"];

    // Route A: multipart/form-data — forward as-is to Railway (for file uploads)
    if (contentType.includes("multipart/form-data")) {
      const endpoint = req.headers.get("x-railway-endpoint") || "/api/upload";
      if (!allowedEndpoints.some(e => endpoint.startsWith(e))) {
        return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const apiUrl = `${RAILWAY_API_URL.replace(/\/$/, "")}${endpoint}`;
      
      // Forward the raw body with original content-type (preserves boundary)
      const body = await req.arrayBuffer();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route B: JSON — original proxy logic
    const body = await req.json();
    const { endpoint, method = "POST", payload } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedEndpoints.some(e => endpoint.startsWith(e))) {
      return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUrl = `${RAILWAY_API_URL.replace(/\/$/, "")}${endpoint}`;
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
