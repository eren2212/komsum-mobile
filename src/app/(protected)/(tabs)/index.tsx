import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

import { postApi, DtoPost } from "@/api/post";
import { userApi } from "@/api/user";
import { colors } from "@/theme/color";
import { useLike } from "@/hooks/useLike";
import { SkeletonBox } from "@/components";

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
  // Küçük kalp "bounce" animasyonu
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
}

function PostCard({ post }: PostCardProps) {
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

  // ── Sponsored kartı ────────────────────────────────────────────────────────
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
          {/* Sponsorlu header banner */}
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
            {/* Author row */}
            <View className="flex-row items-start mb-3">
              <View className="w-[44px] h-[44px] rounded-full bg-primary items-center justify-center overflow-hidden">
                {post.authorAvatarUrl ? (
                  <Image
                    source={{ uri: post.authorAvatarUrl }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                    }}
                    contentFit="cover"
                    transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
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

            {/* Content */}
            <Text
              className="text-[14px] text-neutral-600 leading-[22px] mb-3"
              numberOfLines={6}
            >
              {post.content}
            </Text>

            {/* Image */}
            {post.imageUrl ? (
              <Image
                source={{ uri: post.imageUrl }}
                style={{
                  width: "100%",
                  aspectRatio: 16 / 9,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
                contentFit="cover"
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
              />
            ) : null}

            {/* CTA */}
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

            {/* Interaction bar */}
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

  // ── Normal / Yardım kartı ─────────────────────────────────────────────────
  return (
    <TouchableOpacity activeOpacity={0.95} onPress={navigateToDetail}>
      <View className="bg-white rounded-[20px] p-4 mx-4 mb-3 overflow-hidden shadow-card">
        {/* Card header */}
        <View className="flex-row items-start mb-3">
          <View
            className="w-[46px] h-[46px] rounded-full items-center justify-center overflow-hidden"
            style={{ backgroundColor: isHelp ? "#FEF3C7" : "#121223" }}
          >
            {isHelp ? (
              <Ionicons name="hand-right" size={20} color="#B45309" />
            ) : post.authorAvatarUrl ? (
              <Image
                source={{ uri: post.authorAvatarUrl }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                }}
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            ) : (
              <Text className="text-[16px] font-bold text-white">
                {getInitials(post.authorFirstName, post.authorLastName)}
              </Text>
            )}
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-[17px] font-bold text-[#181c2e]">
                {post.authorFirstName} {post.authorLastName.charAt(0)}.
              </Text>
              {isHelp && (
                <View className="bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#B45309]">
                    YARDIM
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[11px] font-medium text-[#191970] mt-0.5">
              {formatDate(post.createdAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text
          className="text-[14px] text-neutral-600 leading-[22px] mb-3"
          numberOfLines={6}
        >
          {post.content}
        </Text>

        {/* Image */}
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={{
              width: "100%",
              aspectRatio: 16 / 9,
              borderRadius: 12,
              marginBottom: 12,
            }}
            transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        ) : null}

        {/* Interaction bar */}
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

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="items-center justify-center pt-[60px] px-10">
      <View className="w-[84px] h-[84px] rounded-full bg-primary-50 items-center justify-center mb-5">
        <Ionicons name="home-outline" size={40} color={colors.primary.DEFAULT} />
      </View>
      <Text className="text-[18px] font-bold text-[#181c2e] mb-2.5 text-center">
        Mahallenden Haber Yok
      </Text>
      <Text className="text-[14px] text-neutral-300 text-center leading-[21px]">
        Henüz paylaşım yok. Bir şeyler yaz ve mahalleliyi haberdar et!
      </Text>
    </View>
  );
}

function SkeletonList() {
  return (
    <View>
      {[1, 2, 3].map((k) => (
        <PostCardSkeleton key={k} />
      ))}
    </View>
  );
}

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me", "profile", "myProfile"],
    queryFn: () => userApi.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["neighborhoodFeed"],
    queryFn: ({ pageParam }) => postApi.getFeed(pageParam as number, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DtoPost }) => <PostCard post={item} />,
    []
  );
  const keyExtractor = useCallback((item: DtoPost) => String(item.id), []);

  const ListHeader = useMemo(
    () => (
      <View
        className="bg-secondary px-6 pt-4 pb-7 rounded-bl-[32px] rounded-br-[32px] mb-4"
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
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                  }}
                  transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                  cachePolicy="memory-disk"
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={22} color="#fff" />
              )}
            </View>

            <View className="flex-1 ml-3">
              <Text className="text-[12px] font-bold text-primary tracking-[0.5px] mb-0.5">
                {profile?.firstname?.toUpperCase()}{" "}
                {profile?.lastname?.toUpperCase()}
              </Text>
              <Text className="text-[14px] text-[#676767]">
                Merhaba, Günaydın komşu 😊
              </Text>
            </View>

            {/* <TouchableOpacity
              activeOpacity={0.8}
              className="px-[14px] py-2 rounded-[10px] border border-[#98a8b8]"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text className="text-[16px] font-bold text-error tracking-[1px]">
                SOS
              </Text>
            </TouchableOpacity> */}
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, profileLoading]
  );

  const ListFooter = useMemo(() => {
    if (!isFetchingNextPage) return <View className="h-8" />;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
      </View>
    );
  }, [isFetchingNextPage]);

  const ListEmpty = useMemo(
    () => (isLoading ? <SkeletonList /> : <EmptyState />),
    [isLoading]
  );

  return (
    // 1. En dıştaki SafeAreaView'un rengini başlığınla aynı yapıyoruz (bg-secondary)
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT} // Android için
        barStyle="light-content"  // iOS ve Android'de saat/şarj yazısını beyaz yapar
        animated={true}
      />

      {/* 2. Listenin ve geri kalan sayfanın rengini koruması için FlatList'i bg-surface olan bir View içine alıyoruz */}
      <View className="flex-1 bg-surface">
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader as any}
          ListEmptyComponent={ListEmpty as any}
          ListFooterComponent={ListFooter as any}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary.DEFAULT}
              colors={[colors.primary.DEFAULT]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
