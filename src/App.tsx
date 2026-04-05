import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Forecast from "@/pages/Forecast";
import Alerts from "@/pages/Alerts";
import KPIReports from "@/pages/KPIReports";
import Finance from "@/pages/Finance";
import SOP from "@/pages/SOP";
import Inventory from "@/pages/Inventory";
import Connectors from "@/pages/Connectors";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/kpi" element={<KPIReports />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/sop" element={<SOP />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/connectors" element={<Connectors />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
