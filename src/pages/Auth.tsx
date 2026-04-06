import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  LogIn, UserPlus, Loader2, Mail, Lock, User,
  BarChart3, Brain, Zap, ShieldCheck, TrendingUp, Layers
} from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import logoKastAi from "@/assets/logo-kast-ai.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ── Feature highlights ─────────────────────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    color: "text-violet-600 bg-violet-50",
    title: "13 modèles IA",
    desc: "ARIMA, Prophet, XGBoost, LSTM, Holt-Winters… sélection automatique du meilleur modèle.",
  },
  {
    icon: BarChart3,
    color: "text-blue-600 bg-blue-50",
    title: "Backtesting automatique",
    desc: "Validation 80/20 sur vos données historiques avec MAPE, biais et RMSE.",
  },
  {
    icon: TrendingUp,
    color: "text-emerald-600 bg-emerald-50",
    title: "Prévision multi-niveaux",
    desc: "Global, SKU, famille, sous-famille — horizon jusqu'à 24 mois.",
  },
  {
    icon: Zap,
    color: "text-amber-600 bg-amber-50",
    title: "Copilot IA intégré",
    desc: "Analyse contextuelle, recommandations et alertes en temps réel.",
  },
  {
    icon: Layers,
    color: "text-pink-600 bg-pink-50",
    title: "Événements & Promos",
    desc: "Intégrez promos, saisonnalités et lancements pour affiner vos prévisions.",
  },
  {
    icon: ShieldCheck,
    color: "text-teal-600 bg-teal-50",
    title: "Workspaces sécurisés",
    desc: "Plusieurs projets, un seul compte. Données isolées et chiffrées.",
  },
];

/* ── Stats bar ──────────────────────────────────────────────────────────────── */
const stats = [
  { value: "13", label: "Modèles ML" },
  { value: "< 5%", label: "MAPE moyen" },
  { value: "80/20", label: "Backtesting auto" },
  { value: "∞", label: "Données illimitées" },
];

/* ── Main component ─────────────────────────────────────────────────────────── */
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
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Inscription réussie !", description: "Vérifiez votre email pour confirmer votre compte." });
      }
    } catch (err: any) {
      toast({ title: "Erreur d'authentification", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex">

      {/* ── Left panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <img src={logoKastAi} alt="KastAI" className="h-12 w-auto object-contain brightness-0 invert" />
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-indigo-100 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Moteur de prévision intelligent
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Prévisions de demande
              <br />
              <span className="text-indigo-200">pilotées par l'IA</span>
            </h1>
            <p className="text-lg text-indigo-100/80 max-w-md leading-relaxed">
              Importez vos données, laissez nos 13 modèles s'entraîner automatiquement et obtenez des prévisions précises en quelques minutes.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 space-y-2 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <f.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">{f.title}</span>
                </div>
                <p className="text-xs text-indigo-200/80 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10">
          <div className="flex items-center gap-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-6 py-4">
            {stats.map((s, i) => (
              <div key={i} className="flex-1 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-indigo-200/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-indigo-300/60">
            © {new Date().getFullYear()} KastAI · Plateforme de demand forecasting
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src={logoKastAi} alt="KastAI" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-full max-w-sm space-y-8">

          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">
              {isLogin ? "Bon retour 👋" : "Créer un compte"}
            </h2>
            <p className="text-sm text-slate-500">
              {isLogin
                ? "Connectez-vous pour accéder à votre espace de prévisions."
                : "Rejoignez KastAI et optimisez votre gestion de la demande."}
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Jean Dupont"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">Mot de passe</label>
                  {isLogin && (
                    <button type="button" className="text-xs text-indigo-600 hover:underline">
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder={isLogin ? "••••••••" : "Minimum 6 caractères"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isLogin ? (
                  <LogIn className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {isLogin ? "Se connecter" : "Créer mon compte gratuitement"}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">ou</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-slate-500">
              {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                {isLogin ? "S'inscrire gratuitement" : "Se connecter"}
              </button>
            </p>
          </div>

          {/* Mobile feature pills */}
          <div className="lg:hidden flex flex-wrap justify-center gap-2">
            {["13 modèles ML", "Backtesting auto", "Copilot IA", "Workspaces"].map((f) => (
              <span key={f} className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-600">
                {f}
              </span>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400">
            En vous connectant, vous acceptez nos{" "}
            <span className="text-indigo-600 hover:underline cursor-pointer">Conditions d'utilisation</span>
            {" "}et notre{" "}
            <span className="text-indigo-600 hover:underline cursor-pointer">Politique de confidentialité</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
