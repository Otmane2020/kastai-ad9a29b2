import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, BarChart3, ShieldAlert, PackageCheck, Layers, Zap,
  Check, ChevronDown, ArrowRight, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, FileSpreadsheet, ShoppingCart,
  Star, Quote, Sparkles, Upload, Play
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
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── HERO ─── */
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden">
      {/* bg gradient */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(217_91%_50%/0.3),transparent)]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-32 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}>
            <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-sm px-4 py-1.5">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 95% forecast accuracy
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp} custom={1}
            className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Predict your demand.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Eliminate stockouts.
            </span>{" "}
            Maximize profit.
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            AI-powered demand forecasting for e-commerce &amp; retail — no data science required.
            Upload your data. Get predictions in minutes.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-8 text-base font-semibold shadow-elevated" onClick={() => navigate("/auth")}>
              Start forecasting for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base font-semibold border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent">
              <Upload className="mr-2 h-4 w-4" /> Upload your data
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-400" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-400" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-400" /> Setup in 2 min</span>
          </motion.div>
        </motion.div>
      </div>
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
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-destructive">The problem</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Still relying on intuition to plan demand?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Most businesses still use Excel or gut feeling. This leads to overstock, lost sales, and poor cash flow.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
          {problems.map((p, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="group rounded-2xl border border-destructive/20 bg-destructive/5 p-8 transition-all hover:border-destructive/40 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
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
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">The solution</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            AI that predicts your sales — automatically
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Kast AI uses 13 advanced forecasting models to predict your future demand with high accuracy.
            No setup. No code. Just upload and forecast.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">How it works</h3>
              <div className="mt-4 space-y-3">
                {[
                  "Upload your CSV, Excel, or connect Shopify",
                  "AI automatically tests 13 models (ARIMA, Prophet, XGBoost, LSTM...)",
                  "Backtesting selects the most accurate model",
                  "Get forecasts, alerts, and recommendations instantly"
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                    <p className="text-sm text-muted-foreground">{step}</p>
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
  { icon: Zap, title: "Backtesting & Accuracy", desc: "80/20 split backtesting with MAPE optimization. Know your forecast precision before you act." },
  { icon: ShieldAlert, title: "Smart Alerts", desc: "Real-time stockout & overstock risk detection. Never miss a critical inventory threshold." },
  { icon: PackageCheck, title: "Order Recommendations", desc: "Know what to order, how much, and when. AI-driven purchasing suggestions." },
  { icon: Layers, title: "S&OP Integration", desc: "Connect forecasts to inventory, production, and financial planning in one platform." },
  { icon: ShoppingCart, title: "Multi-channel", desc: "Shopify, CSV, Excel, ERP. Import from anywhere and forecast across all channels." },
];

function Features() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">Features</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to master demand
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:shadow-elevated hover:border-primary/30"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
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
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">Dashboard</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Your command center for demand planning
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mt-14 rounded-2xl border border-border bg-card p-2 shadow-elevated overflow-hidden"
        >
          {/* Simulated dashboard UI */}
          <div className="rounded-xl bg-gradient-to-br from-sidebar to-sidebar/90 p-6">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Forecast Accuracy", value: "94.2%", change: "+2.1%", up: true },
                { label: "Revenue Predicted", value: "$1.2M", change: "+18%", up: true },
                { label: "Stockout Risk", value: "3 SKUs", change: "-40%", up: false },
                { label: "Overstock Value", value: "$24K", change: "-22%", up: false },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4">
                  <p className="text-xs text-white/50">{kpi.label}</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">{kpi.value}</p>
                  <p className={`mt-1 text-xs font-medium ${kpi.up ? "text-green-400" : "text-green-400"}`}>
                    {kpi.change}
                  </p>
                </div>
              ))}
            </div>
            {/* Chart area */}
            <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-6 h-64 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 20 + (i > 17 ? 15 : 0);
                const isForecast = i >= 18;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${isForecast ? "bg-primary/60 border border-dashed border-primary" : "bg-accent/70"}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent/70" /> Historical</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/60 border border-dashed border-primary" /> Forecast</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── RESULTS ─── */
const results = [
  { icon: TrendingDown, value: "-30%", label: "Stockouts reduced", color: "text-green-500" },
  { icon: PackageCheck, value: "-20%", label: "Overstock eliminated", color: "text-primary" },
  { icon: TrendingUp, value: "+15%", label: "Cash flow improved", color: "text-accent" },
];

function Results() {
  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">Results</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Real impact on your bottom line
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-8 md:grid-cols-3">
          {results.map((r, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} className="text-center">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <r.icon className={`h-8 w-8 ${r.color}`} />
              </div>
              <p className={`font-display text-5xl font-bold ${r.color}`}>{r.value}</p>
              <p className="mt-2 text-muted-foreground">{r.label}</p>
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
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">Testimonials</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Loved by e-commerce &amp; retail teams
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="rounded-2xl border border-border bg-card p-7 shadow-card"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <Quote className="mb-2 h-5 w-5 text-muted-foreground/40" />
              <p className="text-sm leading-relaxed text-foreground">{t.text}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
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
    <section id="pricing" className="py-24 bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Simple, transparent pricing
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-muted-foreground">
            1 stockout avoided = pays your subscription. Start free, upgrade when you're ready.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className={`relative rounded-2xl border p-7 transition-all duration-300 ${
                plan.highlight
                  ? "border-primary bg-card shadow-elevated scale-[1.03]"
                  : "border-border bg-card shadow-card hover:shadow-elevated"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 shadow-sm">{plan.badge}</Badge>
                </div>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">${plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
                {plan.limits.map((l, j) => (
                  <li key={`l${j}`} className="flex items-start gap-2 text-sm text-muted-foreground/60">
                    <span className="mt-0.5 h-4 w-4 shrink-0 text-center">—</span> {l}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-7 w-full ${plan.highlight ? "" : ""}`}
                variant={plan.highlight ? "default" : "outline"}
                onClick={() => navigate("/auth")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
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
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</motion.p>
          <motion.h2 variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Frequently asked questions
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-6 shadow-card">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
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
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="relative overflow-hidden rounded-3xl gradient-hero p-12 text-center shadow-elevated"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_110%,hsl(217_91%_50%/0.3),transparent)]" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <img src={logoIcon} alt="Kast AI" className="h-10 w-10 rounded-lg" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Start forecasting now
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
              Join hundreds of e-commerce and retail teams using Kast AI to predict demand, reduce waste, and grow revenue.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-13 px-10 text-base font-semibold" onClick={() => navigate("/auth")}>
                Get started for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/40">No credit card required · Free plan available</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="Kast AI" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-bold text-foreground">
              Kast<span className="text-primary">AI</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Kast AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── NAV ─── */
function Nav() {
  const navigate = useNavigate();
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-sidebar/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="Kast AI" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-lg font-bold text-white">
            Kast<span className="text-primary">AI</span>
          </span>
        </div>
        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate("/auth")}>
            Log in
          </Button>
          <Button size="sm" className="shadow-elevated" onClick={() => navigate("/auth")}>
            Start free
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── LANDING PAGE ─── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
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
