import { Stack } from "expo-router";

export default function AthleteHubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="program" />
      <Stack.Screen name="recovery" />
      <Stack.Screen name="competitions" />
    </Stack>
  );
}
