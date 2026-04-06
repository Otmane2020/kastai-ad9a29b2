import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, ShieldAlert, PackageCheck, Layers, Zap,
  Check, ArrowRight, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, FileSpreadsheet, ShoppingCart,
  Star, Quote, Sparkles, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import logoIcon from "@/assets/logo-icon.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── PALETTE ─── */
const C = {
  bgPrimary: "#0B1221",
  bgSecondary: "#162033",
  accent: "#3B82F6",
  accentDeep: "#1D4ED8",
  steel: "#94A3B8",
  azur: "#60A5FA",
  white: "#F8FAFC",
};

/* ─── NAV ─── */
function Nav() {
  const navigate = useNavigate();
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: `${C.bgPrimary}dd`, backdropFilter: "blur(20px)", borderBottom: `1px solid rgba(255,255,255,0.06)` }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <img src={logoIcon} alt="Kast AI" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-lg font-bold" style={{ color: C.white }}>
            Kast<span style={{ color: C.accent }}>AI</span>
          </span>
        </div>
        <div className="hidden items-center gap-8 text-sm md:flex" style={{ color: `${C.steel}` }}>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hover:bg-white/5" style={{ color: C.steel }} onClick={() => navigate("/auth")}>
            Log in
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")}
            style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, boxShadow: `0 4px 20px ${C.accent}33`, letterSpacing: "0.3px" }}
          >
            Start free
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden" style={{ background: C.bgPrimary }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${C.accent}15, transparent)` }} />
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} />

      <div className="relative mx-auto max-w-6xl px-6 pb-32 pt-36 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <Badge className="mb-8 px-5 py-2 text-sm font-medium border-0"
              style={{ background: `${C.accent}15`, color: C.azur }}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" /> 95% forecast accuracy
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp} custom={1}
            className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: C.white }}
          >
            Predict your demand.{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.azur})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Eliminate stockouts.
            </span>{" "}
            Maximize profit.
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed" style={{ color: C.steel }}>
            AI-powered demand forecasting for e-commerce &amp; retail — no data science required.
            Upload your data. Get predictions in minutes.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-10 text-base font-semibold" onClick={() => navigate("/auth")}
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, boxShadow: `0 4px 25px ${C.accent}40`, letterSpacing: "0.3px" }}
            >
              Start forecasting for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="ghost" className="h-13 px-8 text-base font-semibold"
              style={{ color: C.steel, border: `1px solid rgba(255,255,255,0.1)` }}
            >
              <Upload className="mr-2 h-4 w-4" /> Upload your data
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-10 flex items-center justify-center gap-8 text-sm" style={{ color: `${C.steel}99` }}>
            {["No credit card", "14-day free trial", "Setup in 2 min"].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4" style={{ color: C.azur }} /> {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: `linear-gradient(to top, ${C.bgPrimary}, transparent)` }} />
    </section>
  );
}

/* ─── PROBLEM ─── */
const problems = [
  { icon: FileSpreadsheet, title: "Excel forecasting", desc: "Manual spreadsheets = human error, outdated models, zero scalability." },
  { icon: AlertTriangle, title: "Stockouts", desc: "Lost sales, frustrated customers, damaged brand reputation." },
  { icon: DollarSign, title: "Overstock", desc: "Cash locked in dead inventory. Warehousing costs eating your margins." },
];

