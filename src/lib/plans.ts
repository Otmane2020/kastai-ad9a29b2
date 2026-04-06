export type PlanId = "free" | "starter" | "pro" | "business";

export type Feature =
  | "dashboard"
  | "forecast_basic"
  | "forecast_auto"
  | "forecast_multi_sku"
  | "backtesting_advanced"
  | "alerts"
  | "kpi_reports"
  | "finance"
  | "sop"
  | "inventory"
  | "events"
  | "connectors"
  | "export_csv"
  | "api_access"
  | "copilot"
  | "multi_users"
  | "priority_support"
  | "settings"
  | "users_management";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  badge: string;
  maxDatasets: number | null;
  maxRows: number | null;
  maxConnectors: number | null;
  features: Feature[];
  featureLabels: string[];
  limits: string[];
  cta: string;
  highlight: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Gratuit",
    price: 0,
    period: "",
    badge: "",
    maxDatasets: 1,
    maxRows: 1000,
    maxConnectors: 0,
    features: ["dashboard", "forecast_basic", "settings"],
    featureLabels: [
      "1 jeu de données",
      "1 000 lignes",
      "Prévision basique",
      "Tableau de bord simple",
    ],
    limits: ["Pas d'alertes", "Pas de Copilot"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 29,
    period: "/mois",
    badge: "",
    maxDatasets: 3,
    maxRows: 10000,
    maxConnectors: 1,
    features: [
      "dashboard", "forecast_basic", "forecast_auto",
      "export_csv", "connectors", "events", "inventory",
      "settings",
    ],
    featureLabels: [
      "3 jeux de données",
      "10 000 lignes",
      "Prévision automatique",
      "Tableau de bord complet",
      "Export CSV",
      "Intégration Shopify",
    ],
    limits: ["Copilot +19€"],
    cta: "Démarrer",
    highlight: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 79,
    period: "/mois",
    badge: "Le plus populaire",
    maxDatasets: 10,
    maxRows: 100000,
    maxConnectors: 2,
    features: [
      "dashboard", "forecast_basic", "forecast_auto",
      "backtesting_advanced", "alerts", "kpi_reports",
      "finance", "inventory", "events", "connectors",
      "export_csv", "api_access", "copilot", "settings",
    ],
    featureLabels: [
      "10 jeux de données",
      "100 000 lignes",
      "Backtesting avancé",
      "Alertes intelligentes",
      "Recommandations d'achat",
      "Accès API",
      "Copilot IA inclus",
    ],
    limits: [],
    cta: "Essai Pro gratuit",
    highlight: true,
  },
  business: {
    id: "business",
    name: "Business",
    price: 199,
    period: "/mois",
    badge: "",
    maxDatasets: null,
    maxRows: null,
    maxConnectors: null,
    features: [
      "dashboard", "forecast_basic", "forecast_auto",
      "forecast_multi_sku", "backtesting_advanced",
      "alerts", "kpi_reports", "finance", "sop",
      "inventory", "events", "connectors",
      "export_csv", "api_access", "copilot",
      "multi_users", "users_management",
      "priority_support", "settings",
    ],
    featureLabels: [
      "Données illimitées",
      "Prévision multi-SKU",
      "Intégration S&OP",
      "Multi-utilisateurs",
      "3 connecteurs",
      "Copilot illimité",
      "Support prioritaire",
    ],
    limits: [],
    cta: "Contacter les ventes",
    highlight: false,
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

export function hasFeature(planId: PlanId, feature: Feature): boolean {
  return PLANS[planId].features.includes(feature);
}

export function canAccessRoute(planId: PlanId, route: string): boolean {
  const routeFeatureMap: Record<string, Feature> = {
    "/dashboard": "dashboard",
    "/forecast": "forecast_basic",
    "/events": "events",
    "/alerts": "alerts",
    "/kpi": "kpi_reports",
    "/finance": "finance",
    "/sop": "sop",
    "/sop/structure": "sop",
    "/sop/capacity": "sop",
    "/sop/plan": "sop",
    "/sop/kpis": "sop",
    "/sop/scenarios": "sop",
    "/inventory": "inventory",
    "/connectors": "connectors",
    "/users": "users_management",
    "/settings": "settings",
  };
  const feature = routeFeatureMap[route];
  if (!feature) return true;
  return hasFeature(planId, feature);
}
