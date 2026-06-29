"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BannerState = "info" | "warning" | "expired" | "hidden";

export function TrialBanner({ orgId }: { orgId: string }) {
  const [state, setState] = useState<BannerState>("hidden");
  const [daysLeft, setDaysLeft] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!orgId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("org_trial_status")
      .select("plan_status, is_trial_expired, trial_days_remaining")
      .eq("id", orgId)
      .single()
      .then(({ data }: { data: { plan_status: string; is_trial_expired: boolean; trial_days_remaining: number } | null }) => {
        if (!data) return;
        if (data.plan_status !== "trial") return;

        const days = data.trial_days_remaining ?? 0;
        setDaysLeft(days);

        if (data.is_trial_expired) {
          setState("expired");
        } else if (days <= 7) {
          setState("warning");
        } else {
          setState("info");
        }
      });
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "hidden") return null;

  if (state === "expired") {
    return (
      <div className="relative z-50 flex items-center justify-center gap-4 bg-destructive px-4 py-3 text-sm text-destructive-foreground">
        <span className="font-medium">
          Deneme süreniz doldu. Devam etmek için plan seçin.
        </span>
        <a
          href="/settings?tab=billing"
          className="rounded-md bg-destructive-foreground/20 px-3 py-1 font-semibold hover:bg-destructive-foreground/30 transition-colors"
        >
          Plan Seç
        </a>
      </div>
    );
  }

  if (state === "warning") {
    return (
      <div className="flex items-center justify-center gap-4 bg-amber-500 px-4 py-2.5 text-sm text-white">
        <span>
          Deneme süreniz{" "}
          <span className="font-semibold">{daysLeft} gün</span> içinde bitiyor.
        </span>
        <a
          href="/settings?tab=billing"
          className="rounded-md bg-white/20 px-3 py-1 font-semibold hover:bg-white/30 transition-colors"
        >
          Plan Seç →
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
      <span>
        14 günlük deneme sürenizde{" "}
        <span className="font-semibold">{daysLeft} gün</span> kaldı.
      </span>
    </div>
  );
}
