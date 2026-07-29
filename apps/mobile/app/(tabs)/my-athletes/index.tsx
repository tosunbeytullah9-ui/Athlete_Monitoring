import { View, Text } from "react-native";

export default function MyAthletesScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-700 px-5 pt-14 pb-6">
        <Text className="text-white text-2xl font-bold">Sporcularım</Text>
      </View>
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-4xl mb-3">🏃</Text>
        <Text className="text-gray-900 font-semibold text-lg text-center">Yakında</Text>
        <Text className="text-gray-500 text-sm text-center mt-2">
          Sporcu listesi yakında burada görünecek.
        </Text>
      </View>
    </View>
  );
}
