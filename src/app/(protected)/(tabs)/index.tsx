import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { Image } from "expo-image";

import { postApi, DtoPost, PostType } from "@/api/post";
import { eventApi, DtoEvent } from "@/api/event";
import { userApi } from "@/api/user";
import { chatApi } from "@/api/chat";
import { colors } from "@/theme/color";
import { useLike } from "@/hooks/useLike";
import { useUserLocation } from "@/hooks/useUserLocation";
import { EventCard, EventCardCompactSkeleton, SkeletonBox } from "@/components";

// ─── Yarıçap (KM) seçenekleri ───────────────────────────────────────────────
// Esnaf (SPONSORED) ve Etkinlik sekmelerinde kullanıcı yakınlık yarıçapını seçer.
const RADIUS_OPTIONS_KM = [2, 5, 10, 25];
const DEFAULT_RADIUS_KM = 5;

// ─── Filtre Tipleri ───────────────────────────────────────────────────────────

type FilterKey = "ALL" | "SPONSORED" | "HELP_REQUEST" | "EVENT";

interface FilterOption {
  key: FilterKey;
  label: string;
  icon: string;
}

const FILTERS: FilterOption[] = [
  { key: "ALL", label: "Hepsi", icon: "home" },
  { key: "SPONSORED", label: "Esnaf", icon: "storefront" },
  { key: "HELP_REQUEST", label: "Eşya Ödünç", icon: "hand-right" },
  { key: "EVENT", label: "Etkinlik", icon: "calendar" },
];

// ─── FeedItem Union ───────────────────────────────────────────────────────────

type FeedItem =
  | { kind: "post"; item: DtoPost }
  | { kind: "event"; item: DtoEvent };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ─── LikeButton ───────────────────────────────────────────────────────────────

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
}

function LikeButton({ isLiked, likeCount, onPress }: LikeButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="flex-row items-center gap-[5px]"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={18}
          color={isLiked ? "#EF4444" : "#A0A5BA"}
        />
      </Animated.View>
      <Text
        className="text-[12px] font-semibold"
        style={{ color: isLiked ? "#EF4444" : "#A0A5BA" }}
      >
        {likeCount > 0 ? likeCount : "Beğen"}
      </Text>
    </Pressable>
  );
}

// ─── PostCard Skeleton ─────────────────────────────────────────────────────────

