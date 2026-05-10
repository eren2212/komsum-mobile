import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

import { eventApi, DtoEvent, EventCategory } from "@/api/event";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

// ─── Sekme Tanımları ──────────────────────────────────────────────────────────

type TabKey = "created" | "bookmarked" | "joined";

interface TabOption {
  key: TabKey;
  label: string;
  icon: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDesc: string;
  queryKey: string;
  queryFn: (pageNo: number) => ReturnType<typeof eventApi.getMyEvents>;
}

const TABS: TabOption[] = [
  {
    key: "created",
    label: "Oluşturduklarım",
    icon: "add-circle-outline",
    emptyIcon: "calendar-outline",
    emptyTitle: "Etkinlik Oluşturmadın",
    emptyDesc: "Mahalleniz için etkinlik oluşturduğunuzda burada görünecek.",
    queryKey: "my-created-events",
    queryFn: (p) => eventApi.getMyEvents(p, 10),
  },
  {
    key: "bookmarked",
    label: "Kaydettiklerim",
    icon: "bookmark-outline",
    emptyIcon: "bookmark-outline",
    emptyTitle: "Kayıtlı Etkinlik Yok",
    emptyDesc: "Beğendiğin etkinlikleri kaydettiğinde burada görünecek.",
    queryKey: "my-bookmarked-events",
    queryFn: (p) => eventApi.getMyBookmarkedEvents(p, 10),
  },
  {
    key: "joined",
    label: "Katıldıklarım",
    icon: "checkmark-circle-outline",
    emptyIcon: "people-outline",
    emptyTitle: "Katıldığın Etkinlik Yok",
    emptyDesc: "Etkinliklere katıldığında bunlar burada listelenecek.",
    queryKey: "my-joined-events",
    queryFn: (p) => eventApi.getMyJoinedEvents(p, 10),
  },
];

// ─── Kategori Metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  EventCategory,
  { label: string; color: string; bg: string; icon: string }
