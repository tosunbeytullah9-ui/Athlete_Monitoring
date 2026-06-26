import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { registerForPushNotifications } from "@/lib/notifications";

function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const inAuthGroup = segments[0] === "(auth)";

        if (!session && !inAuthGroup) {
          router.replace("/(auth)/login");
        } else if (session && inAuthGroup) {
          // Push token kaydet
          try {
            const token = await registerForPushNotifications();
            if (token) {
              const { data: athlete } = await supabase
                .from("athletes")
                .select("id")
                .eq("user_id", session.user.id)
                .single();

              if (athlete) {
                await supabase.from("athlete_push_tokens").upsert(
                  { athlete_id: athlete.id, token, platform: "expo" },
                  { onConflict: "athlete_id,token" }
                );
              }
            }
          } catch {
            // Push izni reddedildi — kritik değil
          }

          router.replace("/(tabs)/program");
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [segments]);
}

export default function RootLayout() {
  useAuthGuard();

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
