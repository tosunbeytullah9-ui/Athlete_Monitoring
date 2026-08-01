import { useEffect, useState } from "react";
import { getAthleteById } from "@athleteiq/db/queries/athletes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Database } from "@athleteiq/db/types";

type Athlete = Database["public"]["Tables"]["athletes"]["Row"];

interface UseCoachAthleteResult {
  athlete: Athlete | null;
  loading: boolean;
  notFound: boolean;
}

// Coach için seçilen sporcunun yetkilendirme kontrolü — RLS training_programs/
// training_sessions/exercises üzerinde coach'u yalnızca org'a göre kısıtlıyor,
// team_id'ye göre DEĞİL (bkz. 002_rls.sql). Bu yüzden org_id/team_id karşılaştırması
// burada, client tarafında yapılmak ZORUNDA — my-athletes/[athleteId]/index.tsx'teki
// aynı kontrolün paylaşılan hali.
export function useCoachAthlete(athleteId: string | undefined): UseCoachAthleteResult {
  const { role, orgId, teamId } = useAuth();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!athleteId || !orgId) return;
    let mounted = true;

    (getAthleteById(supabase, athleteId) as Promise<Athlete>)
      .then((data) => {
        if (!mounted) return;
        const authorized =
          data.org_id === orgId &&
          (role === "admin" || (role === "coach" && data.team_id === teamId));
        if (!authorized) {
          setNotFound(true);
        } else {
          setAthlete(data);
        }
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [athleteId, orgId, role, teamId]);

  return { athlete, loading, notFound };
}
