import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";

type Mode = "password" | "magic";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin() {
    if (!email || !password) {
      Alert.alert("Hata", "E-posta ve şifre gerekli.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Giriş hatası", error.message);
  }

  async function handleMagicLink() {
    if (!email) {
      Alert.alert("Hata", "E-posta adresi gerekli.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Hata", error.message);
    } else {
      setMagicSent(true);
    }
  }

  if (magicSent) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-white">
        <Text className="text-4xl mb-4">📬</Text>
        <Text className="text-xl font-bold text-center text-gray-900">
          Bağlantı gönderildi!
        </Text>
        <Text className="mt-2 text-center text-gray-500">
          {email} adresine giriş bağlantısı gönderdik. E-postanızı kontrol edin.
        </Text>
        <TouchableOpacity
          className="mt-6"
          onPress={() => setMagicSent(false)}
        >
          <Text className="text-blue-700 font-medium">Geri dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center p-8">
        {/* Logo */}
        <View className="mb-10 items-center">
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: "#534AB7" }}>
            <Text className="text-white text-2xl font-black">A</Text>
          </View>
          <Text className="text-3xl font-black text-gray-900">AthleteIQ</Text>
          <Text className="mt-1 text-gray-500">Sporcu platformuna giriş yapın</Text>
        </View>

        {/* Email */}
        <Text className="text-sm font-medium text-gray-700 mb-1">E-posta</Text>
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-4"
          placeholder="sporcu@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        {mode === "password" && (
          <>
            <Text className="text-sm font-medium text-gray-700 mb-1">Şifre</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-6"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: "#534AB7" }}
              onPress={handlePasswordLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Giriş Yap
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => setMode("magic")}
            >
              <Text className="text-sm" style={{ color: "#534AB7" }}>
                Şifresiz giriş (magic link)
              </Text>
            </TouchableOpacity>
          </>
        )}

        {mode === "magic" && (
          <>
            <TouchableOpacity
              className="rounded-xl py-4 items-center mb-4"
              style={{ backgroundColor: "#534AB7" }}
              onPress={handleMagicLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Magic Link Gönder
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center"
              onPress={() => setMode("password")}
            >
              <Text className="text-sm" style={{ color: "#534AB7" }}>
                Şifre ile giriş yap
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
