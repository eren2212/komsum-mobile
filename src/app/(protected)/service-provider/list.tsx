import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  serviceProviderApi,
  DtoServiceProvider,
  ServiceCategory,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_ICONS,
} from "@/api/serviceProvider";
import { useUserLocation } from "@/hooks/useUserLocation";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

// Seçilebilir yarıçaplar (km)
const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
});

// ─── Usta Kartı ───────────────────────────────────────────────────────────────

function UstaCard({ item }: { item: DtoServiceProvider }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => router.push(`/service-provider/${item.userId}`)}
      className="bg-white rounded-[20px] p-4 mb-3 border border-neutral-100 flex-row items-center"
      style={cardShadow as object}
    >
      {/* Kategori ikonu */}
      <View className="w-[56px] h-[56px] rounded-[18px] bg-primary-50 items-center justify-center mr-4 border border-primary-100">
        <Ionicons
          name={SERVICE_CATEGORY_ICONS[item.category]}
          size={26}
          color={colors.primary.DEFAULT}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5 mb-1">
          <Text
            className="text-[16px] font-bold text-neutral-900 tracking-tight"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          )}
        </View>

        <View className="flex-row items-center gap-2 mb-1">
          <View className="bg-neutral-100 px-2 py-0.5 rounded-md">
            <Text className="text-[11px] font-semibold text-neutral-600">
              {SERVICE_CATEGORY_LABELS[item.category]}
            </Text>
          </View>
          {item.experienceYears != null && (
            <Text className="text-[11px] text-neutral-400">
              {item.experienceYears} yıl
            </Text>
          )}
          {/* Müsaitlik noktası */}
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="ellipse"
              size={8}
              color={item.available ? "#22C55E" : "#CBD5E1"}
            />
            <Text
              className="text-[11px] font-medium"
              style={{ color: item.available ? "#16A34A" : "#94A3B8" }}
            >
              {item.available ? "İş alıyor" : "Müsait değil"}
            </Text>
          </View>
        </View>

        <Text className="text-[12px] text-neutral-400" numberOfLines={1}>
          {item.priceInfo ? `${item.priceInfo} • ` : ""}
          {item.address}
        </Text>
      </View>

      <View className="w-8 h-8 rounded-full bg-neutral-50 items-center justify-center ml-2">
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <View className="px-6 pt-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="flex-row items-center mb-3 p-4 border border-neutral-100 rounded-[20px]"
        >
          <SkeletonBox width={56} height={56} borderRadius={18} style={{ marginRight: 16 }} />
          <View className="flex-1 gap-2">
            <SkeletonBox width={150} height={16} borderRadius={8} />
            <SkeletonBox width={90} height={13} borderRadius={6} />
            <SkeletonBox width={180} height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────

function EmptyState({ denied }: { denied: boolean }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="w-20 h-20 rounded-[24px] bg-[#FFF1EE] items-center justify-center mb-6">
        <Ionicons
          name={denied ? "location-outline" : "people-outline"}
          size={36}
          color={colors.primary.DEFAULT}
        />
      </View>
      <Text className="text-[20px] font-extrabold text-neutral-800 text-center mb-2">
        {denied ? "Konum Kapalı" : "Usta Bulunamadı"}
      </Text>
      <Text className="text-[14px] text-neutral-400 text-center leading-5">
        {denied
          ? "Yakınındaki ustaları görmek için konum izni ver. Şimdilik mahallendeki onaylı ustalar listeleniyor."
          : "Seçtiğin yarıçap ve kategoride henüz onaylı usta yok. Yarıçapı genişletmeyi dene."}
      </Text>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function ServiceProviderListScreen() {
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [category, setCategory] = useState<ServiceCategory | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const { coords, status, settled } = useUserLocation(true);

  const {
    data: providers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "serviceProviderNearby",
      coords?.latitude ?? null,
      coords?.longitude ?? null,
      radiusKm,
      category ?? "ALL",
    ],
    queryFn: () =>
      coords
        ? serviceProviderApi.getNearby({
            lat: coords.latitude,
            lng: coords.longitude,
            radius: radiusKm * 1000,
            category,
          })
        : serviceProviderApi.getDirectory(category),
    // Konum nihai sonuca ulaşınca (granted/denied/error) sorguyu çalıştır
    enabled: settled,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const denied = status === "denied" || status === "error";

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <StatusBar backgroundColor={colors.secondary.DEFAULT} barStyle="light-content" animated />

      {/* ── Koyu Başlık ── */}
      <View className="px-6 pt-3 pb-5 overflow-hidden">
        <View className="flex-row items-center gap-3 mb-1">
          <BackButton variant="ghost" />
          <View className="flex-1">
            <Text className="text-white text-[22px] font-extrabold tracking-tight">
              Gerekli Kişiler
            </Text>
            <Text className="text-white/60 text-[13px] font-medium">
              {coords
                ? `${radiusKm} km çevrendeki ustalar`
                : "Mahallendeki ustalar"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Filtreler (beyaz alan) ── */}
      <View className="flex-1 bg-surface rounded-t-[28px] -mt-2 pt-5">
        {/* Yarıçap (km) seçici — yalnızca konum varken anlamlı */}
        {coords ? (
          <View className="mb-1">
            <Text className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest px-6 mb-2">
              Mesafe
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            >
              {RADIUS_OPTIONS.map((km) => {
                const active = radiusKm === km;
                return (
                  <TouchableOpacity
                    key={km}
                    onPress={() => setRadiusKm(km)}
                    activeOpacity={0.8}
                    className="px-5 py-2 rounded-full border"
                    style={{
                      backgroundColor: active ? colors.primary.DEFAULT : "#FFFFFF",
                      borderColor: active ? colors.primary.DEFAULT : "#E2E8F0",
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold"
                      style={{ color: active ? "#FFFFFF" : "#191970" }}
                    >
                      {km} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Kategori çipleri */}
        <View className="mt-3 mb-2">
          <Text className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest px-6 mb-2">
            Meslek
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          >
            {/* Tümü */}
            <TouchableOpacity
              onPress={() => setCategory(undefined)}
              activeOpacity={0.8}
              className="px-4 py-2 rounded-full border flex-row items-center gap-1.5"
              style={{
                backgroundColor: !category ? colors.primary.DEFAULT : "#FFFFFF",
                borderColor: !category ? colors.primary.DEFAULT : "#E2E8F0",
              }}
            >
              <Ionicons
                name="apps-outline"
                size={14}
                color={!category ? "#FFFFFF" : "#646982"}
              />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: !category ? "#FFFFFF" : "#32343E" }}
              >
                Tümü
              </Text>
            </TouchableOpacity>

            {SERVICE_CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(active ? undefined : cat)}
                  activeOpacity={0.8}
                  className="px-4 py-2 rounded-full border flex-row items-center gap-1.5"
                  style={{
                    backgroundColor: active ? colors.primary.DEFAULT : "#FFFFFF",
                    borderColor: active ? colors.primary.DEFAULT : "#E2E8F0",
                  }}
                >
                  <Ionicons
                    name={SERVICE_CATEGORY_ICONS[cat]}
                    size={14}
                    color={active ? "#FFFFFF" : "#646982"}
                  />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: active ? "#FFFFFF" : "#32343E" }}
                  >
                    {SERVICE_CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Liste ── */}
        {isLoading || !settled ? (
          <ListSkeleton />
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 120,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary.DEFAULT}
              />
            }
            renderItem={({ item }) => <UstaCard item={item} />}
            ListEmptyComponent={<EmptyState denied={denied} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
