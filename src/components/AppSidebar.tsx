import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  SquareKanban, LineChart, ShieldAlert, PieChart,
  Wallet, Workflow, Boxes, Cable, UserCog, MessageSquare, ChevronLeft,
  ChevronRight, Gem, LogOut, ChevronDown, Factory, Activity, ClipboardList, BarChart3, FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logoKastAi from "@/assets/logo-kast-ai.png";

const sopSubItems = [
  { path: "/sop", label: "Vue d'ensemble", icon: Workflow },
  { path: "/sop/structure", label: "Structure", icon: Factory },
  { path: "/sop/capacity", label: "Demande vs Capacité", icon: Activity },
  { path: "/sop/plan", label: "Plan de production", icon: ClipboardList },
  { path: "/sop/kpis", label: "KPI S&OP", icon: BarChart3 },
  { path: "/sop/scenarios", label: "Scénarios", icon: FlaskConical },
];

const navItems = [
  { path: "/", label: "Dashboard", icon: SquareKanban },
  { path: "/forecast", label: "Prévisions", icon: LineChart },
  { path: "/alerts", label: "Alertes", icon: ShieldAlert },
  { path: "/kpi", label: "KPI & Rapports", icon: PieChart },
  { path: "/finance", label: "Finance", icon: Wallet },
  { path: "/inventory", label: "Stocks", icon: Boxes },
  { path: "/connectors", label: "Connecteurs", icon: Cable },
  { path: "/users", label: "Utilisateurs", icon: UserCog },
  { path: "/superadmin", label: "Super Admin", icon: Gem },
];

interface AppSidebarProps {
  onToggleCopilot: () => void;
  copilotOpen: boolean;
}

export default function AppSidebar({ onToggleCopilot, copilotOpen }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const isSopActive = location.pathname.startsWith("/sop");
  const [sopOpen, setSopOpen] = useState(isSopActive);

  const renderNavLink = (item: { path: string; label: string; icon: any }, end = true) => {
    const isActive = end ? location.pathname === item.path : location.pathname.startsWith(item.path);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-sidebar-primary")} />
        {!collapsed && <span className="animate-fade-in">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-3">
        <div className={cn("flex items-center justify-center rounded-lg bg-white overflow-hidden", collapsed ? "h-10 w-10 p-1" : "h-10 px-3 py-1")}>
          <img src={logoKastAi} alt="Kast AI" className={cn("object-contain", collapsed ? "h-7 w-7" : "h-8")} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.slice(0, 5).map((item) => renderNavLink(item))}

        {/* S&OP expandable section */}
        <div>
          <button
            onClick={() => collapsed ? undefined : setSopOpen(!sopOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isSopActive
                ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Workflow className={cn("h-[18px] w-[18px] shrink-0", isSopActive && "text-sidebar-primary")} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left animate-fade-in">S&OP</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", sopOpen && "rotate-180")} />
              </>
            )}
          </button>

          {!collapsed && sopOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3">
              {sopSubItems.map((sub) => {
                const isActive = location.pathname === sub.path;
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent/80 text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <sub.icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-sidebar-primary")} />
                    <span>{sub.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {navItems.slice(5).map((item) => renderNavLink(item))}
      </nav>

      {/* Copilot button */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={onToggleCopilot}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            copilotOpen
              ? "gradient-primary text-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60"
          )}
        >
          <MessageSquare className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Copilot IA</span>}
        </button>
      </div>

      {/* User & Logout */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {!collapsed && user && (
          <p className="px-3 text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
        )}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
