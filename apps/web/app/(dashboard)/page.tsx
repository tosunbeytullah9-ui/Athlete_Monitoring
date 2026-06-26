import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UsersRound, ClipboardList, Trophy } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get("aiq_org_id")?.value;

  if (!orgId) {
    redirect("/login?error=no_membership");
  }

  const [athletesRes, teamsRes, programsRes, competitionsRes] =
    await Promise.all([
      supabase
        .from("athletes")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("is_active", true),
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
      supabase
        .from("training_programs")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
      supabase
        .from("competitions")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
    ]);

  const stats = [
    {
      title: "Aktif Sporcular",
      value: athletesRes.count ?? 0,
      icon: Users,
      href: "/athletes",
    },
    {
      title: "Takımlar",
      value: teamsRes.count ?? 0,
      icon: UsersRound,
      href: "/athletes",
    },
    {
      title: "Antrenman Programları",
      value: programsRes.count ?? 0,
      icon: ClipboardList,
      href: "/programs",
    },
    {
      title: "Yarışmalar",
      value: competitionsRes.count ?? 0,
      icon: Trophy,
      href: "/competitions",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizasyon Özeti</h1>
        <p className="text-muted-foreground mt-1">
          Platformunuzdaki güncel istatistikler
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
