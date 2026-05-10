import { useRef } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { DtoEvent, EventCategory, eventApi } from "@/api/event";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

// ─── Kategori metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  EventCategory,
  { label: string; color: string; bgColor: string; iconName: string }
> = {
  SPORTS: { label: "Sağlık & Spor", color: "#0D9488", bgColor: "#CCFBF1", iconName: "fitness" },
  ARTS_MUSIC: { label: "Kültür & Sanat", color: "#7C3AED", bgColor: "#EDE9FE", iconName: "musical-notes" },
  FOOD_DRINK: { label: "Yeme & İçme", color: "#EA580C", bgColor: "#FFEDD5", iconName: "restaurant" },
  TRAVEL: { label: "Gezi & Seyahat", color: "#2563EB", bgColor: "#DBEAFE", iconName: "airplane" },
  EDUCATION: { label: "Eğitim", color: "#16A34A", bgColor: "#DCFCE7", iconName: "school" },
  OTHER: { label: "Diğer", color: "#64748B", bgColor: "#F1F5F9", iconName: "apps" },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventDetailSkeleton() {
  return (
    <View className="flex-1 bg-surface">
      <View style={{ height: 280, backgroundColor: "#EBEBF0" }} />
      <View className="bg-white rounded-t-[28px] -mt-6 px-5 pt-6 pb-4 gap-3">
        <SkeletonBox width={110} height={14} borderRadius={7} />
        <SkeletonBox width={260} height={26} borderRadius={10} />
        <SkeletonBox width={180} height={18} borderRadius={8} />
        <View className="h-[1px] bg-[#F0F1F5] my-2" />
        {[1, 2, 3, 4].map((k) => (
          <View key={k} className="flex-row items-center gap-3">
            <SkeletonBox width={36} height={36} borderRadius={18} />
            <View className="gap-1.5">
              <SkeletonBox width={80} height={12} borderRadius={6} />
              <SkeletonBox width={160} height={14} borderRadius={7} />
            </View>
          </View>
        ))}
        <View className="h-[1px] bg-[#F0F1F5] my-2" />
        <SkeletonBox width={200} height={14} borderRadius={7} />
        <SkeletonBox width={160} height={14} borderRadius={7} />
        <View style={{ height: 200, backgroundColor: "#EBEBF0", borderRadius: 16, marginTop: 8 }} />
      </View>
    </View>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  iconName: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

function InfoRow({ iconName, iconColor, iconBg, label, value }: InfoRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={iconName as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] text-neutral-300 font-medium uppercase tracking-[0.5px]">
          {label}
        </Text>
        <Text className="text-[14px] font-semibold text-[#181c2e] leading-[20px]">
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── EventDetailScreen ────────────────────────────────────────────────────────

export default function EventDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { id, eventJson } = useLocalSearchParams<{ id: string; eventJson: string }>();

  const eventId = Number(id);

  // Anlık gösterim için kart verisini cache olarak kullan
  const initial: DtoEvent | undefined = eventJson
    ? JSON.parse(decodeURIComponent(eventJson))
    : undefined;

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventApi.getEventById(eventId),
    initialData: initial,
    staleTime: 2 * 60 * 1000,
  });

  const joinAnim = useRef(new Animated.Value(1)).current;
  const bookmarkAnim = useRef(new Animated.Value(1)).current;

  // ── Participation toggle ───────────────────────────────────────────────────
  const participateMutation = useMutation({
    mutationFn: () => eventApi.toggleParticipation(eventId),
    onMutate: () => {
      Animated.sequence([
        Animated.timing(joinAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(joinAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      ]).start();
      // Optimistic update: bu sayfadaki cache
      queryClient.setQueryData<DtoEvent>(["event", eventId], (old) => {
        if (!old) return old;
        return {
          ...old,
          joinedByMe: !old.joinedByMe,
          participantCount: old.joinedByMe
            ? Math.max(0, old.participantCount - 1)
            : old.participantCount + 1,
        };
      });
      // Feed cache de güncelle
      queryClient.setQueryData<any>(["districtEvents"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((e: DtoEvent) =>
              e.id === eventId
                ? {
                  ...e,
                  joinedByMe: !e.joinedByMe,
                  participantCount: e.joinedByMe
                    ? Math.max(0, e.participantCount - 1)
                    : e.participantCount + 1,
                }
                : e
            ),
          })),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["districtEvents"] });
    },
  });

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: () => eventApi.toggleBookmark(eventId),
    onMutate: () => {
      Animated.sequence([
        Animated.timing(bookmarkAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
        Animated.spring(bookmarkAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      ]).start();
      queryClient.setQueryData<DtoEvent>(["event", eventId], (old) => {
        if (!old) return old;
        return { ...old, bookmarkedByMe: !old.bookmarkedByMe };
      });
      queryClient.setQueryData<any>(["districtEvents"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((e: DtoEvent) =>
              e.id === eventId ? { ...e, bookmarkedByMe: !e.bookmarkedByMe } : e
            ),
          })),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["districtEvents"] });
    },
  });

  // ── Harita yönlendirmesi ───────────────────────────────────────────────────
  const openDirections = () => {
    if (!event) return;
    const { latitude, longitude, location } = event;
    const label = encodeURIComponent(location);
    const url = Platform.select({
      ios: `maps://?daddr=${latitude},${longitude}&dirflg=d`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });
    Linking.openURL(url ?? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`).catch(
      () =>
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        )
    );
  };

  if (isLoading && !initial) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <EventDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!event) return null;

  const meta = CATEGORY_META[event.category] ?? CATEGORY_META.OTHER;

  return (
    <View className="flex-1 bg-surface">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        bounces
      >
        {/* Hero Image */}
        <View style={{ height: 300 }}>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={{ width: "100%", height: 300 }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <View
              style={{ width: "100%", height: 300, backgroundColor: meta.bgColor }}
              className="items-center justify-center"
            >
              <Ionicons
                name={meta.iconName as any}
                size={80}
                color={meta.color}
                style={{ opacity: 0.3 }}
              />
            </View>
          )}
          {/* Alt gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.45)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }}
          />
        </View>

        {/* White Content Card – hero'nun üstüne binecek */}
        <View
          className="bg-white rounded-t-[28px] -mt-7 px-5 pt-6"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          }}
        >
          {/* Kategori rozeti */}
          <View className="flex-row items-center gap-2 mb-3">
            <View
              className="flex-row items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ backgroundColor: meta.bgColor }}
            >
              <Ionicons name={meta.iconName as any} size={12} color={meta.color} />
              <Text className="text-[11px] font-bold" style={{ color: meta.color }}>
                {meta.label}
              </Text>
            </View>
          </View>

          {/* Başlık */}
          <Text className="text-[22px] font-bold text-[#181c2e] leading-[30px] mb-4">
            {event.title}
          </Text>

          {/* Organizatör */}
          <TouchableOpacity
            className="flex-row items-center gap-3 mb-5 p-3 rounded-[14px] bg-[#F8F9FB]"
            activeOpacity={0.75}
            onPress={() =>
              router.push({ pathname: "/(protected)/user/[id]", params: { id: String(event.authorId) } })
            }
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.secondary.DEFAULT }}
            >
              <Text className="text-[13px] font-bold text-white">
                {event.authorFirstName.charAt(0)}{event.authorLastName.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-neutral-300 font-medium">Organizatör</Text>
              <Text className="text-[14px] font-bold text-[#181c2e]">
                {event.authorFirstName} {event.authorLastName}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: colors.primary.DEFAULT + "20" }}
            >
              <Ionicons name="star" size={11} color={colors.primary.DEFAULT} />
              <Text className="text-[10px] font-bold" style={{ color: colors.primary.DEFAULT }}>
                ORGANİZATÖR
              </Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View className="h-[1px] bg-[#F0F1F5] mb-5" />

          {/* Bilgi satırları */}
          <View className="gap-4 mb-5">
            <InfoRow
              iconName="calendar"
              iconColor="#2563EB"
              iconBg="#DBEAFE"
              label="Tarih"
              value={formatFullDate(event.eventDate)}
            />
            <InfoRow
              iconName="time"
              iconColor="#7C3AED"
              iconBg="#EDE9FE"
              label="Saat"
              value={formatTime(event.eventDate)}
            />
            <InfoRow
              iconName="location"
              iconColor={colors.primary.DEFAULT}
              iconBg={colors.primary.DEFAULT + "18"}
              label="Konum"
              value={event.location}
            />
            <InfoRow
              iconName={event.priceText ? "card" : "checkmark-circle"}
              iconColor={event.priceText ? "#EA580C" : "#16A34A"}
              iconBg={event.priceText ? "#FFEDD5" : "#DCFCE7"}
              label="Ücret"
              value={event.priceText ?? "Ücretsiz"}
            />
            <InfoRow
              iconName="people"
              iconColor="#0D9488"
              iconBg="#CCFBF1"
              label="Katılımcı"
              value={
                event.participantCount === 0
                  ? "Henüz katılan yok"
                  : `${event.participantCount} kişi katılıyor`
              }
            />
            <InfoRow
              iconName="map"
              iconColor="#64748B"
              iconBg="#F1F5F9"
              label="Mahalle"
              value={event.neighborhoodName}
            />
          </View>

          {/* Açıklama */}
          {event.description ? (
            <>
              <View className="h-[1px] bg-[#F0F1F5] mb-5" />
              <View className="mb-5">
                <Text className="text-[15px] font-bold text-[#181c2e] mb-2">
                  Etkinlik Hakkında
                </Text>
                <Text className="text-[14px] text-neutral-400 leading-[22px]">
                  {event.description}
                </Text>
              </View>
            </>
          ) : null}

          {/* Divider */}
          <View className="h-[1px] bg-[#F0F1F5] mb-5" />

          {/* Harita başlığı */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[15px] font-bold text-[#181c2e]">Etkinlik Yeri</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openDirections}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: colors.primary.DEFAULT,
                shadowColor: colors.primary.DEFAULT,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Ionicons name="navigate" size={13} color="#fff" />
              <Text className="text-[12px] font-bold text-white">Yol Tarifi Al</Text>
            </TouchableOpacity>
          </View>

          {/* Harita */}
          <View
            className="rounded-[18px] overflow-hidden mb-2"
            style={{
              height: 210,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <MapView
              provider={PROVIDER_DEFAULT}
              style={{ width: "100%", height: 210 }}
              initialRegion={{
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                title={event.title}
                description={event.location}
              >
                {/* Özel işaretçi */}
                <View className="items-center">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: colors.primary.DEFAULT,
                      shadowColor: colors.primary.DEFAULT,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Ionicons name="calendar" size={20} color="#fff" />
                  </View>
                  {/* İşaretçi kuyruğu */}
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 7,
                      borderRightWidth: 7,
                      borderTopWidth: 10,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                      borderTopColor: colors.primary.DEFAULT,
                      marginTop: -1,
                    }}
                  />
                </View>
              </Marker>
            </MapView>
          </View>

          {/* Konum metni haritanın altında */}
          <View className="flex-row items-center gap-1.5 mb-6">
            <Ionicons name="location-outline" size={13} color="#A0A5BA" />
            <Text className="text-[12px] text-neutral-300 font-medium flex-1" numberOfLines={2}>
              {event.location}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating Back Button ─────────────────────────────────────────────── */}
      <BackButton
        variant="overlay"
        style={{ position: "absolute", top: insets.top + 12, left: 16 }}
      />

      {/* ── Floating Bookmark Button ─────────────────────────────────────────── */}
      <Pressable
        onPress={() => !bookmarkMutation.isPending && bookmarkMutation.mutate()}
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: bookmarkAnim }],
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.38)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={event.bookmarkedByMe ? "bookmark" : "bookmark-outline"}
            size={19}
            color={event.bookmarkedByMe ? colors.primary.DEFAULT : "#fff"}
          />
        </Animated.View>
      </Pressable>

      {/* ── Sticky Bottom Bar ────────────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          paddingTop: 14,
          paddingHorizontal: 20,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#F0F1F5",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className="flex-row items-center gap-3">
          {/* Katılımcı sayısı */}
          <View className="flex-row items-center gap-1.5 flex-1">
            <Ionicons name="people" size={16} color="#A0A5BA" />
            <Text className="text-[13px] font-semibold text-neutral-400">
              {event.participantCount > 0
                ? `${event.participantCount} katılımcı`
                : "İlk katılan sen ol!"}
            </Text>
          </View>

          {/* Katıl butonu */}
          <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => !participateMutation.isPending && participateMutation.mutate()}
              className="flex-row items-center gap-2 px-6 py-3 rounded-[16px]"
              style={{
                backgroundColor: event.joinedByMe ? "#DCFCE7" : colors.primary.DEFAULT,
                shadowColor: event.joinedByMe ? "transparent" : colors.primary.DEFAULT,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: event.joinedByMe ? 0 : 5,
              }}
            >
              <Ionicons
                name={event.joinedByMe ? "checkmark-circle" : "add-circle-outline"}
                size={18}
                color={event.joinedByMe ? "#16A34A" : "#fff"}
              />
              <Text
                className="text-[15px] font-bold"
                style={{ color: event.joinedByMe ? "#16A34A" : "#fff" }}
              >
                {event.joinedByMe ? "Katıldın ✓" : "Katıl"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
