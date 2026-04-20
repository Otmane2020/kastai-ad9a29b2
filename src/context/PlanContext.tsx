import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { PlanId, Feature, PLANS, hasFeature, canAccessRoute } from "@/lib/plans";

interface PlanContextType {
  planId: PlanId;
  planName: string;
  setPlan: (id: PlanId) => void;
  can: (feature: Feature) => boolean;
  canRoute: (route: string) => boolean;
  loading: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [planId, setPlanId] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlanId("free"); setLoading(false); return; }
    const stored = localStorage.getItem(`kastai_plan_${user.id}`);
    if (stored && stored in PLANS) {
      setPlanId(stored as PlanId);
    } else {
      setPlanId("free");
    }
    setLoading(false);
  }, [user]);

  const setPlan = useCallback((id: PlanId) => {
    if (!user) return;
    setPlanId(id);
    localStorage.setItem(`kastai_plan_${user.id}`, id);
  }, [user]);

  const can = useCallback((feature: Feature) => hasFeature(planId, feature), [planId]);
  const canRoute = useCallback((route: string) => canAccessRoute(planId, route), [planId]);

  return (
    <PlanContext.Provider value={{ planId, planName: PLANS[planId].name, setPlan, can, canRoute, loading }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
