import { View, Text } from "react-native";
import type { Database } from "@athleteiq/db/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

function formatLoad(exercise: Exercise): string {
  if (exercise.load_kg) return `${exercise.load_kg} kg`;
  if (exercise.load_percent) return `%${exercise.load_percent} 1RM`;
  if (exercise.unit === "bodyweight") return "vücut ağırlığı";
  return "";
}

function formatVolume(exercise: Exercise): string {
  const sets = exercise.sets ?? 1;
  if (exercise.duration_sec) {
    const mins = Math.floor(exercise.duration_sec / 60);
    const secs = exercise.duration_sec % 60;
    const dur = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
    return `${sets} × ${dur}`;
  }
  if (exercise.reps) return `${sets} × ${exercise.reps}`;
  return `${sets} set`;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const load = formatLoad(exercise);
  const volume = formatVolume(exercise);

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start">
        {/* Sıra numarası */}
        <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3 mt-0.5">
          <Text className="text-blue-700 font-bold text-sm">{index + 1}</Text>
        </View>

        <View className="flex-1">
          {/* Egzersiz adı */}
          <Text className="text-gray-900 font-semibold text-base leading-tight">
            {exercise.name}
          </Text>

          {/* Volume + Load */}
          <View className="flex-row items-center mt-1.5 flex-wrap gap-2">
            <View className="bg-gray-100 px-2.5 py-1 rounded-lg">
              <Text className="text-gray-700 text-sm font-medium">{volume}</Text>
            </View>
            {load ? (
              <View className="bg-blue-50 px-2.5 py-1 rounded-lg">
                <Text className="text-blue-700 text-sm font-medium">{load}</Text>
              </View>
            ) : null}
            {exercise.rest_sec ? (
              <View className="bg-orange-50 px-2.5 py-1 rounded-lg">
                <Text className="text-orange-600 text-sm">
                  Dinlenme: {exercise.rest_sec}sn
                </Text>
              </View>
            ) : null}
          </View>

          {/* Notlar */}
          {exercise.notes ? (
            <Text className="text-gray-400 text-sm mt-2 italic">
              {exercise.notes}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
