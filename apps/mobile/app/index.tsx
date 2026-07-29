import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { session, loading, role, roleLoading } = useAuth();

  if (loading || roleLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#534AB7" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const isCoachOrAdmin = role === "coach" || role === "admin";
  return <Redirect href={isCoachOrAdmin ? "/(tabs)/my-athletes" : "/(tabs)/program"} />;
}
