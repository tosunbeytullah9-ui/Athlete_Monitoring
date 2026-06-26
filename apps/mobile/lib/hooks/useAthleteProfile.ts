import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@athleteiq/db/types";

type Athlete = Database["public"]["Tables"]["athletes"]["Row"];

export function useAthleteProfile() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from("athletes")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (mounted) {
        if (err) setError(err.message);
        else setAthlete(data);
        setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return { athlete, loading, error };
}
