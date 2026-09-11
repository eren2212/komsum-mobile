import type { ComponentProps } from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { taskApi, DtoBadge, DtoDailyTask, TaskType } from "@/api/task";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

type IconName = ComponentProps<typeof Ionicons>["name"];

const TASK_ICONS: Record<TaskType, IconName> = {
  CREATE_POST: "create-outline",
  JOIN_EVENT: "calendar-outline",
  WRITE_COMMENT: "chatbubble-ellipses-outline",
};

// ─── Puan / Rozet Özet Kartı ──────────────────────────────────────────────────

function SummaryCard({
  totalPoints,
  earnedBadgeCount,
  pointsToNextBadge,
  nextBadgeName,
}: {
  totalPoints: number;
  earnedBadgeCount: number;
  pointsToNextBadge?: number | null;
  nextBadgeName?: string | null;
}) {
  return (
    <View
      className="bg-white rounded-[24px] p-5 mb-6"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-neutral-400 text-xs mb-1">Toplam Puanın</Text>
          <Text className="text-primary text-3xl font-bold">{totalPoints}</Text>
        </View>

        <View className="w-px h-[44px] bg-neutral-100" />

        <View className="flex-1 items-end">
          <Text className="text-neutral-400 text-xs mb-1">Rozetlerin</Text>
          <Text className="text-secondary-900 text-3xl font-bold">
            {earnedBadgeCount}
          </Text>
        </View>
      </View>

      {nextBadgeName != null && pointsToNextBadge != null && (
        <Text className="text-neutral-500 text-[13px] mt-4">
          "{nextBadgeName}" rozetine {pointsToNextBadge} puan kaldı.
        </Text>
      )}
    </View>
  );
}

// ─── Görev Satırı ─────────────────────────────────────────────────────────────

function TaskRow({ task, isLast }: { task: DtoDailyTask; isLast: boolean }) {
  return (
    <View>
      <View className="flex-row items-center py-4">
        <View
          className={`w-[44px] h-[44px] rounded-lg items-center justify-center mr-4 ${
            task.completed ? "bg-primary" : "bg-primary/20"
          }`}
        >
          <Ionicons
            name={task.completed ? "checkmark" : TASK_ICONS[task.type]}
            size={20}
            color={task.completed ? "#FFFFFF" : colors.primary.DEFAULT}
          />
        </View>

        <View className="flex-1 mr-3">
          <Text className="text-[15px] font-medium text-neutral-600">
            {task.title}
          </Text>
          {task.description != null && (
            <Text className="text-[13px] text-neutral-400 mt-0.5">
              {task.description}
            </Text>
          )}
        </View>

        <Text
          className={`text-[13px] font-bold ${
            task.completed ? "text-neutral-300" : "text-primary"
          }`}
        >
          +{task.pointsValue}
        </Text>
      </View>

      {!isLast && <View className="h-px bg-neutral-100 ml-[60px]" />}
    </View>
  );
}

// ─── Rozet Satırı ─────────────────────────────────────────────────────────────

function BadgeRow({ badge, isLast }: { badge: DtoBadge; isLast: boolean }) {
  return (
    <View>
      <View className="flex-row items-center py-4">
        <View
          className={`w-[44px] h-[44px] rounded-full items-center justify-center mr-4 ${
            badge.earned ? "bg-primary/20" : "bg-neutral-100"
          }`}
        >
          <Ionicons
            name={badge.earned ? "ribbon" : "lock-closed-outline"}
            size={20}
            color={badge.earned ? colors.primary.DEFAULT : "#A0A5BA"}
          />
        </View>

        <View className="flex-1 mr-3">
          <Text
            className={`text-[15px] font-medium ${
              badge.earned ? "text-neutral-600" : "text-neutral-400"
            }`}
          >
            {badge.name}
          </Text>
          {badge.description != null && (
            <Text className="text-[13px] text-neutral-400 mt-0.5">
              {badge.description}
            </Text>
          )}
        </View>

        <Text className="text-[13px] text-neutral-400">
          {badge.pointThreshold} puan
        </Text>
      </View>

      {!isLast && <View className="h-px bg-neutral-100 ml-[60px]" />}
    </View>
  );
}

// ─── Ekran ────────────────────────────────────────────────────────────────────

export default function MyTasksScreen() {
  const tasksQuery = useQuery({
    queryKey: ["me", "tasks"],
    queryFn: taskApi.getTodayTasks,
  });

  const summaryQuery = useQuery({
    queryKey: ["me", "points"],
    queryFn: taskApi.getMyPointsSummary,
  });

  const isLoading = tasksQuery.isLoading || summaryQuery.isLoading;
  const error = tasksQuery.error ?? summaryQuery.error;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <BackButton />

        <Text className="text-[17px] font-bold text-[#32343E]">
          Komşu Görevlerim
        </Text>

        <View className="w-[44px]" />
      </View>

      {isLoading ? (
        <View className="px-5">
          <SkeletonBox
            width={Dimensions.get("window").width - 40}
            height={120}
            borderRadius={24}
            style={{ marginBottom: 24 }}
          />
          {([0, 1, 2] as const).map((i) => (
            <View key={i} className="flex-row items-center mb-6">
              <SkeletonBox width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
              <SkeletonBox width={180} height={16} borderRadius={8} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-error text-center mb-2">
            Görevler yüklenirken bir hata oluştu.
          </Text>
          <Text className="text-neutral-400 text-center text-xs">
            {(error as Error).message}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-16"
        >
          {summaryQuery.data && (
            <SummaryCard
              totalPoints={summaryQuery.data.totalPoints}
              earnedBadgeCount={summaryQuery.data.earnedBadgeCount}
              pointsToNextBadge={summaryQuery.data.pointsToNextBadge}
              nextBadgeName={summaryQuery.data.nextBadgeName}
            />
          )}

          <Text className="text-[15px] font-bold text-[#32343E] mb-1">
            Bugünün Görevleri
          </Text>
          <Text className="text-[13px] text-neutral-400 mb-2">
            Her görev günde bir kez puan kazandırır.
          </Text>

          <View className="bg-white rounded-[18px] px-4 mb-6">
            {(tasksQuery.data ?? []).map((task, index) => (
              <TaskRow
                key={task.type}
                task={task}
                isLast={index === (tasksQuery.data?.length ?? 0) - 1}
              />
            ))}
          </View>

          <Text className="text-[15px] font-bold text-[#32343E] mb-1">
            Rozetler
          </Text>
          <Text className="text-[13px] text-neutral-400 mb-2">
            Rozetler kazandıkça, yakında mahallendeki esnaflarda indirim kazanacaksın.
          </Text>

          <View className="bg-white rounded-[18px] px-4">
            {(summaryQuery.data?.badges ?? []).map((badge, index) => (
              <BadgeRow
                key={badge.id}
                badge={badge}
                isLast={index === (summaryQuery.data?.badges.length ?? 0) - 1}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
