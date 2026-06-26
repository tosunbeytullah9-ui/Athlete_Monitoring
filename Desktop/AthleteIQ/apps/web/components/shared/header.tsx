"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@athleteiq/ui/components/button";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/hooks/useUserContext";

const ROLE_LABELS: Record<string, string> = {
  admin: "Org Admin",
  coach: "Antrenör",
  athlete: "Sporcu",
};

export function Header() {
  const router = useRouter();
  const { user, role } = useUserContext();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-end border-b bg-card px-6 gap-4">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {user?.email}
        </span>
        {role && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {ROLE_LABELS[role] ?? role}
          </span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Çıkış
      </Button>
    </header>
  );
}
