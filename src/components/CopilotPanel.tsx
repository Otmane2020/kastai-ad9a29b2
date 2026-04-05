import { useState, useRef, useEffect } from "react";
import { MessageSquare, SendHorizonal, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const pageContext: Record<string, string> = {
  "/": "Dashboard principal - vue d'ensemble des KPIs et performances",
  "/forecast": "Module de prévisions - visualisation des forecasts",
  "/alerts": "Alertes et recommandations - détection d'anomalies",
  "/kpi": "KPI et rapports - analyse de performance",
  "/finance": "Finance - prévision du chiffre d'affaires",
  "/sop": "S&OP - alignement ventes/production",
  "/inventory": "Optimisation des stocks",
  "/connectors": "Connecteurs - import/export de données",
  "/users": "Gestion des utilisateurs",
};

const smartResponses: Record<string, string[]> = {
  prévision: [
    "D'après les données récentes, la tendance est haussière avec une croissance projetée de +12% sur le prochain trimestre. Le modèle Prophet montre la meilleure précision (MAPE: 4.2%).",
  ],
  ventes: [
    "Les ventes ont augmenté de 8.3% ce mois-ci. Les produits électroniques tirent la croissance. Je recommande d'augmenter le stock de la catégorie A de 15%.",
  ],
  stock: [
    "3 produits sont en risque de rupture dans les 7 prochains jours. Je recommande un réapprovisionnement immédiat pour les SKU #1042, #2087 et #3156.",
  ],
  default: [
    "Je suis le Copilot IA de Kast. Je peux analyser vos données, expliquer les prévisions, et proposer des actions concrètes. Que souhaitez-vous savoir ?",
    "Bonne question ! En analysant vos données historiques, je détecte une saisonnalité marquée. Voulez-vous que je génère un rapport détaillé ?",
    "D'après mes modèles, voici ce que je recommande : optimiser vos niveaux de stock et ajuster vos prévisions de ventes pour le prochain trimestre.",
  ],
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, responses] of Object.entries(smartResponses)) {
    if (key !== "default" && lower.includes(key)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return smartResponses.default[Math.floor(Math.random() * smartResponses.default.length)];
}

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const ctx = pageContext[location.pathname] || "";
      const response = getResponse(input);
      const contextual = ctx ? `\n\n_Contexte: ${ctx}_` : "";
      setMessages((prev) => [...prev, { role: "assistant", content: response + contextual }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-[380px] flex-col border-l border-border bg-card shadow-elevated animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Copilot IA</p>
            <p className="text-xs text-muted-foreground">Assistant contextuel</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary animate-pulse-glow">
              <MessageSquare className="h-7 w-7 text-primary-foreground" />
            </div>
            <p className="font-display text-sm font-semibold text-foreground">Bonjour ! Je suis votre Copilot IA</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-[240px]">
              Posez-moi une question sur vos prévisions, ventes, stocks ou performances.
            </p>
            <div className="mt-4 space-y-2 w-full">
              {["Pourquoi les ventes baissent ?", "Quel est le meilleur modèle de prévision ?", "Risques de rupture de stock ?"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-left text-xs text-foreground hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Posez votre question..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
