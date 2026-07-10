import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { Toaster } from "@/components/ui/toaster";
import { TrialBannerWrapper } from "@/components/shared/trial-banner-wrapper";
import {
  UserContextProvider,
  type Role,
} from "@/lib/hooks/user-context-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = (cookieStore.get("aiq_role")?.value ?? null) as Role | null;
  const orgId = cookieStore.get("aiq_org_id")?.value ?? null;
  const teamId = cookieStore.get("aiq_team_id")?.value ?? null;

  // Defans-in-depth: middleware athlete'i zaten /programs'a kilitliyor,
  // ama server component'te de rolü doğrula. Athlete sadece /programs ve
  // /programs/[id] (salt-okunur) görebilir; new/edit ve diğer sayfalar bloklı.
  if (role === "athlete") {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "";
    if (pathname) {
      const isBlocked =
        pathname === "/programs/new" || pathname.endsWith("/edit");
      const isAllowed = pathname.startsWith("/programs") && !isBlocked;
      if (!isAllowed) {
        redirect("/programs");
      }
    }
  }

  return (
    <UserContextProvider value={{ role, orgId, teamId }}>
      <div className="flex h-screen flex-col overflow-hidden">
        <TrialBannerWrapper />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-8">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </div>
    </UserContextProvider>
  );
}
