import { Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "./supabase";

export function confirmSignOut(onStart?: () => void) {
  Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istiyor musunuz?", [
    { text: "İptal", style: "cancel" },
    {
      text: "Çıkış Yap",
      style: "destructive",
      onPress: async () => {
        onStart?.();
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      },
    },
  ]);
}