> = {
  SPORTS: { label: "Spor", color: "#0EA5E9", bg: "#E0F2FE", icon: "football" },
  ARTS_MUSIC: { label: "Sanat & Müzik", color: "#8B5CF6", bg: "#EDE9FE", icon: "musical-notes" },
  FOOD_DRINK: { label: "Yeme & İçme", color: "#F59E0B", bg: "#FEF3C7", icon: "restaurant" },
  TRAVEL: { label: "Gezi", color: "#10B981", bg: "#D1FAE5", icon: "compass" },
  EDUCATION: { label: "Eğitim", color: "#3B82F6", bg: "#DBEAFE", icon: "school" },
  OTHER: { label: "Diğer", color: "#6B7280", bg: "#F3F4F6", icon: "ellipsis-horizontal-circle" },
};

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#121223",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventListSkeleton() {
  return (
    <View
      className="bg-white rounded-[20px] mb-3 border border-[#F5F6FA] overflow-hidden"
      style={cardShadow}
    >
      {/* Görsel banner alanı */}
      <View style={{ height: 90, backgroundColor: "#F0F1F5" }} />

      <View className="p-4">
        {/* Üst satır: kategori ikonu + içerik + chevron */}
        <View className="flex-row gap-3 items-start">
          {/* Kategori ikon kutusu */}
          <SkeletonBox width={50} height={50} borderRadius={14} />

          {/* Metin alanı */}
          <View className="flex-1 gap-[7px]">
            <SkeletonBox width={62} height={11} borderRadius={4} />
            <SkeletonBox width={160} height={15} borderRadius={6} />
            <SkeletonBox width={110} height={15} borderRadius={6} />
            <SkeletonBox width={145} height={12} borderRadius={5} />
            <SkeletonBox width={105} height={12} borderRadius={5} />
          </View>

          {/* Chevron */}
          <SkeletonBox width={16} height={16} borderRadius={4} style={{ marginTop: 2 }} />
        </View>

        {/* Alt bilgi satırı */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F5F6FA]">
          <SkeletonBox width={88} height={11} borderRadius={4} />
          <SkeletonBox width={82} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// ─── Event Kart ───────────────────────────────────────────────────────────────

interface EventListCardProps {
  event: DtoEvent;
  activeTab: TabKey;
}

function EventListCard({ event, activeTab }: EventListCardProps) {
  const router = useRouter();
  const cat = CATEGORY_META[event.category] ?? CATEGORY_META.OTHER;

  const navigateToDetail = () => {
    router.push({
      pathname: "/(protected)/event/[id]",
      params: { id: String(event.id) },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={navigateToDetail}
      className="bg-white rounded-[20px] mb-3 border border-[#F5F6FA] overflow-hidden"
      style={cardShadow}
    >
      {/* Kapak fotoğrafı varsa ince bir banner */}
      {event.imageUrl ? (
        <Image
          source={{ uri: event.imageUrl }}
          style={{ width: "100%", height: 90 }}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />
      ) : null}

      <View className="p-4">
        <View className="flex-row gap-3 items-start">
          {/* Kategori ikonu */}
          <View
            className="w-[50px] h-[50px] rounded-[14px] items-center justify-center shrink-0"
            style={{ backgroundColor: cat.bg }}
          >
            <Ionicons name={cat.icon as any} size={22} color={cat.color} />
          </View>

          {/* İçerik */}
          <View className="flex-1">
            {/* Kategori etiketi */}
            <View className="flex-row items-center gap-1.5 mb-1">
              <Text className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: cat.color }}>
                {cat.label}
              </Text>
            </View>

            {/* Başlık */}
            <Text
              className="text-[15px] font-bold text-[#121223] leading-[20px] mb-2"
              numberOfLines={2}
            >
              {event.title}
            </Text>

            {/* Tarih */}
            <View className="flex-row items-center gap-1.5 mb-1">
              <Ionicons name="calendar-outline" size={13} color="#A0A5BA" />
              <Text className="text-[12px] text-[#646982]">
                {formatEventDate(event.eventDate)}
              </Text>
            </View>

            {/* Konum */}
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={13} color="#A0A5BA" />
              <Text className="text-[12px] text-[#646982]" numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color="#D1D5E0" style={{ marginTop: 2 }} />
        </View>

        {/* Alt bilgi satırı */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F5F6FA]">
          {/* Mahalle */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="home-outline" size={12} color="#A0A5BA" />
            <Text className="text-[11px] text-[#A0A5BA]">{event.neighborhoodName}</Text>
          </View>

          {/* Sağ rozet: tab'a göre değişir */}
          {activeTab === "created" && (
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#FFF1EE]">
              <Ionicons name="people-outline" size={12} color={colors.primary.DEFAULT} />
              <Text className="text-[11px] font-semibold" style={{ color: colors.primary.DEFAULT }}>
                {event.participantCount} katılımcı
              </Text>
            </View>
          )}

          {activeTab === "bookmarked" && (
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#EDE9FE]">
              <Ionicons name="bookmark" size={12} color="#8B5CF6" />
              <Text className="text-[11px] font-semibold text-[#8B5CF6]">Kaydedildi</Text>
            </View>
          )}

          {activeTab === "joined" && (
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-[#DCFCE7]">
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text className="text-[11px] font-semibold text-[#16A34A]">Katıldım</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabOption }) {
  return (
    <View className="flex-1 items-center justify-center pt-16 px-8">
      <View
        className="w-[88px] h-[88px] rounded-full items-center justify-center mb-5"
        style={{ backgroundColor: "#FFF1EE" }}
      >
        <Ionicons name={tab.emptyIcon as any} size={38} color={colors.primary.DEFAULT} />
      </View>
      <Text className="text-[17px] font-bold text-[#121223] mb-2 text-center">
        {tab.emptyTitle}
      </Text>
      <Text className="text-[13px] text-[#A0A5BA] text-center leading-[20px]">
        {tab.emptyDesc}
      </Text>
    </View>
  );
}

// ─── Sekme İçeriği ────────────────────────────────────────────────────────────

function TabContent({ tab, isActive }: { tab: TabOption; isActive: boolean }) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: [tab.queryKey],
    queryFn: ({ pageParam }) => tab.queryFn(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: isActive,
  });

  const events = data?.pages.flatMap((p) => p.content) ?? [];
  const total = data?.pages[0]?.totalElements ?? 0;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View className="px-4 pt-2">
        {[1, 2, 3].map((i) => <EventListSkeleton key={i} />)}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cloud-offline-outline" size={52} color="#A0A5BA" />
        <Text className="text-[#A0A5BA] text-center mt-4 text-sm leading-relaxed">
          {(error as Error).message ?? "Bir hata oluştu."}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => `${tab.key}-${item.id}`}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        total > 0 ? (
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-[12px] text-[#A0A5BA]">
              Toplam <Text className="font-bold text-[#646982]">{total}</Text> etkinlik
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={<EmptyState tab={tab} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-5 items-center">
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <EventListCard event={item} activeTab={tab.key} />
      )}
    />
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function MyEventsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>("created");
  const activeTabOption = TABS.find((t) => t.key === activeTab)!;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <BackButton />

        <Text className="text-[17px] font-bold text-[#32343E]">
          Etkinliklerim
        </Text>

        {/* Sağ boşluk dengesi */}
        <View className="w-[44px]" />
      </View>

      {/* ── Sekme Butonları ── */}
      <View className="bg-slate-50 px-4 pt-3 pb-0 mb-3">
        <View className="flex-row gap-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-t-[14px]"
                style={{
                  backgroundColor: active ? colors.primary.DEFAULT : "#F5F6FA",
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: active ? colors.primary.DEFAULT : "transparent",
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={active ? "#fff" : "#A0A5BA"}
                />
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: active ? "#fff" : "#A0A5BA" }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── İçerik ── */}
      {TABS.map((tab) => (
        <View
          key={tab.key}
          className="flex-1"
          style={{ display: activeTab === tab.key ? "flex" : "none" }}
        >
          <TabContent tab={tab} isActive={activeTab === tab.key} />
        </View>
      ))}
    </SafeAreaView>
  );
}
