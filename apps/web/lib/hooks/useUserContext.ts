"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserContext {
  user: User | null;
  role: "admin" | "coach" | "athlete" | null;
  orgId: string | null;
  teamId: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

export function useUserContext(): UserContext {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = getCookie("aiq_role") as UserContext["role"];
  const orgId = getCookie("aiq_org_id");
  const teamId = getCookie("aiq_team_id");
  const isSuperAdmin =
    user?.user_metadata?.["platform_role"] === "super_admin";

  return { user, role, orgId, teamId, isLoading, isSuperAdmin };
}
