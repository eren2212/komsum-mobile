import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { chatApi } from "@/api/chat";
import { userApi } from "@/api/user";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <View className="flex-1 bg-white px-6 pt-10 items-center gap-4">
      <SkeletonBox width={96} height={96} borderRadius={48} />
      <SkeletonBox width={180} height={22} borderRadius={8} />
      <SkeletonBox width={220} height={16} borderRadius={7} />
      <SkeletonBox width={150} height={14} borderRadius={7} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const [isSending, setIsSending] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
    staleTime: Infinity,
  });

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["neighbour", userId],
    queryFn: () => userApi.getNeighbourProfile(userId),
    enabled: !!userId,
  });

  const isOwnProfile = me?.id === userId;

  const handleMessage = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const room = await chatApi.startChat(userId);
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
      Alert.alert("Hata", "Mesaj başlatılırken bir sorun oluştu.");
    } finally {
      setIsSending(false);
    }
  };

  const initials = user
    ? `${user.firstname.charAt(0)}${user.lastname.charAt(0)}`.toUpperCase()
    : "";

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-[#f1f5f9]">
        <BackButton />
        <Text className="flex-1 text-center text-[17px] font-bold text-[#121223] mr-10">
          Profil
        </Text>
      </View>

      {isLoading ? (
        <ProfileSkeleton />
      ) : isError || !user ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Ionicons name="person-circle-outline" size={56} color="#CBD5E1" />
          <Text className="text-[15px] text-neutral-400">
            Kullanıcı bulunamadı.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + Name */}
          <View className="items-center pt-10 pb-6 px-6">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.secondary.DEFAULT }}
            >
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk"
                />
              ) : (
                <Text className="text-[32px] font-bold text-white">
                  {initials}
                </Text>
              )}
            </View>

            <Text className="text-[22px] font-bold text-[#121223] text-center">
              {user.firstname} {user.lastname}
            </Text>
          </View>

          {/* Info Card */}
          <View className="mx-5 rounded-2xl bg-[#F8F9FB] px-5 py-4 gap-4">
            {/* Email */}
            <View className="flex-row items-center gap-3">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary.DEFAULT + "18" }}
              >
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={colors.primary.DEFAULT}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-neutral-300 font-medium uppercase tracking-wide">
                  E-posta
                </Text>
                <Text className="text-[14px] font-semibold text-[#181c2e]">
                  {user.email}
                </Text>
              </View>
            </View>

            {/* Mahalle */}
            {user.neighborhood && (
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#DBEAFE" }}
                >
                  <Ionicons name="map-outline" size={17} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-neutral-300 font-medium uppercase tracking-wide">
                    Mahalle
                  </Text>
                  <Text className="text-[14px] font-semibold text-[#181c2e]">
                    {user.neighborhood.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Bio */}
            {user.bio ? (
              <View className="flex-row items-start gap-3">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#DCFCE7" }}
                >
                  <Ionicons name="person-outline" size={17} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-neutral-300 font-medium uppercase tracking-wide">
                    Hakkında
                  </Text>
                  <Text className="text-[14px] font-semibold text-[#181c2e] leading-[20px]">
                    {user.bio}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Mesaj At */}
          {!isOwnProfile && (
            <View className="mx-5 mt-5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleMessage}
                disabled={isSending}
                className="flex-row items-center justify-center gap-2 py-4 rounded-2xl"
                style={{
                  backgroundColor: colors.primary.DEFAULT,
                  opacity: isSending ? 0.7 : 1,
                  shadowColor: colors.primary.DEFAULT,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                )}
                <Text className="text-white text-[15px] font-bold">
                  {isSending ? "Açılıyor..." : "Mesaj At"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
