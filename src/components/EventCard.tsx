import { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { DtoEvent, EventCategory, eventApi } from "@/api/event";
import { colors } from "@/theme/color";
import { SkeletonBox } from "./SkeletonBox";

// ─── Kategori Metadata ────────────────────────────────────────────────────────

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

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

function formatEventDate(iso: string): { dayDate: string; time: string } {
  const date = new Date(iso);
  const dayDate = date.toLocaleDateString("tr-TR", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { dayDate, time };
}

const PARTICIPANT_COLORS = ["#FF6B4A", "#121223", "#0D9488", "#7C3AED", "#2563EB"];

// ─── EventCard Skeleton ───────────────────────────────────────────────────────
export function EventCardSkeleton() {
  return (
    <View
      className="bg-white rounded-[24px] mx-4 mb-4 overflow-hidden border border-[#F2F2F7]"
      style={{
        shadowColor: "#09090B", // Çok hafif, premium bir gölge rengi
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      {/* 1. Görsel Alanı (Event Cover) - Biraz daha yüksek tutuldu, ferah görünüm için */}
      <View className="h-[220px] w-full bg-[#F4F5F7]" />

      {/* 2. İçerik Alanı */}
      <View className="p-5">

        {/* Üst Bilgi (Kategori & Tarih) */}
        <View className="flex-row items-center justify-between mb-3">
          <SkeletonBox width={100} height={14} borderRadius={6} />
          {/* Sağ üstte ufak bir badge/ikon simülasyonu */}
          <SkeletonBox width={32} height={14} borderRadius={6} />
        </View>

        {/* Etkinlik Başlığı (Sabit px yerine yüzdelik kullanmak büyük ekranlarda patlamayı önler) */}
        <View className="mb-4 gap-y-2">
          <SkeletonBox width={85} height={22} borderRadius={8} />
          <SkeletonBox width={50} height={22} borderRadius={8} />
        </View>

        {/* Etiketler / Lokasyon */}
        <View className="flex-row gap-x-2 mb-1">
          <SkeletonBox width={80} height={24} borderRadius={8} />
          <SkeletonBox width={60} height={24} borderRadius={8} />
        </View>

        {/* Alt Kısım: Katılımcılar, Fiyat & Buton */}
        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-[#F2F2F7]">

          <View className="flex-row items-center gap-x-3">
            {/* Yuvarlak Avatar Simülasyonu (Kimin düzenlediği vb.) */}
            <SkeletonBox width={32} height={32} borderRadius={16} />
            <View className="gap-y-1">
              <SkeletonBox width={60} height={12} borderRadius={4} />
              <SkeletonBox width={40} height={10} borderRadius={4} />
            </View>
          </View>

          {/* Action Butonu */}
          <SkeletonBox width={96} height={38} borderRadius={18} />

        </View>
      </View>
    </View>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: DtoEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const bookmarkAnim = useRef(new Animated.Value(1)).current;
  const joinAnim = useRef(new Animated.Value(1)).current;

  const meta = CATEGORY_META[event.category] ?? CATEGORY_META.OTHER;
  const { dayDate, time } = formatEventDate(event.eventDate);

  const navigateToDetail = () => {
    router.push({
      pathname: "/(protected)/event/[id]",
      params: { id: String(event.id), eventJson: encodeURIComponent(JSON.stringify(event)) },
    });
  };

  const bookmarkMutation = useMutation({
    mutationFn: () => eventApi.toggleBookmark(event.id),
    onMutate: () => {
      Animated.sequence([
        Animated.timing(bookmarkAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
        Animated.spring(bookmarkAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      ]).start();
      queryClient.setQueryData<any>(["districtEvents"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((e: DtoEvent) =>
              e.id === event.id ? { ...e, bookmarkedByMe: !e.bookmarkedByMe } : e
            ),
          })),
        };
      });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["districtEvents"] }),
  });

  const participateMutation = useMutation({
    mutationFn: () => eventApi.toggleParticipation(event.id),
    onMutate: () => {
      Animated.sequence([
        Animated.timing(joinAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
        Animated.spring(joinAnim, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      ]).start();
      queryClient.setQueryData<any>(["districtEvents"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((e: DtoEvent) =>
              e.id === event.id
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
    onError: () => queryClient.invalidateQueries({ queryKey: ["districtEvents"] }),
  });

  const visibleAvatars = Math.min(event.participantCount, 3);
  const extraCount = event.participantCount - visibleAvatars;

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      onPress={navigateToDetail}
      className={`bg-white rounded-[18px] overflow-hidden mb-3 flex-col ${compact ? "flex-1" : "mx-4"}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* ── Fotoğraf Alanı ───────────────────────────────────────────────────── */}
      <View className={`w-full relative ${compact ? "h-[155px]" : "h-[200px]"}`}>
        {event.imageUrl ? (
          <Image
            source={{ uri: event.imageUrl }}
            style={{ width: "100%", height: compact ? 155 : 200 }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View
            className="absolute inset-0 w-full h-full items-center justify-center"
            style={{ backgroundColor: meta.bgColor }}
          >
            <Ionicons
              name={meta.iconName as any}
              size={compact ? 40 : 56}
              color={meta.color}
              style={{ opacity: 0.35 }}
            />
          </View>
        )}

        {/* Resmin Üzerine Binen Alt Gradient ve Yazar Adı */}

        <View className="flex-row items-center gap-1 absolute bottom-4 left-2">
          <Text
            className={`text-white font-bold ${compact ? "text-[12px]" : "text-[14px]"}`}
            numberOfLines={1}
          >
            {event.authorFirstName}
          </Text>
          <View
            className={`items-center justify-center rounded-full ${compact ? "w-[18px] h-[18px]" : "w-[22px] h-[22px]"
              }`}
            style={{ backgroundColor: colors.primary.DEFAULT }}
          >
            <Ionicons name="star" size={compact ? 9 : 11} color="#fff" />
          </View>
        </View>

        {/* Bookmark butonu */}
        <Pressable
          onPress={() => !bookmarkMutation.isPending && bookmarkMutation.mutate()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute top-2 right-2"
        >
          <Animated.View
            className={`items-center justify-center bg-black/35 rounded-full ${compact ? "w-[28px] h-[28px]" : "w-[34px] h-[34px]"
              }`}
            style={{ transform: [{ scale: bookmarkAnim }] }}
          >
            <Ionicons
              name={event.bookmarkedByMe ? "bookmark" : "bookmark-outline"}
              size={compact ? 14 : 18}
              color={event.bookmarkedByMe ? colors.primary.DEFAULT : "#fff"}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* ── İçerik Alanı (Sabit Yükseklikli Flex Yapısı) ──────────────────────── */}
      <View className={`flex-1 flex-col justify-between ${compact ? "p-[10px]" : "p-4 pb-5"
        }`}>
        <View>
          {/* Kategori */}
          <Text
            className="text-[10px] font-bold mb-[3px]"
            style={{ color: meta.color }}
            numberOfLines={1}
          >
            {meta.label}
          </Text>

          {/* Başlık - SABİT YÜKSEKLİK VERİLDİ (Sekmeyi engeller) */}
          <View className={`justify-start ${compact ? "h-[36px] mb-[2px]" : "h-[48px] mb-1"}`}>
            <Text
              className={`font-extrabold text-[#181c2e] ${compact ? "text-[13px] leading-[18px]" : "text-[17px] leading-[24px]"
                }`}
              numberOfLines={2}
            >
              {event.title}
            </Text>
          </View>

          {/* Fiyat */}
          {event.priceText ? (
            <Text
              className={`text-[11px] text-[#A0A5BA] font-medium ${compact ? "mb-[5px]" : "mb-2"
                }`}
              numberOfLines={1}
            >
              {event.priceText} TL
            </Text>
          ) : (
            <View
              className={`flex-row items-center gap-[3px] ${compact ? "mb-[5px]" : "mb-2"
                }`}
            >
              <Ionicons name="checkmark-circle" size={11} color="#16A34A" />
              <Text className="text-[11px] font-semibold text-[#16A34A]">Ücretsiz</Text>
            </View>
          )}

          {/* Tarih ve Saat */}
          <View className="flex-row items-center gap-[3px] mb-[2px]">
            <Ionicons name="calendar-outline" size={11} color="#A0A5BA" />
            <Text className="text-[11px] text-[#A0A5BA] font-medium" numberOfLines={1}>
              {dayDate}
            </Text>
          </View>

          <View className="flex-row items-center gap-[3px] mb-[2px]">
            <Ionicons name="time-outline" size={11} color="#A0A5BA" />
            <Text className="text-[11px] text-[#A0A5BA] font-medium">{time}</Text>
          </View>

          {/* Konum */}
          <View className="flex-row items-center gap-[3px]">
            <Ionicons name="location-outline" size={11} color="#A0A5BA" />
            <Text
              className="text-[11px] text-[#A0A5BA] font-medium flex-1"
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        </View>

        {/* Alt bar - mt-auto (veya dış flex-1 wrapper) ile HZİALI VE DİPTE kalır */}
        <View
          className={`flex-row items-center justify-between    w-full h-10 ${compact ? "mt-2" : "mt-3"
            }`}
        >
          {/* Katılımcı çemberleri */}
          <View className="flex-row items-center  ">
            {event.participantCount === 0 ? (
              <Text className="text-[10px] text-[#A0A5BA]">Katılımcı yok</Text>
            ) : (
              <>
                {Array.from({ length: visibleAvatars }).map((_, i) => (
                  <View
                    key={i}
                    className={`border-2 border-white items-center justify-center rounded-full ${compact ? "w-[22px] h-[22px]" : "w-[28px] h-[28px]"
                      } ${i === 0 ? "ml-0" : compact ? "-ml-[6px]" : "-ml-2"}`}
                    style={{
                      backgroundColor: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
                      zIndex: visibleAvatars - i,
                    }}
                  >
                    <Ionicons name="person" size={compact ? 9 : 12} color="#fff" />
                  </View>
                ))}
                {extraCount > 0 && (
                  <View
                    className={`border-2 border-white items-center justify-center bg-[#E8EAF0] rounded-full ${compact ? "w-[22px] h-[22px] -ml-[6px]" : "w-[28px] h-[28px] -ml-2"
                      }`}
                  >
                    <Text className="text-[9px] font-bold text-[#646982]">
                      +{extraCount}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Buton kısmı */}
          <View className="justify-center">
            {compact ? (
              <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
                <Pressable
                  onPress={() => !participateMutation.isPending && participateMutation.mutate()}
                  className={`w-7 h-7 rounded-full items-center justify-center ${event.joinedByMe ? "bg-[#DCFCE7]" : ""
                    }`}
                  style={{
                    backgroundColor: event.joinedByMe ? undefined : colors.primary.DEFAULT,
                  }}
                >
                  <Ionicons
                    name={event.joinedByMe ? "checkmark" : "add"}
                    size={14}
                    color={event.joinedByMe ? "#16A34A" : "#fff"}
                  />
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: joinAnim }] }}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => !participateMutation.isPending && participateMutation.mutate()}
                  className={`px-[14px] py-[7px] rounded-2xl flex-row items-center gap-[5px] ${event.joinedByMe ? "bg-[#DCFCE7]" : ""
                    }`}
                  style={{
                    backgroundColor: event.joinedByMe ? undefined : colors.primary.DEFAULT,
                    shadowColor: event.joinedByMe ? "transparent" : colors.primary.DEFAULT,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: event.joinedByMe ? 0 : 3,
                  }}
                >
                  <Ionicons
                    name={event.joinedByMe ? "checkmark-circle" : "add-circle-outline"}
                    size={14}
                    color={event.joinedByMe ? "#16A34A" : "#fff"}
                  />
                  <Text
                    className={`text-[12px] font-bold ${event.joinedByMe ? "text-[#16A34A]" : "text-white"
                      }`}
                  >
                    {event.joinedByMe ? "Katıldın" : "Katıl"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}