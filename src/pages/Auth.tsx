import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Loader2, Mail, Lock, User, BarChart3, Brain, Zap, ShieldCheck, TrendingUp, Layers } from "lucide-react";
import logoKastAi from "@/assets/logo-kast-ai.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NAVY = "#0D2B55";
const BLUE = "#2B7FE0";
const CYAN = "#06B6D4";

const features = [
  { icon: Brain,      label: "13 modèles IA",          color: BLUE  },
  { icon: BarChart3,  label: "Backtesting 80/20",       color: NAVY  },
  { icon: TrendingUp, label: "Multi-niveaux SKU",        color: CYAN  },
  { icon: Zap,        label: "Copilot IA intégré",      color: BLUE  },
  { icon: Layers,     label: "Événements & Promos",     color: NAVY  },
  { icon: ShieldCheck,label: "Workspaces sécurisés",    color: CYAN  },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Inscription réussie !", description: "Vérifiez votre email pour confirmer votre compte." });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 bg-white border-r border-slate-100 relative overflow-hidden">

        {/* Subtle background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle, ${BLUE}, transparent)` }} />
          <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full opacity-[0.05]"
            style={{ background: `radial-gradient(circle, ${CYAN}, transparent)` }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <img src={logoKastAi} alt="KastAI" className="h-11 w-auto object-contain" />
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight" style={{ color: NAVY }}>
              Prévisions de demande
              <br />
              <span style={{ color: BLUE }}>pilotées par l'IA</span>
            </h1>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: "#4A6080" }}>
              13 modèles en compétition, backtesting automatique, précision maximale.
            </p>
          </div>

          {/* Feature grid — icon + label only */}
          <div className="grid grid-cols-2 gap-2.5">
            {features.map((f) => (
              <div key={f.label}
                className="flex items-center gap-2.5 rounded-xl border px-3.5 py-3 bg-white hover:shadow-sm transition-shadow"
                style={{ borderColor: `${f.color}22` }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}12` }}>
                  <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: NAVY }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex items-center gap-8 rounded-2xl px-6 py-4 border"
          style={{ borderColor: `${BLUE}20`, background: `${BLUE}06` }}>
          {[["13", "Modèles ML"], ["< 5%", "MAPE"], ["80/20", "Backtesting"], ["∞", "Données"]].map(([v, l]) => (
            <div key={l} className="flex-1 text-center">
              <p className="text-xl font-bold" style={{ color: NAVY }}>{v}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6A80A0" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src={logoKastAi} alt="KastAI" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-full max-w-sm space-y-6">

          <div className="space-y-1">
            <h2 className="text-2xl font-bold" style={{ color: NAVY }}>
              {isLogin ? "Bon retour" : "Créer un compte"}
            </h2>
            <p className="text-sm text-slate-500">
              {isLogin ? "Connectez-vous à votre espace." : "Rejoignez KastAI gratuitement."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" required />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" required />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">Mot de passe</label>
                  {isLogin && (
                    <button type="button" className="text-xs hover:underline" style={{ color: BLUE }}>
                      Oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold text-white rounded-xl transition-all"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${NAVY})` }} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : isLogin
                  ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {isLogin ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <p className="text-center text-sm text-slate-500">
              {isLogin ? "Pas de compte ?" : "Déjà inscrit ?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)}
                className="font-semibold hover:underline" style={{ color: BLUE }}>
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400">
            En continuant, vous acceptez nos{" "}
            <span className="hover:underline cursor-pointer" style={{ color: BLUE }}>CGU</span>{" "}et notre{" "}
            <span className="hover:underline cursor-pointer" style={{ color: BLUE }}>Politique de confidentialité</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
