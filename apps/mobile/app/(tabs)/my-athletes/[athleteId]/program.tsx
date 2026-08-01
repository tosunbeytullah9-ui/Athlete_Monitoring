import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AthleteProgramPlaceholder() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-700 px-5 pt-14 pb-6">
        <TouchableOpacity
          className="flex-row items-center mb-3"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#93c5fd" />
          <Text className="text-blue-300 ml-1 text-sm">Geri</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Program</Text>
      </View>
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-4xl mb-3">📋</Text>
        <Text className="text-gray-900 font-semibold text-lg text-center">Yakında</Text>
        <Text className="text-gray-500 text-sm text-center mt-2">
          Sporcunun programı yakında burada görünecek.
        </Text>
      </View>
    </View>
  );
}
