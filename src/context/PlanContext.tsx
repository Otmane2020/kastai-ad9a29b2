import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlanId, Feature, PLANS, hasFeature, canAccessRoute } from "@/lib/plans";

interface PlanContextType {
  planId: PlanId;
  planName: string;
  setPlan: (id: PlanId) => Promise<void>;
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
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        const raw = (data as Record<string, unknown>)?.plan;
        if (raw && typeof raw === "string" && raw in PLANS) {
          setPlanId(raw as PlanId);
        } else {
          setPlanId("free");
        }
      } catch {
        setPlanId("free");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const setPlan = useCallback(async (id: PlanId) => {
    if (!user) return;
    setPlanId(id);
    await supabase
      .from("profiles")
      .update({ plan: id } as Record<string, unknown>)
      .eq("id", user.id);
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
