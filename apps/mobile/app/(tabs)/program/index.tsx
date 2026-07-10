import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAthleteProfile } from "@/lib/hooks/useAthleteProfile";
import type { Database } from "@athleteiq/db/types";

type TrainingProgram = Database["public"]["Tables"]["training_programs"]["Row"];
type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];

type ProgramWithSessions = TrainingProgram & {
  training_sessions: TrainingSession[];
};

const DAY_LABELS: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma",
  6: "Cumartesi",
  7: "Pazar",
};

const SESSION_TYPE_COLORS: Record<string, string> = {
  strength: "bg-red-100 text-red-700",
  conditioning: "bg-orange-100 text-orange-700",
  technical: "bg-blue-100 text-blue-700",
  recovery: "bg-green-100 text-green-700",
  competition: "bg-purple-100 text-purple-700",
};

export default function ProgramScreen() {
  const router = useRouter();
  const { athlete, loading: athleteLoading } = useAthleteProfile();
  const [programs, setPrograms] = useState<ProgramWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchPrograms = useCallback(async (athleteId: string, teamId: string | null) => {
    const orFilter = teamId
      ? `athlete_id.eq.${athleteId},team_id.eq.${teamId}`
      : `athlete_id.eq.${athleteId}`;

    const { data, error } = await supabase
      .from("training_programs")
      .select(
        `
        *,
        training_sessions (
          id, day_of_week, session_type, title, duration_min, order_index
        )
      `
      )
      .or(orFilter)
      .eq("is_published", true)
      .order("start_date", { ascending: false })
      .limit(5);

    if (!error && data) {
      setPrograms(data as ProgramWithSessions[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!athlete) {
      setLoading(false);
      return;
    }

    fetchPrograms(athlete.id, athlete.team_id);

    // Realtime: TÜM training_programs değişikliklerini dinle (filtre YOK).
    // Postgres realtime filtresi (is_published=eq.true) yalnızca satır filtreye
    // UYDUĞUNDA fire eder; unpublish (true→false) olayını kaçırır ve program
    // ekranda takılı kalır. Bu yüzden filtreyi kaldırıp eşleştirmeyi client'ta
    // yapıyoruz: her değişimde fetchPrograms yeniden çalışır ve yalnızca bu
    // sporcuya ait YAYINLANMIŞ programları döndürür (unpublish → listeden çıkar).
    const channel = supabase
      .channel(`programs-athlete-${athlete.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "training_programs",
        },
        () => {
          // Her değişimde yeniden çek. fetchPrograms zaten .or(athlete/team) +
          // .eq(is_published,true) ile filtreler; bu sporcuya ait olmayan veya
          // unpublish edilmiş programlar sonuçtan otomatik düşer. DELETE
          // event'inde payload.old yalnızca PK içerebildiği için client-side
          // eşleştirme yerine koşulsuz refetch daha güvenli (sorgu limit 5, ucuz).
          fetchPrograms(athlete.id, athlete.team_id);
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [athlete, fetchPrograms]);

  const onRefresh = useCallback(() => {
    if (!athlete) return;
    setRefreshing(true);
    fetchPrograms(athlete.id, athlete.team_id);
  }, [athlete, fetchPrograms]);

  if (athleteLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!athlete) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Text className="text-gray-500 text-center">
          Sporcu profili bulunamadı. Yöneticinizle iletişime geçin.
        </Text>
      </View>
    );
  }

  const activeProgram = programs[0] ?? null;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />
      }
    >
      {/* Header */}
      <View className="bg-blue-700 px-5 pt-14 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-blue-200 text-sm">Merhaba,</Text>
            <Text className="text-white text-2xl font-bold">
              {athlete.full_name.split(" ")[0]}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                realtimeConnected ? "bg-green-400" : "bg-yellow-400"
              }`}
            />
            <Text className="text-blue-200 text-xs">
              {realtimeConnected ? "Canlı" : "Bağlanıyor"}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        {programs.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center mt-4">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-gray-900 font-semibold text-lg text-center">
              Henüz program yok
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-1">
              Antrenörünüz program yayınladığında burada görünecek.
            </Text>
          </View>
        ) : (
          <>
            {/* Aktif program başlığı */}
            {activeProgram && (
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
                    Aktif Program
                  </Text>
                  {activeProgram.phase && (
                    <View className="bg-blue-50 px-2 py-0.5 rounded-full">
                      <Text className="text-blue-700 text-xs capitalize">
                        {activeProgram.phase}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-900 text-lg font-bold">
                  {activeProgram.title}
                </Text>
                {activeProgram.week_number && (
                  <Text className="text-gray-400 text-sm mt-0.5">
                    Hafta {activeProgram.week_number}
                  </Text>
                )}
              </View>
            )}

            {/* Haftalık görünüm */}
            <Text className="text-gray-900 font-semibold text-base mb-3">
              Haftalık Program
            </Text>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
              const sessions = activeProgram
                ? (activeProgram.training_sessions ?? [])
                    .filter((s) => s.day_of_week === dayNum)
                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                : [];

              const isToday =
                new Date().getDay() === (dayNum === 7 ? 0 : dayNum);

              return (
                <TouchableOpacity
                  key={dayNum}
                  className={`mb-2 rounded-2xl overflow-hidden ${
                    sessions.length === 0 ? "opacity-50" : ""
                  }`}
                  disabled={sessions.length === 0}
                  onPress={() =>
                    router.push(`/(tabs)/program/${dayNum}` as never)
                  }
                  activeOpacity={0.75}
                >
                  <View
                    className={`flex-row items-center px-4 py-3 ${
                      isToday ? "bg-blue-700" : "bg-white"
                    }`}
                  >
                    <View className="w-14">
                      <Text
                        className={`font-semibold text-sm ${
                          isToday ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {DAY_LABELS[dayNum]}
                      </Text>
                      {isToday && (
                        <Text className="text-blue-200 text-xs">Bugün</Text>
                      )}
                    </View>

                    <View className="flex-1 ml-3">
                      {sessions.length === 0 ? (
                        <Text
                          className={`text-sm ${
                            isToday ? "text-blue-200" : "text-gray-400"
                          }`}
                        >
                          Dinlenme
                        </Text>
                      ) : (
                        <View className="flex-row flex-wrap gap-1">
                          {sessions.map((s) => {
                            const colorClass =
                              SESSION_TYPE_COLORS[s.session_type ?? ""] ??
                              "bg-gray-100 text-gray-600";
                            return (
                              <View
                                key={s.id}
                                className={`px-2 py-0.5 rounded-full ${
                                  isToday
                                    ? "bg-blue-500"
                                    : colorClass.split(" ")[0]
                                }`}
                              >
                                <Text
                                  className={`text-xs font-medium ${
                                    isToday
                                      ? "text-white"
                                      : colorClass.split(" ")[1]
                                  }`}
                                >
                                  {s.title ?? s.session_type}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {sessions.length > 0 && (
                      <Text
                        className={`text-xs ${
                          isToday ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {sessions.reduce(
                          (sum, s) => sum + (s.duration_min ?? 0),
                          0
                        )}{" "}
                        dk
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}
