import { Stack } from "expo-router";

export default function MyAthletesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[athleteId]" />
    </Stack>
  );
}
