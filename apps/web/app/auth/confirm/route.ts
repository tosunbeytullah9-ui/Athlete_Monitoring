import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@athleteiq/db/types"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  if (token_hash && type) {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.verifyOtp({
      type: type as "invite" | "magiclink" | "recovery" | "email" | "email_change" | "phone_change",
      token_hash,
    })

    if (!error && user) {
      // Metadata'dan pending bilgileri oku
      const pendingOrgId = user.user_metadata?.pending_org_id as string | undefined
      const pendingRole = user.user_metadata?.pending_role as string | undefined
      const pendingTeamId = user.user_metadata?.pending_team_id as string | undefined

      // Membership kaydı oluştur (service role ile RLS bypass)
      if (pendingOrgId && pendingRole) {
        const serviceSupabase = createSupabaseClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        )

        await serviceSupabase.from("memberships").upsert(
          {
            user_id: user.id,
            org_id: pendingOrgId,
            team_id: pendingTeamId ?? null,
            role: pendingRole as "admin" | "coach" | "athlete",
          },
          { onConflict: "user_id,org_id" }
        )

        // Metadata'dan pending bilgileri temizle
        await serviceSupabase.auth.admin.updateUserById(user.id as string, {
          user_metadata: {
            ...user.user_metadata,
            pending_org_id: null,
            pending_role: null,
            pending_team_id: null,
          },
        })
      }

      // Role'e göre yönlendir
      const destination =
        pendingRole === "athlete"
          ? "/programs"
          : pendingRole === "coach"
            ? "/athletes"
            : "/athletes"

      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_token", request.url)
  )
}
