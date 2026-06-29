import { cookies } from "next/headers";
import { TrialBanner } from "./trial-banner";

export async function TrialBannerWrapper() {
  const cookieStore = await cookies();
  const orgId = cookieStore.get("aiq_org_id")?.value ?? "";

  if (!orgId) return null;

  return <TrialBanner orgId={orgId} />;
}
