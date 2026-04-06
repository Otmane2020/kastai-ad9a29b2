import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Forecast from "@/pages/Forecast";
import Alerts from "@/pages/Alerts";
import KPIReports from "@/pages/KPIReports";
import Finance from "@/pages/Finance";
import SOPOverview from "@/pages/sop/SOPOverview";
import SOPStructure from "@/pages/sop/SOPStructure";
import SOPCapacity from "@/pages/sop/SOPCapacity";
import SOPPlan from "@/pages/sop/SOPPlan";
import SOPKpis from "@/pages/sop/SOPKpis";
import SOPScenarios from "@/pages/sop/SOPScenarios";
import Inventory from "@/pages/Inventory";
import Connectors from "@/pages/Connectors";
import UserManagement from "@/pages/UserManagement";
import SuperAdmin from "@/pages/SuperAdmin";
import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/kpi" element={<KPIReports />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/sop" element={<SOPOverview />} />
                <Route path="/sop/structure" element={<SOPStructure />} />
                <Route path="/sop/capacity" element={<SOPCapacity />} />
                <Route path="/sop/plan" element={<SOPPlan />} />
                <Route path="/sop/kpis" element={<SOPKpis />} />
                <Route path="/sop/scenarios" element={<SOPScenarios />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/connectors" element={<Connectors />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