function Problem() {
  return (
    <section className="py-28" style={{ background: C.bgPrimary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "#EF4444" }}>The problem</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Still relying on intuition to plan demand?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl leading-relaxed" style={{ color: C.steel }}>
            Most businesses still use Excel or gut feeling. This leads to overstock, lost sales, and poor cash flow.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-16 grid gap-6 md:grid-cols-3">
          {problems.map((p, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="group rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: `${C.bgSecondary}B3`, backdropFilter: "blur(12px)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
                <p.icon className="h-5 w-5" style={{ color: "#EF4444" }} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-lg font-semibold" style={{ color: C.white }}>{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: C.steel }}>{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── SOLUTION ─── */
function Solution() {
  return (
    <section className="py-28" style={{ background: C.bgSecondary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>The solution</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            AI that predicts your sales — automatically
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-2xl leading-relaxed" style={{ color: C.steel }}>
            Kast AI uses 13 advanced forecasting models to predict your future demand with high accuracy.
            No setup. No code. Just upload and forecast.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mx-auto mt-16 max-w-3xl rounded-2xl p-8"
          style={{ background: `${C.bgPrimary}B3`, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, boxShadow: `0 8px 30px ${C.accent}30` }}
            >
              <img src={logoIcon} alt="" className="h-9 w-9 rounded-lg" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold" style={{ color: C.white }}>How it works</h3>
              <div className="mt-5 space-y-4">
                {[
                  "Upload your CSV, Excel, or connect Shopify",
                  "AI automatically tests 13 models (ARIMA, Prophet, XGBoost, LSTM…)",
                  "Backtesting selects the most accurate model",
                  "Get forecasts, alerts, and recommendations instantly"
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: `${C.accent}20`, color: C.azur }}
                    >{i + 1}</span>
                    <p className="text-sm leading-relaxed" style={{ color: C.steel }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
const features = [
  { icon: BarChart3, title: "AI Forecasting", desc: "13 models compete. The best wins. Automatic model selection based on your data patterns." },
  { icon: Zap, title: "Backtesting & Accuracy", desc: "80/20 split backtesting with MAPE optimization. Know your forecast precision." },
  { icon: ShieldAlert, title: "Smart Alerts", desc: "Real-time stockout & overstock risk detection. Never miss a critical threshold." },
  { icon: PackageCheck, title: "Order Recommendations", desc: "Know what to order, how much, and when. AI-driven purchasing suggestions." },
  { icon: Layers, title: "S&OP Integration", desc: "Connect forecasts to inventory, production, and financial planning." },
  { icon: ShoppingCart, title: "Multi-channel", desc: "Shopify, CSV, Excel, ERP. Import from anywhere and forecast all channels." },
];

function Features() {
  return (
    <section id="features" className="py-28" style={{ background: C.bgPrimary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>Features</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Everything you need to master demand
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="group rounded-2xl p-7 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `rgba(22, 32, 51, 0.7)`,
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
              }}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300"
                style={{ background: `${C.accent}12` }}
              >
                <f.icon className="h-5 w-5 transition-colors" style={{ color: C.azur }} strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-base font-semibold" style={{ color: C.white }}>{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: C.steel }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── DASHBOARD PREVIEW ─── */
function DashboardPreview() {
  return (
    <section className="py-28" style={{ background: C.bgSecondary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>Dashboard</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Your command center for demand planning
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mt-16 rounded-2xl p-2 overflow-hidden"
          style={{ background: `${C.bgPrimary}`, border: "1px solid rgba(255,255,255,0.08)", boxShadow: `0 20px 60px ${C.accent}15` }}
        >
          <div className="rounded-xl p-6" style={{ background: C.bgPrimary }}>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Forecast Accuracy", value: "94.2%", change: "+2.1%" },
                { label: "Revenue Predicted", value: "$1.2M", change: "+18%" },
                { label: "Stockout Risk", value: "3 SKUs", change: "-40%" },
                { label: "Overstock Value", value: "$24K", change: "-22%" },
              ].map((kpi, i) => (
                <motion.div key={i}
                  className="rounded-xl p-4 group cursor-default"
                  style={{ background: `rgba(22, 32, 51, 0.7)`, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}
                  whileHover={{ borderColor: `${C.accent}40` }}
                >
                  <p className="text-xs" style={{ color: C.steel }}>{kpi.label}</p>
                  <p className="mt-1 font-display text-xl font-bold" style={{ color: C.white }}>{kpi.value}</p>
                  <p className="mt-1 text-xs font-medium transition-colors" style={{ color: C.azur }}>
                    {kpi.change}
                  </p>
                </motion.div>
              ))}
            </div>
            {/* Chart area */}
            <div className="rounded-xl p-6 h-64 flex items-end gap-[3px]"
              style={{ background: `rgba(22, 32, 51, 0.7)`, border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {Array.from({ length: 28 }).map((_, i) => {
                const h = 25 + Math.sin(i * 0.4) * 25 + (i > 20 ? 12 : 0);
                const isForecast = i >= 20;
                return (
                  <div key={i} className="flex-1">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        background: isForecast
                          ? `linear-gradient(to top, ${C.accentDeep}90, ${C.accent}90)`
                          : `linear-gradient(to top, ${C.azur}40, ${C.azur}70)`,
                        boxShadow: isForecast ? `0 0 12px ${C.accent}30` : "none",
                        borderTop: isForecast ? `2px dashed ${C.accent}` : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-8 text-xs" style={{ color: `${C.steel}80` }}>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `${C.azur}70` }} /> Historical
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}50` }} /> Forecast
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── RESULTS ─── */
const results = [
  { icon: TrendingDown, value: "-30%", label: "Stockouts reduced" },
  { icon: PackageCheck, value: "-20%", label: "Overstock eliminated" },
  { icon: TrendingUp, value: "+15%", label: "Cash flow improved" },
];

function Results() {
  return (
    <section className="py-28" style={{ background: C.bgPrimary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>Results</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Real impact on your bottom line
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-16 grid gap-8 md:grid-cols-3">
          {results.map((r, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} className="text-center group cursor-default">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: `${C.accent}10` }}
              >
                <r.icon className="h-8 w-8 transition-colors" style={{ color: C.azur }} strokeWidth={1.5} />
              </div>
              <p className="font-display text-5xl font-bold transition-colors group-hover:drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]"
                style={{ color: C.azur }}
              >{r.value}</p>
              <p className="mt-3" style={{ color: C.steel }}>{r.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── SOCIAL PROOF ─── */
const testimonials = [
  { name: "Sarah M.", role: "E-commerce Director", text: "This replaced our Excel forecasting completely. We saved 10+ hours per week.", stars: 5 },
  { name: "Thomas L.", role: "Supply Chain Manager", text: "We finally understand what to order and when. Stockouts dropped by 35%.", stars: 5 },
  { name: "Amira K.", role: "Retail Operations", text: "The AI picks the best model automatically. Our forecast accuracy went from 60% to 94%.", stars: 5 },
];

function SocialProof() {
  return (
    <section className="py-28" style={{ background: C.bgSecondary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>Testimonials</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Loved by e-commerce &amp; retail teams
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="rounded-2xl p-7"
              style={{ background: `rgba(22, 32, 51, 0.7)`, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <Quote className="mb-3 h-5 w-5" style={{ color: `${C.steel}40` }} />
              <p className="text-sm leading-relaxed" style={{ color: `${C.white}dd` }}>{t.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold"
                  style={{ background: `${C.accent}20`, color: C.azur }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.white }}>{t.name}</p>
                  <p className="text-xs" style={{ color: C.steel }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
const plans = [
  {
    name: "Free", price: "0", period: "", badge: "",
    features: ["1 dataset", "1,000 rows", "Basic forecasting", "Simple dashboard"],
    limits: ["No alerts", "No Copilot"],
    cta: "Start free", highlight: false
  },
  {
    name: "Starter", price: "29", period: "/mo", badge: "",
    features: ["3 datasets", "10,000 rows", "Auto forecasting", "Full dashboard", "CSV export", "Shopify integration"],
    limits: ["Copilot +19€"],
    cta: "Get started", highlight: false
  },
  {
    name: "Pro", price: "79", period: "/mo", badge: "Most popular",
    features: ["10 datasets", "100,000 rows", "Advanced backtesting", "Smart alerts", "Order recommendations", "API access", "Copilot AI included"],
    limits: [],
    cta: "Start Pro trial", highlight: true
  },
  {
    name: "Business", price: "199", period: "/mo", badge: "",
    features: ["Unlimited datasets", "Multi-SKU forecast", "S&OP integration", "Multi-users", "3 connectors", "Copilot unlimited", "Priority support"],
    limits: [],
    cta: "Contact sales", highlight: false
  },
];

function Pricing() {
  const navigate = useNavigate();
  return (
    <section id="pricing" className="py-28" style={{ background: C.bgPrimary }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>Pricing</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Simple, transparent pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl" style={{ color: C.steel }}>
            1 stockout avoided = pays your subscription. Start free, upgrade when you're ready.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className={`relative rounded-2xl p-7 transition-all duration-300 ${plan.highlight ? "scale-[1.03]" : "hover:scale-[1.01]"}`}
              style={{
                background: plan.highlight
                  ? `linear-gradient(160deg, ${C.bgSecondary}, ${C.bgPrimary})`
                  : `rgba(22, 32, 51, 0.7)`,
                backdropFilter: "blur(12px)",
                border: plan.highlight
                  ? `1px solid ${C.accent}50`
                  : "1px solid rgba(255,255,255,0.06)",
                boxShadow: plan.highlight ? `0 20px 50px ${C.accent}20` : "0 10px 30px rgba(0,0,0,0.3)"
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1 text-xs font-semibold border-0"
                    style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, color: "white", boxShadow: `0 4px 15px ${C.accent}40` }}
                  >{plan.badge}</Badge>
                </div>
              )}
              <h3 className="font-display text-lg font-semibold" style={{ color: C.white }}>{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold" style={{ color: C.white }}>${plan.price}</span>
                {plan.period && <span className="text-sm" style={{ color: C.steel }}>{plan.period}</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: C.steel }}>
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.azur }} /> {f}
                  </li>
                ))}
                {plan.limits.map((l, j) => (
                  <li key={`l${j}`} className="flex items-start gap-2 text-sm" style={{ color: `${C.steel}60` }}>
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center">—</span> {l}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-7 w-full font-semibold"
                onClick={() => navigate("/auth")}
                style={plan.highlight
                  ? { background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, color: "white", boxShadow: `0 4px 20px ${C.accent}30` }
                  : { background: "rgba(255,255,255,0.05)", color: C.white, border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-10 text-center text-sm" style={{ color: `${C.steel}80` }}>
          14-day free trial on all paid plans · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  { q: "Do I need to code?", a: "Absolutely not. Upload a CSV or connect Shopify, and Kast AI handles everything — model selection, backtesting, and forecasting." },
  { q: "What file formats are supported?", a: "CSV, Excel (.xlsx), and direct Shopify integration. More connectors coming soon." },
  { q: "How accurate are the forecasts?", a: "Up to 95% accuracy. Kast AI runs 13 models in parallel and selects the one with the lowest error (MAPE) via backtesting." },
  { q: "Can I forecast by product / SKU?", a: "Yes! Kast AI supports global, per-SKU, per-family, and per-subfamily granularity." },
  { q: "What is the Copilot?", a: "An AI assistant embedded in your dashboard that answers questions about your sales, inventory, and forecasts in natural language." },
  { q: "Is my data secure?", a: "Yes. All data is encrypted at rest and in transit. We never share your data with third parties." },
];

function FAQ() {
  return (
    <section id="faq" className="py-28" style={{ background: C.bgSecondary }}>
      <div className="mx-auto max-w-3xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: C.azur }}>FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="mt-4 font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
            Frequently asked questions
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-14">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl px-6 border-0"
                style={{ background: `rgba(11, 18, 33, 0.6)`, border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <AccordionTrigger className="text-sm font-semibold hover:no-underline" style={{ color: C.white }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm" style={{ color: C.steel }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-28" style={{ background: C.bgPrimary }}>
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative overflow-hidden rounded-3xl p-14 text-center"
          style={{
            background: `linear-gradient(160deg, ${C.bgSecondary}, ${C.bgPrimary})`,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: `0 30px 80px ${C.accent}15`
          }}
        >
          {/* Glow */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 50% 50% at 50% 110%, ${C.accent}20, transparent)` }} />

          <div className="relative">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${C.accent}15`, backdropFilter: "blur(8px)" }}
            >
              <img src={logoIcon} alt="Kast AI" className="h-10 w-10 rounded-lg" />
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: C.white }}>
              Start forecasting now
            </h2>
            <p className="mx-auto mt-5 max-w-lg leading-relaxed" style={{ color: C.steel }}>
              Join hundreds of e-commerce and retail teams using Kast AI to predict demand, reduce waste, and grow revenue.
            </p>
            <div className="mt-10">
              <Button size="lg" className="h-13 px-12 text-base font-semibold" onClick={() => navigate("/auth")}
                style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`, boxShadow: `0 4px 25px ${C.accent}40` }}
              >
                Get started for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-5 text-xs" style={{ color: `${C.steel}80` }}>No credit card required · Free plan available</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="py-12" style={{ background: C.bgPrimary, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Kast AI" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-bold" style={{ color: C.white }}>
              Kast<span style={{ color: C.accent }}>AI</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm" style={{ color: C.steel }}>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#" className="transition-colors hover:text-white">Documentation</a>
            <a href="#" className="transition-colors hover:text-white">Privacy</a>
            <a href="#" className="transition-colors hover:text-white">Terms</a>
          </div>
          <p className="text-xs" style={{ color: `${C.steel}80` }}>© 2025 Kast AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE ─── */
export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: C.bgPrimary }}>
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <DashboardPreview />
      <Results />
      <SocialProof />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
