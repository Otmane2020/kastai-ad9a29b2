import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, AlertTriangle, BarChart3,
  DollarSign, Layers, Package, Plug, Users, Bot, ChevronLeft,
  ChevronRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/forecast", label: "Prévisions", icon: TrendingUp },
  { path: "/alerts", label: "Alertes", icon: AlertTriangle },
  { path: "/kpi", label: "KPI & Rapports", icon: BarChart3 },
  { path: "/finance", label: "Finance", icon: DollarSign },
  { path: "/sop", label: "S&OP", icon: Layers },
  { path: "/inventory", label: "Stocks", icon: Package },
  { path: "/connectors", label: "Connecteurs", icon: Plug },
  { path: "/users", label: "Utilisateurs", icon: Users },
];

interface AppSidebarProps {
  onToggleCopilot: () => void;
  copilotOpen: boolean;
}

export default function AppSidebar({ onToggleCopilot, copilotOpen }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <span className="font-display text-lg font-bold text-sidebar-primary-foreground">Kast</span>
            <span className="font-display text-lg font-bold text-sidebar-primary"> AI</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
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
        })}
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
          <Bot className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Copilot IA</span>}
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
