import { useState } from "react";
import { Settings as SettingsIcon, CreditCard, FolderKanban, Rocket, User, Check, Crown, Lock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/context/PlanContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { PLAN_ORDER, PLANS, PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

function GeneralTab() {
  const { user } = useAuth();
  const { planName } = usePlan();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Profil
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="mt-1 text-sm font-medium text-foreground">{user?.email ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Plan actuel</Label>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{planName}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">ID utilisateur</Label>
            <p className="mt-1 text-xs font-mono text-muted-foreground truncate">{user?.id ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Inscrit le</Label>
            <p className="mt-1 text-sm text-foreground">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-4">Préférences</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifications par email</Label>
              <p className="text-xs text-muted-foreground">Recevoir les alertes et rapports par email</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Mode sombre</Label>
              <p className="text-xs text-muted-foreground">Thème sombre pour l'interface</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Langue</Label>
              <p className="text-xs text-muted-foreground">Langue de l'application</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlansTab() {
  const { planId, setPlan } = usePlan();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-1">Gérer votre abonnement</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choisissez le plan qui correspond à vos besoins. Changez à tout moment.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const isCurrent = id === planId;
            return (
              <div
                key={id}
                className={cn(
                  "relative rounded-xl border p-5 transition-all duration-200",
                  isCurrent
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : plan.highlight
                      ? "border-primary/40 bg-card hover:border-primary/60"
                      : "border-border bg-card hover:border-primary/30"
                )}
              >
                {plan.highlight && !isCurrent && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2.5 py-0.5 bg-primary text-primary-foreground border-0">
                    Populaire
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2.5 py-0.5 bg-emerald-500 text-white border-0">
                    Plan actuel
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {id === "business" && <Crown className="h-4 w-4 text-amber-500" />}
                  <h4 className="font-display text-sm font-semibold text-card-foreground">{plan.name}</h4>
                </div>

                <div className="flex items-baseline gap-0.5 mb-4">
                  <span className="font-display text-2xl font-bold text-foreground">${plan.price}</span>
                  {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.featureLabels.map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                  {plan.limits.map((l, j) => (
                    <li key={`l${j}`} className="flex items-start gap-1.5 text-xs text-muted-foreground/60">
                      <span className="mt-0.5 h-3 w-3 shrink-0 text-center">—</span> {l}
                    </li>
                  ))}
                </ul>

                <Button
                  size="sm"
                  className="w-full text-xs"
                  variant={isCurrent ? "outline" : plan.highlight ? "default" : "secondary"}
                  disabled={isCurrent}
                  onClick={() => setPlan(id)}
                >
                  {isCurrent ? "Plan actif" : plan.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-3">
          Fonctionnalités par plan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Fonctionnalité</th>
                {PLAN_ORDER.map((id) => (
                  <th key={id} className={cn("py-2 px-3 text-center font-medium", id === planId ? "text-primary" : "text-muted-foreground")}>
                    {PLANS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                ["Prévision basique", "forecast_basic"],
                ["Prévision automatique", "forecast_auto"],
                ["Prévision multi-SKU", "forecast_multi_sku"],
                ["Backtesting avancé", "backtesting_advanced"],
                ["Alertes intelligentes", "alerts"],
                ["KPI & Rapports", "kpi_reports"],
                ["Finance", "finance"],
                ["S&OP", "sop"],
                ["Stocks", "inventory"],
                ["Événements", "events"],
                ["Connecteurs", "connectors"],
                ["Export CSV", "export_csv"],
                ["Accès API", "api_access"],
                ["Copilot IA", "copilot"],
                ["Multi-utilisateurs", "multi_users"],
                ["Support prioritaire", "priority_support"],
              ] as [string, string][]).map(([label, feat]) => (
                <tr key={feat} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                  {PLAN_ORDER.map((id) => (
                    <td key={id} className="py-2 px-3 text-center">
                      {PLANS[id].features.includes(feat as any) ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="mx-auto h-3 w-3 text-muted-foreground/30" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WorkspacesTab() {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const ws = await createWorkspace(newName.trim());
    if (ws) setActiveWorkspace(ws);
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-1">Workspaces</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Organisez vos données par workspace. Chaque workspace a ses propres fichiers, prévisions et événements.
        </p>

        <div className="space-y-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 transition-all",
                ws.id === activeWorkspace?.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: ws.color }}>
                  {ws.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ws.is_default ? "Workspace par défaut" : `Créé le ${new Date(ws.created_at).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ws.id === activeWorkspace?.id ? (
                  <Badge variant="secondary" className="text-[10px]">Actif</Badge>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveWorkspace(ws)}>
                    Activer
                  </Button>
                )}
                {!ws.is_default && (
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => deleteWorkspace(ws.id)}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <input
            type="text"
            placeholder="Nom du nouveau workspace..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <Button size="sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? "Création..." : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OnboardingTab() {
  const { planName } = usePlan();
  const { workspaces } = useWorkspace();

  const steps = [
    { label: "Créer un compte", done: true, desc: "Votre compte est actif" },
    { label: "Choisir un plan", done: planName !== "Gratuit", desc: planName !== "Gratuit" ? `Plan ${planName} activé` : "Choisissez un plan adapté" },
    { label: "Créer un workspace", done: workspaces.length > 0, desc: workspaces.length > 0 ? `${workspaces.length} workspace(s)` : "Organisez vos données" },
    { label: "Importer des données", done: false, desc: "Importez votre premier fichier CSV ou Excel" },
    { label: "Lancer une prévision", done: false, desc: "Lancez votre premier forecast IA" },
    { label: "Consulter les résultats", done: false, desc: "Explorez le dashboard et les KPIs" },
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-base font-semibold text-card-foreground mb-1">Guide de démarrage</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Suivez ces étapes pour tirer le meilleur parti de Kast AI.
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-card-foreground">{completed}/{steps.length} étapes</span>
            <span className="text-sm font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-all",
                step.done ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                step.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {step.done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div>
                <p className={cn("text-sm font-medium", step.done ? "text-emerald-700" : "text-card-foreground")}>{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte, votre plan et vos workspaces"
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general" className="gap-1.5 text-xs">
            <SettingsIcon className="h-3.5 w-3.5" /> Paramètres
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" /> Plans
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="gap-1.5 text-xs">
            <FolderKanban className="h-3.5 w-3.5" /> Workspaces
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5 text-xs">
            <Rocket className="h-3.5 w-3.5" /> Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="plans"><PlansTab /></TabsContent>
        <TabsContent value="workspaces"><WorkspacesTab /></TabsContent>
        <TabsContent value="onboarding"><OnboardingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
