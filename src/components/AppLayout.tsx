import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import CopilotPanel from "@/components/CopilotPanel";

export default function AppLayout() {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar onToggleCopilot={() => setCopilotOpen(!copilotOpen)} copilotOpen={copilotOpen} />
      <main className="ml-[240px] min-h-screen p-6 transition-all duration-300" style={{ marginRight: copilotOpen ? 380 : 0 }}>
        <Outlet />
      </main>
      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
