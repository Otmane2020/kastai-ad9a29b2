/**
 * CopilotInline — compact contextual AI assistant block
 * Displayed below charts and key sections on Forecast, Dashboard, Alerts pages.
 * Matches the design in the mockup: dark card with animated dot, model badge,
 * suggested message, input field, and quick-action chips.
 */
import { useState, useRef, useEffect } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotInlineProps {
  /** Context passed to the AI (chart data summary, metrics, etc.) */
  context: string;
  /** Initial auto-generated insight shown when the component mounts */
  insight?: string;
  /** Quick-action chips */
  chips?: string[];
  className?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Simple rule-based response engine (swap with Claude API call when ready)
function generateResponse(input: string, context: string): string {
  const low = input.toLowerCase();
  if (low.includes("tendance") || low.includes("trend"))
    return `D'après le contexte : "${context.slice(0, 120)}…", la tendance détectée est légèrement haussière sur les 3 derniers mois. Je recommande de maintenir les niveaux de stock actuels avec un buffer de +10%.`;
  if (low.includes("promo") || low.includes("événement"))
    return `Les promotions passées ont généré un uplift moyen de +18% sur la période concernée. Pensez à créer un événement dans l'onglet Événements & Promos pour l'intégrer au moteur de prévision.`;
  if (low.includes("anomal") || low.includes("alerte"))
    return `Je détecte 2 anomalies potentielles dans la série : un pic en octobre (+2.3σ) et une chute en janvier (-1.8σ). Ces écarts peuvent s'expliquer par des effets saisonniers ou des ruptures de stock.`;
  if (low.includes("modèle") || low.includes("mape") || low.includes("précision"))
    return `Le meilleur modèle sélectionné par le backtesting (80/20) minimise le MAPE. Un MAPE < 10% est excellent, entre 10-20% acceptable, > 20% indique un jeu de données difficile ou trop court.`;
  if (low.includes("stock") || low.includes("rupture"))
    return `En croisant les prévisions avec les délais fournisseurs, 3 SKUs risquent une rupture dans les 45 jours. Voulez-vous que je génère un plan de réapprovisionnement ?`;
  if (low.includes("impact") || low.includes("ca") || low.includes("chiffre"))
    return `L'impact CA estimé de cet ajustement est +€42k sur le trimestre. Cela représente +3.2% par rapport au budget initial. La marge opérationnelle reste stable.`;
  return `Analyse en cours sur le contexte fourni... Sur la base des données historiques et du modèle sélectionné, la prévision semble cohérente avec les tendances passées. Souhaitez-vous approfondir un aspect spécifique ?`;
}

export default function CopilotInline({ context, insight, chips = ["Impact promo", "Anomalies", "Tendance", "Stocks"], className }: CopilotInlineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Show initial insight as first assistant message
  useEffect(() => {
    if (insight) {
      setMessages([{ role: "assistant", content: insight }]);
    }
  }, [insight]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: generateResponse(msg, context) }]);
      setIsTyping(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className={cn("rounded-2xl bg-[#0f172a] border border-[#1e293b] overflow-hidden", className)}>
      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="font-semibold text-white text-sm">Copilot — Demand</span>
        <span className="ml-1 rounded-full bg-[#1e293b] border border-[#334155] px-2 py-0.5 text-[10px] text-slate-400 font-medium">
          Claude Sonnet 4
        </span>
        <span className="ml-auto text-slate-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <>
          {/* Messages */}
          <div className="px-5 pb-4 space-y-3 max-h-56 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-[#1e293b] text-slate-200"
                    : "bg-indigo-600 text-white rounded-br-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="flex gap-1 rounded-xl bg-[#1e293b] px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 rounded-xl bg-[#1e293b] border border-[#334155] px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Analyser la demande..."
                className="flex-1 bg-transparent text-sm text-slate-300 placeholder:text-slate-500 outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-40 transition-opacity hover:bg-indigo-500"
              >
                <SendHorizonal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                className="rounded-full border border-[#334155] bg-[#1e293b] px-3 py-1 text-xs text-slate-400 hover:bg-[#334155] hover:text-slate-200 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
