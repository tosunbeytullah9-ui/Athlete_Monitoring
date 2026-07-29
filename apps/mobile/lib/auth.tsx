import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export type MembershipRole = "admin" | "coach" | "athlete";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  role: MembershipRole | null;
  orgId: string | null;
  teamId: string | null;
  roleLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  role: null,
  orgId: null,
  teamId: null,
  roleLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<MembershipRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!session) {
      setRole(null);
      setOrgId(null);
      setTeamId(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    supabase
      .from("memberships")
      .select("role, org_id, team_id")
      .eq("user_id", session.user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) {
          setRole(null);
          setOrgId(null);
          setTeamId(null);
        } else {
          setRole(data.role as MembershipRole);
          setOrgId(data.org_id);
          setTeamId(data.team_id);
        }
        setRoleLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  return (
    <AuthContext.Provider value={{ session, loading, role, orgId, teamId, roleLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