function PostCardSkeleton() {
  return (
    <View className="bg-white rounded-[20px] p-4 mx-4 mb-3 overflow-hidden shadow-card">
      <View className="flex-row items-start mb-3">
        <SkeletonBox width={46} height={46} borderRadius={23} />
        <View className="flex-1 ml-3 gap-1.5">
          <SkeletonBox width={110} height={16} borderRadius={8} />
          <SkeletonBox width={70} height={12} borderRadius={6} />
        </View>
      </View>
      <View className="mb-1.5">
        <SkeletonBox width={280} height={14} borderRadius={7} />
      </View>
      <View className="mb-4">
        <SkeletonBox width={220} height={14} borderRadius={7} />
      </View>
      <View className="flex-row items-center justify-between pt-2.5 border-t border-surface">
        <SkeletonBox width={80} height={14} borderRadius={7} />
        <SkeletonBox width={100} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: DtoPost;
  onAuthorPress?: (authorId: number) => void;
}

function PostCard({ post, onAuthorPress }: PostCardProps) {
  const { isLiked, likeCount, toggle } = useLike(post.id, post.likedByMe, post.likeCount);
  const router = useRouter();
  const isSponsored = post.type === "SPONSORED";
  const isHelp = post.type === "HELP_REQUEST";

  const navigateToDetail = () => {
    router.push({
      pathname: "/(protected)/post/[id]",
      params: { id: String(post.id), postJson: JSON.stringify(post) },
    });
  };

  if (isSponsored) {
    return (
      <TouchableOpacity activeOpacity={0.95} onPress={navigateToDetail}>
        <View
          className="mx-4 mb-3 rounded-[20px] overflow-hidden"
          style={{
            backgroundColor: "#FFF8F6",
            borderWidth: 1.5,
            borderColor: "#FF6B4A",
            shadowColor: "#FF6B4A",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View className="bg-primary px-4 py-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="storefront" size={14} color="#fff" />
              <Text className="text-[12px] font-bold text-white tracking-[0.5px]">
                SPONSORLU İLAN
              </Text>
            </View>
            {post.shopName ? (
              <Text className="text-[11px] text-white/80 font-medium">
                {post.shopName}
              </Text>
            ) : null}
          </View>

          <View className="p-4">
            <View className="flex-row items-start mb-3">
              <View className="w-[44px] h-[44px] rounded-full bg-primary items-center justify-center overflow-hidden">
                {post.authorAvatarUrl ? (
                  <Image
                    source={{ uri: post.authorAvatarUrl }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <Text className="text-[16px] font-bold text-white">
                    {getInitials(post.authorFirstName, post.authorLastName)}
                  </Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-[16px] font-bold text-[#181c2e] mb-0.5">
                  {post.authorFirstName} {post.authorLastName.charAt(0)}.
                </Text>
                <Text className="text-[11px] font-medium text-[#191970]">
                  {formatDate(post.createdAt)}
                </Text>
              </View>
            </View>

            <Text className="text-[14px] text-neutral-600 leading-[22px] mb-3" numberOfLines={6}>
              {post.content}
            </Text>

            {post.imageUrl ? (
              <Image
                source={{ uri: post.imageUrl }}
                style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, marginBottom: 12 }}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              className="bg-primary rounded-[12px] py-[11px] items-center mb-3"
              style={{
                shadowColor: "#FF6B4A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="pricetag-outline" size={14} color="#fff" />
                <Text className="text-[14px] font-bold text-white tracking-[0.5px]">
                  Kampanyaları Gör
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center pt-2.5 border-t border-[#FFE8E0] gap-4">
              <LikeButton isLiked={isLiked} likeCount={likeCount} onPress={toggle} />
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center gap-[5px]"
                onPress={navigateToDetail}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#A0A5BA" />
                <Text className="text-[12px] font-semibold text-neutral-300">
                  {post.commentCount > 0 ? post.commentCount : "Yorum"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={navigateToDetail}>
      <View className="bg-white rounded-[20px] p-4 mx-4 mb-3 overflow-hidden shadow-card">
        <View className="flex-row items-start mb-3">
          <TouchableOpacity
            activeOpacity={post.authorId && onAuthorPress ? 0.7 : 1}
            onPress={() => {
              if (post.authorId && onAuthorPress) onAuthorPress(post.authorId);
            }}
            className="w-[46px] h-[46px] rounded-full items-center justify-center overflow-hidden"
            style={{ backgroundColor: isHelp ? "#FEF3C7" : "#121223" }}
          >
            {isHelp ? (
              <Ionicons name="hand-right" size={20} color="#B45309" />
            ) : post.authorAvatarUrl ? (
              <Image
                source={{ uri: post.authorAvatarUrl }}
                style={{ width: 46, height: 46, borderRadius: 23 }}
                transition={300}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            ) : (
              <Text className="text-[16px] font-bold text-white">
                {getInitials(post.authorFirstName, post.authorLastName)}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-[17px] font-bold text-[#181c2e]">
                {post.authorFirstName} {post.authorLastName.charAt(0)}.
              </Text>
              {isHelp && (
                <View className="bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#B45309]">YARDIM</Text>
                </View>
              )}
            </View>
            <Text className="text-[11px] font-medium text-[#191970] mt-0.5">
              {formatDate(post.createdAt)}
            </Text>
          </View>
        </View>

        <Text className="text-[14px] text-neutral-600 leading-[22px] mb-3" numberOfLines={6}>
          {post.content}
        </Text>

        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, marginBottom: 12 }}
            transition={300}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        ) : null}

        <View className="flex-row items-center justify-between pt-2.5 border-t border-surface">
          <View className="flex-row items-center gap-4">
            <LikeButton isLiked={isLiked} likeCount={likeCount} onPress={toggle} />
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row items-center gap-[5px]"
              onPress={navigateToDetail}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#A0A5BA" />
              <Text className="text-[12px] font-semibold text-neutral-300">
                {post.commentCount > 0 ? post.commentCount : "Yorum"}
              </Text>
            </TouchableOpacity>
          </View>

          {isHelp ? (
            <TouchableOpacity
              activeOpacity={0.85}
              className="px-4 py-2 rounded-[16px] border-[1.5px] border-[rgba(0,200,30,0.55)] bg-white"
            >
              <Text className="text-[12px] font-bold text-neutral-600 tracking-[0.5px]">
                YARDIM ET
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Header User Skeleton ─────────────────────────────────────────────────────

function HeaderUserSkeleton() {
  return (
    <View className="flex-row items-center">
      <SkeletonBox width={44} height={44} borderRadius={22} isDark />
      <View className="flex-1 ml-3 gap-1.5">
        <SkeletonBox width={120} height={13} borderRadius={6} isDark />
        <SkeletonBox width={160} height={12} borderRadius={6} isDark />
      </View>
      <SkeletonBox width={54} height={33} borderRadius={10} isDark />
    </View>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  option: FilterOption;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ option, active, onPress }: FilterChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        className="flex-row items-center gap-1.5 mr-2 px-4 py-2 rounded-full"
        style={
          active
            ? {
              backgroundColor: colors.primary.DEFAULT,
              shadowColor: colors.primary.DEFAULT,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }
            : {
              backgroundColor: "#fff",
              borderWidth: 1.5,
              borderColor: "#E8EAF0",
            }
        }
      >
        <Ionicons
          name={option.icon as any}
          size={14}
          color={active ? "#fff" : "#A0A5BA"}
        />
        <Text
          className="text-[13px] font-semibold"
          style={{ color: active ? "#fff" : "#646982" }}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── RadiusSelector (KM chip'leri) ─────────────────────────────────────────────

interface RadiusSelectorProps {
  valueKm: number;
  onChange: (km: number) => void;
}

function RadiusSelector({ valueKm, onChange }: RadiusSelectorProps) {
  return (
    <View className="flex-row items-center gap-2 mx-4 mt-3 mb-1">
      <View className="flex-row items-center gap-1">
        <Ionicons name="navigate" size={13} color={colors.primary.DEFAULT} />
        <Text className="text-[12px] font-semibold text-[#646982]">Yakınımdakiler</Text>
      </View>
      <View className="flex-row gap-1.5 flex-1 justify-end">
        {RADIUS_OPTIONS_KM.map((km) => {
          const active = km === valueKm;
          return (
            <TouchableOpacity
              key={km}
              onPress={() => onChange(km)}
              activeOpacity={0.8}
              className="px-3 py-1.5 rounded-full"
              style={
                active
                  ? { backgroundColor: colors.primary.DEFAULT }
                  : { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E8EAF0" }
              }
            >
              <Text
                className="text-[12px] font-bold"
                style={{ color: active ? "#fff" : "#646982" }}
              >
                {km} km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── LocationBanner (izin reddi / fallback uyarısı) ─────────────────────────────

function LocationBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center gap-2 mx-4 mt-3 mb-1 px-3 py-2.5 rounded-[12px] bg-[#FEF3C7]">
      <Ionicons name="location-outline" size={15} color="#B45309" />
      <Text className="text-[12px] font-medium text-[#B45309] flex-1">
        Konum kapalı — mahallene göre gösteriyoruz.
      </Text>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
        <Text className="text-[12px] font-bold text-[#B45309] underline">Konumu Aç</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ isEvent }: { isEvent?: boolean }) {
  return (
    <View className="items-center justify-center pt-[60px] px-10">
      <View className="w-[84px] h-[84px] rounded-full bg-primary-50 items-center justify-center mb-5">
        <Ionicons
          name={isEvent ? "calendar-outline" : "home-outline"}
          size={40}
          color={colors.primary.DEFAULT}
        />
      </View>
      <Text className="text-[18px] font-bold text-[#181c2e] mb-2.5 text-center">
        {isEvent ? "Yakında Etkinlik Yok" : "Mahallenden Haber Yok"}
      </Text>
      <Text className="text-[14px] text-neutral-300 text-center leading-[21px]">
        {isEvent
          ? "İlçende henüz aktif etkinlik bulunmuyor. Yakında bir şeyler planlanıyor olabilir!"
          : "Henüz paylaşım yok. Bir şeyler yaz ve mahalleliyi haberdar et!"}
      </Text>
    </View>
  );
}

function SkeletonList({ isEvent }: { isEvent?: boolean }) {
  if (isEvent) {
    return (
      <View className="pt-1">
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}
          >
            <EventCardCompactSkeleton />
            <EventCardCompactSkeleton />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View>
      {[1, 2, 3].map((k) => <PostCardSkeleton key={k} />)}
    </View>
  );
}

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const isEventMode = activeFilter === "EVENT";

  // Esnaf (SPONSORED) ve Etkinlik sekmeleri konuma göre çalışır.
  const usesLocation = activeFilter === "SPONSORED" || isEventMode;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me", "profile", "myProfile"],
    queryFn: () => userApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Konum ─────────────────────────────────────────────────────────────────
  // Konuma ihtiyaç duyan bir sekmeye geçilince otomatik izin iste; reddedilirse
  // backend mahalle/ilçe fallback'ine düşer (lat/lng gönderilmez).
  const { coords, status: locStatus, settled: locSettled, request: requestLocation } =
    useUserLocation();

  useEffect(() => {
    if (usesLocation) requestLocation();
  }, [usesLocation, requestLocation]);

  const radiusMeters = radiusKm * 1000;
  const hasCoords = locStatus === "granted" && !!coords;
  // İzin reddedildiğinde gösterilecek fallback uyarısı (konum gerektiren sekmelerde)
  const showLocationBanner = usesLocation && (locStatus === "denied" || locStatus === "error");

  // ── Posts query (tip filtreliyle) ─────────────────────────────────────────
  const postType: PostType | undefined =
    activeFilter === "SPONSORED" ? "SPONSORED" :
      activeFilter === "HELP_REQUEST" ? "HELP_REQUEST" :
        activeFilter === "ALL" ? undefined :
          undefined;

  const isSponsored = activeFilter === "SPONSORED";
  // SPONSORED'da yakınlık kullanılır → konum çözülene (granted/denied) kadar bekle ki
  // önce konumsuz sonra konumlu olmak üzere çift fetch / titreme olmasın.
  const postsEnabled = !isEventMode && (!isSponsored || locSettled);

  const postsQuery = useInfiniteQuery({
    queryKey: [
      "neighborhoodFeed",
      activeFilter,
      isSponsored ? radiusKm : null,
      isSponsored && hasCoords ? coords : null,
    ],
    queryFn: ({ pageParam }) =>
      postApi.getFeed(
        pageParam as string | null,
        10,
        postType,
        isSponsored && hasCoords ? coords!.latitude : undefined,
        isSponsored && hasCoords ? coords!.longitude : undefined,
        radiusMeters,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: postsEnabled,
    staleTime: 3 * 60 * 1000, // 3 dk boyunca fresh — chip değişiminde yeniden fetch yok
  });

  // ── Events query (yakınlık bazlı; konum yoksa ilçe fallback) ────────────────
  const eventsQuery = useInfiniteQuery({
    queryKey: ["nearbyEvents", radiusKm, hasCoords ? coords : null],
    queryFn: ({ pageParam }) =>
      eventApi.getNearbyEvents(
        hasCoords ? coords!.latitude : undefined,
        hasCoords ? coords!.longitude : undefined,
        radiusMeters,
        pageParam as number,
        10,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: isEventMode && locSettled,
    staleTime: 3 * 60 * 1000, // 3 dk boyunca fresh — tekrar Etkinlik'e gelinince yeniden fetch yok
  });

  // ── Feed items (birleşik union type) ───────────────────────────────────────
  const feedItems = useMemo<FeedItem[]>(() => {
    if (isEventMode) {
      return (eventsQuery.data?.pages.flatMap((p) => p.content) ?? []).map(
        (e) => ({ kind: "event", item: e })
      );
    }
    return (postsQuery.data?.pages.flatMap((p) => p.content) ?? []).map(
      (p) => ({ kind: "post", item: p })
    );
  }, [isEventMode, eventsQuery.data, postsQuery.data]);

  // Konum gerektiren bir sekmede izin/konum henüz çözülmediyse skeleton göster
  // (boş durum yerine), aksi halde "sonuç yok" anlık olarak yanıp sönerdi.
  const waitingForLocation = usesLocation && !locSettled;
  const isLoading =
    (isEventMode ? eventsQuery.isLoading : postsQuery.isLoading) || waitingForLocation;
  const isFetchingNext = isEventMode ? eventsQuery.isFetchingNextPage : postsQuery.isFetchingNextPage;
  const hasNextPage = isEventMode ? eventsQuery.hasNextPage : postsQuery.hasNextPage;
  const fetchNextPage = isEventMode ? eventsQuery.fetchNextPage : postsQuery.fetchNextPage;
  const refetch = isEventMode ? eventsQuery.refetch : postsQuery.refetch;
  const isRefetching = isEventMode ? eventsQuery.isRefetching : postsQuery.isRefetching;

  // ── PART 2: "N yeni gönderi" rozeti ─────────────────────────────────────────
  // Sayım mahalle-ALL scope'unda (backend, kendi postların hariç). Yalnızca ALL
  // sekmesinde gösterilir; SPONSORED (mesafe bazlı) ve Etkinlik akışına uygulanmaz.
  const listRef = useRef<FlatList>(null);

  const newCountQuery = useQuery({
    queryKey: ["neighborhoodFeed", "newCount"],
    queryFn: () => postApi.getFeedNewCount(),
    enabled: activeFilter === "ALL" && !!postsQuery.data,
    refetchInterval: 45_000,
    staleTime: 30_000,
  });

  const newCount = activeFilter === "ALL" && !isEventMode ? newCountQuery.data ?? 0 : 0;
  const showNewPill = newCount > 0;

  // Ekran her odaklandığında sayacı tazele (arka plandan dönüş / sekme değişimi).
  useFocusEffect(
    useCallback(() => {
      if (activeFilter === "ALL") newCountQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter])
  );

  // En yeni yüklü post'u "görüldü" olarak işaretle ve sayacı sıfırla.
  const markNewestSeen = useCallback(
    async (data?: typeof postsQuery.data) => {
      const newest = data?.pages?.[0]?.content?.[0];
      if (newest) {
        await postApi.markFeedSeen(newest.id).catch(() => {});
        newCountQuery.refetch();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  // "N yeni gönderi" → tepeye kaydır, akışı tazele, görüldü işaretle.
  const handleNewPostsPress = useCallback(async () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    const res = await postsQuery.refetch();
    await markNewestSeen(res.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postsQuery.refetch, markNewestSeen]);

  // Pull-to-refresh: tazele + (ALL modunda) görüldü işaretle.
  const handleRefresh = useCallback(async () => {
    const res = await refetch();
    if (!isEventMode && activeFilter === "ALL") {
      await markNewestSeen((res as any)?.data);
    }
  }, [refetch, isEventMode, activeFilter, markNewestSeen]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNext) fetchNextPage();
  }, [hasNextPage, isFetchingNext, fetchNextPage]);

  const handleAuthorPress = useCallback(
    async (authorId: number) => {
      if (authorId === profile?.id) return; // Kendine mesaj atılamaz
      try {
        const room = await chatApi.startChat(authorId);
        router.push({
          pathname: "/(protected)/chat/[roomId]",
          params: {
            roomId: String(room.id),
            otherUserFirstName: room.otherUserFirstName,
            otherUserLastName: room.otherUserLastName,
            otherUserAvatarUrl: room.otherUserAvatarUrl ?? "",
          },
        });
      } catch {
        // Sessizce geç — hata durumunda kullanıcı mesajlar sekmesine gidebilir
      }
    },
    [profile?.id, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.kind === "event") return <EventCard event={item.item} compact />;
      return <PostCard post={item.item} onAuthorPress={handleAuthorPress} />;
    },
    [handleAuthorPress]
  );

  const keyExtractor = useCallback(
    (item: FeedItem) =>
      item.kind === "event" ? `event-${item.item.id}` : `post-${item.item.id}`,
    []
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {/* ── Koyu başlık kartı ─────────────────────────────────────────── */}
        <View
          className="bg-secondary px-6 pt-4 pb-6 rounded-bl-[32px] rounded-br-[32px]"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-[26px] font-bold text-white tracking-[0.3px]">
              Mahallem
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/notifications")}
              className="w-10 h-10 rounded-full bg-white/[0.12] items-center justify-center"
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {profileLoading ? (
            <HeaderUserSkeleton />
          ) : (
            <View className="flex-row items-center">
              <View className="w-[46px] h-[46px] rounded-full bg-white/[0.15] items-center justify-center overflow-hidden">
                {profile?.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={{ width: 46, height: 46, borderRadius: 23 }}
                    transition={300}
                    cachePolicy="memory-disk"
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={22} color="#fff" />
                )}
              </View>

              <View className="flex-1 ml-3">
                <Text className="text-[12px] font-bold text-primary tracking-[0.5px] mb-0.5">
                  {profile?.firstname?.toUpperCase()} {profile?.lastname?.toUpperCase()}
                </Text>
                <Text className="text-[14px] text-[#676767]">
                  Merhaba, Günaydın komşu 😊
                </Text>
              </View>
            </View>
          )}

          {profile?.neighborhood ? (
            <View className="flex-row items-center self-start mt-3 px-2.5 py-1 rounded-full bg-primary/[0.15] gap-1">
              <Ionicons name="location-sharp" size={12} color={colors.primary.DEFAULT} />
              <Text className="text-[11px] text-primary font-semibold">
                {profile.neighborhood.name}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Filtre Chipleri ──────────────────────────────────────────────── */}
        <View
          className="bg-surface"
          style={{
            paddingTop: 14,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#E8EAF0",
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                option={f}
                active={activeFilter === f.key}
                onPress={() => setActiveFilter(f.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Yakınlık (KM) seçici — Esnaf ve Etkinlik sekmelerinde */}
        {usesLocation && (
          <RadiusSelector valueKm={radiusKm} onChange={setRadiusKm} />
        )}

        {/* Konum reddedildiyse fallback uyarısı */}
        {showLocationBanner && <LocationBanner onRetry={requestLocation} />}

        {/* Etkinlik modu açıklaması + Etkinlik Ekle butonu */}
        {isEventMode && (
          <View className="flex-row items-center gap-2 mx-4 mt-3 mb-4">
            <View className="flex-row items-center gap-2 flex-1 px-3 py-2.5 rounded-[12px] bg-[#CCFBF1]">
              <Ionicons name="map-outline" size={15} color="#0D9488" />
              <Text className="text-[12px] font-semibold text-[#0D9488] flex-1">
                {profile?.neighborhood
                  ? `${profile.neighborhood.name} ve çevre etkinlikleri`
                  : "İlçendeki yaklaşan etkinlikler"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/event/create")}
              activeOpacity={0.85}
              className="flex-row items-center gap-1.5 px-3 py-2.5 rounded-[12px]"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text className="text-[12px] font-bold text-white">Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, profileLoading, activeFilter, isEventMode, router, usesLocation, radiusKm, showLocationBanner, requestLocation]
  );

  const ListFooter = useMemo(() => {
    if (!isFetchingNext) return <View className="h-8" />;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
      </View>
    );
  }, [isFetchingNext]);

  const ListEmpty = useMemo(
    () =>
      isLoading ? (
        <SkeletonList isEvent={isEventMode} />
      ) : (
        <EmptyState isEvent={isEventMode} />
      ),
    [isLoading, isEventMode]
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT}
        barStyle="light-content"
        animated={true}
      />

      <View className="flex-1 bg-surface">
        {/* PART 2: "N yeni gönderi" yüzen rozeti (yalnızca ALL akışı) */}
        {showNewPill && (
          <View
            style={{ position: "absolute", top: 12, left: 0, right: 0, alignItems: "center", zIndex: 20 }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={handleNewPostsPress}
              activeOpacity={0.9}
              className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
              style={{
                backgroundColor: colors.primary.DEFAULT,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Ionicons name="arrow-up" size={14} color="#fff" />
              <Text className="text-[13px] font-bold text-white">
                {newCount} yeni gönderi
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={listRef}
          key={isEventMode ? "event-grid" : "post-list"}
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={isEventMode ? 2 : 1}
          columnWrapperStyle={isEventMode ? { paddingHorizontal: 16, gap: 8 } : undefined}
          ListHeaderComponent={ListHeader as any}
          ListEmptyComponent={ListEmpty as any}
          ListFooterComponent={ListFooter as any}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}

          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
