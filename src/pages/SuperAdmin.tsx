import { useState, useEffect } from "react";
import { SlidersHorizontal, ServerCog, CircleCheck, CircleX, Wifi, WifiOff, RotateCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ServerStatus {
  status: "disconnected" | "connecting" | "connected" | "error";
  lastPing: string | null;
  version: string | null;
  models: string[];
  error: string | null;
}

async function callProxy(endpoint: string, method = "GET") {
  const { data, error } = await supabase.functions.invoke("railway-proxy", {
    body: { endpoint, method, payload: null },
  });
  if (error) throw new Error(error.message);
  return data;
}

export default function SuperAdmin() {
  const [server, setServer] = useState<ServerStatus>({
    status: "disconnected",
    lastPing: null,
    version: null,
    models: [],
    error: null,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  const testConnection = async () => {
    setServer((p) => ({ ...p, status: "connecting", error: null }));
    addLog("Connexion au serveur Railway via proxy…");

    try {
      const data = await callProxy("/health", "GET");
      setServer({
        status: "connected",
        lastPing: new Date().toLocaleTimeString(),
        version: data?.version || "unknown",
        models: data?.models || [],
        error: null,
      });
      addLog(`✅ Connecté — version ${data?.version || "?"}, ${(data?.models || []).length} modèles`);
    } catch (err: any) {
      setServer((p) => ({ ...p, status: "error", error: err.message }));
      addLog(`❌ Erreur: ${err.message}`);
    }
  };

  // Auto-test on mount
  useEffect(() => {
    testConnection();
  }, []);

  const statusInfo = {
    disconnected: { color: "text-muted-foreground", bg: "bg-muted", label: "Non connecté", Icon: WifiOff },
    connecting: { color: "text-primary", bg: "bg-primary/10", label: "Connexion…", Icon: RotateCw },
    connected: { color: "text-success", bg: "bg-success/10", label: "Connecté", Icon: Wifi },
    error: { color: "text-destructive", bg: "bg-destructive/10", label: "Erreur", Icon: CircleX },
  }[server.status];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Super Admin"
        description="Statut du serveur Python de prévisions avancées (Railway)"
        icon={<SlidersHorizontal className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status card */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
                <ServerCog className="h-4 w-4 text-primary" />
                Serveur Python (FastAPI — Railway)
              </h3>
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                <statusInfo.Icon className={cn("h-3 w-3", server.status === "connecting" && "animate-spin")} />
                {statusInfo.label}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              La connexion passe par un proxy sécurisé (edge function). Aucune clé API n'est nécessaire côté client.
            </p>

            <button
              onClick={testConnection}
              disabled={server.status === "connecting"}
              className="flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <RotateCw className={cn("h-4 w-4", server.status === "connecting" && "animate-spin")} />
              Tester la connexion
            </button>

            {server.error && (
              <p className="mt-3 text-xs text-destructive">{server.error}</p>
            )}
          </div>

          {/* Connection details */}
          {server.status === "connected" && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CircleCheck className="h-5 w-5 text-success" />
                <h3 className="font-display text-sm font-semibold text-card-foreground">Serveur connecté</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="font-medium text-card-foreground">{server.version}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernier ping</p>
                  <p className="font-medium text-card-foreground">{server.lastPing}</p>
                </div>
              </div>
              {server.models.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Modèles disponibles ({server.models.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {server.models.map((m) => (
                      <span key={m} className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Endpoints doc */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Endpoints disponibles</h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                { method: "GET", path: "/health", desc: "Test connexion + version" },
                { method: "POST", path: "/api/upload", desc: "Upload et mapping CSV/Excel" },
                { method: "POST", path: "/api/forecast", desc: "Lancer les prévisions (13 modèles)" },
                { method: "GET", path: "/api/kpi", desc: "KPI et métriques de performance" },
                { method: "GET", path: "/api/alerts", desc: "Alertes et anomalies détectées" },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold",
                    ep.method === "GET" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                  )}>
                    {ep.method}
                  </span>
                  <span className="text-card-foreground">{ep.path}</span>
                  <span className="ml-auto text-muted-foreground font-sans">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Journal de connexion</h3>
          <div className="h-[500px] overflow-y-auto rounded-lg bg-sidebar p-4 font-mono text-xs text-sidebar-foreground space-y-1">
            {logs.length === 0 ? (
              <p className="text-sidebar-foreground/50">En attente de connexion…</p>
            ) : (
              logs.map((log, i) => <p key={i}>{log}</p>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
