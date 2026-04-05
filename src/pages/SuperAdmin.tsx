import { useState } from "react";
import { SlidersHorizontal, ServerCog, CircleCheck, CircleX, Wifi, WifiOff, RotateCw, SaveAll } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

interface ServerConfig {
  url: string;
  apiKey: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  lastPing: string | null;
  version: string | null;
}

export default function SuperAdmin() {
  const [config, setConfig] = useState<ServerConfig>({
    url: localStorage.getItem("kastai_server_url") || "http://localhost:8000",
    apiKey: localStorage.getItem("kastai_server_key") || "",
    status: "disconnected",
    lastPing: null,
    version: null,
  });

  const [models, setModels] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

  const testConnection = async () => {
    setConfig((prev) => ({ ...prev, status: "connecting" }));
    addLog(`Connexion à ${config.url}...`);

    try {
      const res = await fetch(`${config.url}/health`, {
        method: "GET",
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setConfig((prev) => ({
          ...prev,
          status: "connected",
          lastPing: new Date().toLocaleTimeString(),
          version: data.version || "unknown",
        }));
        setModels(data.models || ["ARIMA", "Prophet", "XGBoost", "LSTM"]);
        addLog(`Connecté — version ${data.version || "?"}`);
      } else {
        setConfig((prev) => ({ ...prev, status: "error", lastPing: null }));
        addLog(`Erreur ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      setConfig((prev) => ({ ...prev, status: "error", lastPing: null }));
      addLog(`Connexion échouée: ${err.message || "timeout"}`);
    }
  };

  const saveConfig = () => {
    localStorage.setItem("kastai_server_url", config.url);
    localStorage.setItem("kastai_server_key", config.apiKey);
    addLog("💾 Configuration sauvegardée");
  };

  const statusInfo = {
    disconnected: { color: "text-muted-foreground", bg: "bg-muted", label: "Non connecté", icon: WifiOff },
    connecting: { color: "text-primary", bg: "bg-primary/10", label: "Connexion...", icon: RotateCw },
    connected: { color: "text-success", bg: "bg-success/10", label: "Connecté", icon: Wifi },
    error: { color: "text-destructive", bg: "bg-destructive/10", label: "Erreur", icon: CircleX },
  }[config.status];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Super Admin"
        description="Configuration du serveur Python de prévisions avancées"
        icon={<SlidersHorizontal className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ServerCog config */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-card-foreground flex items-center gap-2">
                <ServerCog className="h-4 w-4 text-primary" />
                Serveur Python (FastAPI)
              </h3>
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                <statusInfo.icon className={cn("h-3 w-3", config.status === "connecting" && "animate-spin")} />
                {statusInfo.label}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-card-foreground mb-1.5 block">URL du serveur</label>
                <input
                  type="url"
                  value={config.url}
                  onChange={(e) => setConfig((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="http://localhost:8000"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
                <p className="text-xs text-muted-foreground mt-1">Ex: http://localhost:8000, https://api.kastai.com</p>
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground mb-1.5 block">Clé API (optionnel)</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={testConnection}
                  disabled={config.status === "connecting"}
                  className="flex items-center gap-2 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <RotateCw className={cn("h-4 w-4", config.status === "connecting" && "animate-spin")} />
                  Tester la connexion
                </button>
                <button
                  onClick={saveConfig}
                  className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <SaveAll className="h-4 w-4" />
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>

          {/* Connection info */}
          {config.status === "connected" && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CircleCheck className="h-5 w-5 text-success" />
                <h3 className="font-display text-sm font-semibold text-card-foreground">Serveur connecté</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="font-medium text-card-foreground">{config.version}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dernier ping</p>
                  <p className="font-medium text-card-foreground">{config.lastPing}</p>
                </div>
              </div>
              {models.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Modèles disponibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {models.map((m) => (
                      <span key={m} className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Endpoints doc */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-sm font-semibold text-card-foreground mb-3">Endpoints attendus</h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                { method: "GET", path: "/health", desc: "Test connexion + version" },
                { method: "POST", path: "/api/upload", desc: "Upload et mapping CSV/Excel" },
                { method: "POST", path: "/api/forecast", desc: "Lancer les prévisions (ARIMA, Prophet...)" },
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
              <p className="text-sidebar-foreground/50">En attente de connexion...</p>
            ) : (
              logs.map((log, i) => <p key={i}>{log}</p>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
