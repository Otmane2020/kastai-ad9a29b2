import { useState } from "react";
import { Briefcase, Plus, Check, Trash2, ChevronDown } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export default function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const ws = await createWorkspace(newName.trim());
    if (ws) { setActiveWorkspace(ws); setNewName(""); setCreating(false); }
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors"
        title={activeWorkspace?.name ?? "Workspace"}
      >
        <div className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: activeWorkspace?.color ?? "#6366f1" }}>
          {(activeWorkspace?.name ?? "W")[0].toUpperCase()}
        </div>
      </button>
    );
  }

  return (
    <div className="relative px-3 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent/60"
      >
        <div className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: activeWorkspace?.color ?? "#6366f1" }}>
          {(activeWorkspace?.name ?? "W")[0].toUpperCase()}
        </div>
        <span className="flex-1 truncate text-xs font-medium text-sidebar-foreground">
          {activeWorkspace?.name ?? "Workspace"}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-sidebar-foreground/60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-xl border border-border bg-card shadow-elevated overflow-hidden">
          <div className="p-1.5 space-y-0.5 max-h-52 overflow-y-auto">
            {workspaces.map((ws) => (
              <div key={ws.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => { setActiveWorkspace(ws); setOpen(false); }}>
                <div className="h-5 w-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: ws.color }}>
                  {ws.name[0].toUpperCase()}
                </div>
                <span className="flex-1 text-xs text-foreground truncate">{ws.name}</span>
                {activeWorkspace?.id === ws.id && <Check className="h-3 w-3 text-primary shrink-0" />}
                {!ws.is_default && workspaces.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteWorkspace(ws.id); }}
                    className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border p-1.5">
            {creating ? (
              <div className="flex items-center gap-1.5 px-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                  placeholder="Nom du workspace..."
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button onClick={handleCreate} className="rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground">OK</button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3" />
                Nouveau workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
