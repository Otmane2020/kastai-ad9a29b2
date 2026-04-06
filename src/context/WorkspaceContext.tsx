import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string, description?: string, color?: string) => Promise<Workspace | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  loading: boolean;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) { setWorkspaces([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const list: Workspace[] = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        color: r.color ?? "#6366f1",
        icon: r.icon ?? "briefcase",
        is_default: r.is_default ?? false,
        created_at: r.created_at,
      }));

      setWorkspaces(list);

      // Restore from localStorage or pick default
      const savedId = localStorage.getItem(`kastai_workspace_${user.id}`);
      const saved = list.find((w) => w.id === savedId);
      const defaultWs = list.find((w) => w.is_default) ?? list[0] ?? null;
      setActiveWorkspaceState(saved ?? defaultWs);
    } catch (err) {
      console.error("WorkspaceContext: fetchWorkspaces error", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const setActiveWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspaceState(ws);
    if (user) localStorage.setItem(`kastai_workspace_${user.id}`, ws.id);
  }, [user]);

  const createWorkspace = useCallback(async (name: string, description?: string, color = "#6366f1"): Promise<Workspace | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ user_id: user.id, name, description, color })
      .select()
      .single();
    if (error || !data) { console.error(error); return null; }
    const ws: Workspace = { ...data, color: data.color ?? color, icon: data.icon ?? "briefcase", is_default: false };
    setWorkspaces((prev) => [...prev, ws]);
    return ws;
  }, [user]);

  const deleteWorkspace = useCallback(async (id: string) => {
    await supabase.from("workspaces").delete().eq("id", id);
    setWorkspaces((prev) => {
      const next = prev.filter((w) => w.id !== id);
      if (activeWorkspace?.id === id) {
        setActiveWorkspaceState(next.find((w) => w.is_default) ?? next[0] ?? null);
      }
      return next;
    });
  }, [activeWorkspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces, activeWorkspace, setActiveWorkspace,
      createWorkspace, deleteWorkspace, loading, refetch: fetchWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
