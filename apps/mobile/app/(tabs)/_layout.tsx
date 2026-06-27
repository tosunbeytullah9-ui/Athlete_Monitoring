import { Tabs } from "expo-router";
import { Calendar, Activity, Trophy, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1d4ed8",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="program/index"
        options={{
          title: "Program",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recovery/index"
        options={{
          title: "Recovery",
          tabBarIcon: ({ color, size }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="competitions/index"
        options={{
          title: "Yarışmalar",
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      {/* Tab bar'da görünmeyecek alt sayfalar */}
      <Tabs.Screen
        name="program/[day]"
        options={{ tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="profile/connect-whoop"
        options={{ tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="profile/connect-polar"
        options={{ tabBarButton: () => null }}
      />
    </Tabs>
  );
}
