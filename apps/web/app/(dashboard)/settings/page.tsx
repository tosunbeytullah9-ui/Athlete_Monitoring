import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Oturum bulunamadı.</p>
      </div>
    );
  }

  // Service role ile membership + org + teams çek (RLS bypass — cookie bağımsız)
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: membership } = await admin
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership?.org_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organizasyon bulunamadı.</p>
      </div>
    );
  }

  const orgId = membership.org_id;

  const [teamsResult, orgResult] = await Promise.all([
    admin.from("teams").select("*").eq("org_id", orgId).order("name"),
    admin.from("organizations").select("id, name, slug, plan, logo_url").eq("id", orgId).single(),
  ]);

  return (
    <SettingsClient
      orgId={orgId}
      org={orgResult.data}
      teams={teamsResult.data ?? []}
    />
  );
}
