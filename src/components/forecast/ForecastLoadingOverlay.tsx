import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, BarChart3, LineChart, Activity,
  Cpu, Sparkles, Zap, ChartNoAxesCombined, Target,
  GitBranch, Layers, Gauge
} from "lucide-react";

const MODELS = [
  { name: "ARIMA", icon: TrendingUp, type: "Statistique" },
  { name: "SARIMA", icon: Activity, type: "Statistique saisonnier" },
  { name: "Prophet", icon: Sparkles, type: "Facebook Prophet" },
  { name: "XGBoost", icon: Zap, type: "Machine Learning" },
  { name: "RandomForest", icon: GitBranch, type: "Machine Learning" },
  { name: "GradientBoosting", icon: Layers, type: "Machine Learning" },
  { name: "Ridge", icon: Target, type: "ML Régression" },
  { name: "LSTM", icon: Brain, type: "Deep Learning" },
  { name: "SES", icon: LineChart, type: "Lissage simple" },
  { name: "Holt", icon: BarChart3, type: "Lissage double" },
  { name: "Holt-Winters", icon: ChartNoAxesCombined, type: "Lissage triple" },
  { name: "Theta", icon: Gauge, type: "Méthode Theta" },
  { name: "SeasonalNaive", icon: Cpu, type: "Baseline" },
];

export default function ForecastLoadingOverlay() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedModels, setCompletedModels] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"models" | "backtest" | "selecting">("models");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = prev + 1;
        setCompletedModels((s) => new Set([...s, prev]));
        if (next >= MODELS.length) {
          clearInterval(interval);
          setTimeout(() => setPhase("backtest"), 300);
          setTimeout(() => setPhase("selecting"), 1800);
        }
        return next;
      });
    }, 350);
    return () => clearInterval(interval);
  }, []);

  const progress = phase === "selecting" ? 100 : phase === "backtest" ? 85 : Math.round((completedModels.size / MODELS.length) * 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg mx-4"
      >
        {/* Glowing background orb */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/20 blur-[80px] animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-accent/15 blur-[60px] animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-8 shadow-2xl">
          {/* App icon + title */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <Brain className="h-8 w-8 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-success-foreground" />
                </div>
              </div>
            </motion.div>
            <h2 className="text-lg font-display font-bold text-foreground">
              {phase === "models" && "Exécution des modèles IA"}
              {phase === "backtest" && "Backtesting 80/20…"}
              {phase === "selecting" && "Sélection du meilleur modèle…"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {phase === "models" && `${completedModels.size} / ${MODELS.length} modèles`}
              {phase === "backtest" && "Validation croisée en cours"}
              {phase === "selecting" && "Minimisation du MAPE"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-6">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white/20"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "30%" }}
            />
          </div>

          {/* Model grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {MODELS.map((model, i) => {
              const Icon = model.icon;
              const isDone = completedModels.has(i);
              const isActive = activeIdx === i;
              return (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0.3, scale: 0.9 }}
                  animate={{
                    opacity: isDone ? 1 : isActive ? 1 : 0.3,
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`relative flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors ${
                    isDone
                      ? "bg-success/10 border border-success/30"
                      : isActive
                      ? "bg-primary/10 border border-primary/40"
                      : "bg-muted/50 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isDone ? "text-success" : isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[9px] font-semibold leading-tight ${isDone ? "text-success" : isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {model.name}
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success flex items-center justify-center"
                    >
                      <span className="text-[7px] text-success-foreground font-bold">✓</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Active model detail */}
          <AnimatePresence mode="wait">
            {phase === "models" && activeIdx < MODELS.length && (
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>
                  <span className="font-semibold text-foreground">{MODELS[activeIdx].name}</span>
                  {" — "}
                  {MODELS[activeIdx].type}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase indicator */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {(["models", "backtest", "selecting"] as const).map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  phase === p ? "bg-primary animate-pulse" : completedModels.size === MODELS.length && p === "models" ? "bg-success" : "bg-muted-foreground/30"
                }`} />
                <span className={`text-[10px] font-medium ${phase === p ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {p === "models" ? "Modèles" : p === "backtest" ? "Backtest" : "Sélection"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
