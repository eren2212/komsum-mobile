import type { ComponentProps } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { userApi } from "@/api/user";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme/color";
import { SkeletonBox } from "@/components";
import { BackButton } from "@/components";

// ─── Types ───────────────────────────────────────────────────────────────────

type IconName = ComponentProps<typeof Ionicons>["name"];

interface MenuItemConfig {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

// ─── ProfileSkeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      {/* Dark header skeleton */}
      <View className="px-6 pt-4 pb-9">
        {/* Nav row */}
        <View className="flex-row items-center justify-between mb-7">
          <SkeletonBox width={45} height={45} borderRadius={22} isDark />
          <SkeletonBox width={80} height={22} borderRadius={11} isDark />
          <SkeletonBox width={45} height={45} borderRadius={22} isDark />
        </View>

        {/* Avatar + name */}
        <View className="items-center gap-3">
          <SkeletonBox width={96} height={96} borderRadius={48} isDark />
          <SkeletonBox width={140} height={24} borderRadius={12} isDark />
        </View>
      </View>

      {/* White card skeleton */}
      <View
        className="flex-1 bg-white px-5 pt-8"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        {([130, 100, 110, 150, 80] as const).map((labelW, i) => (
          <View key={i} className="flex-row items-center mb-6">
            <SkeletonBox width={44} height={44} borderRadius={12} style={{ marginRight: 16 }} />
            <SkeletonBox width={labelW} height={16} borderRadius={8} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

function MenuItem({ item, isLast }: { item: MenuItemConfig; isLast: boolean }) {
  return (
    <View>
      <TouchableOpacity
        onPress={item.onPress}
        activeOpacity={0.7}
        className="flex-row items-center py-4"
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#FFF1EE",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <Ionicons name={item.icon} size={20} color={colors.primary.DEFAULT} />
        </View>

        <Text
          className={`flex-1 text-[15px] font-medium ${item.danger ? "text-primary" : "text-neutral-600"
            }`}
        >
          {item.label}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={item.danger ? colors.primary.DEFAULT : "#A0A5BA"}
        />
      </TouchableOpacity>

      {!isLast && <View className="h-px bg-neutral-100 ml-[60px]" />}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
  });

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: () => {
            queryClient.clear();
            logout();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-error text-center mb-2">
            Profil yüklenirken bir hata oluştu.
          </Text>
          <Text className="text-neutral-400 text-center text-xs">
            {(error as Error).message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const fullName = `${profile.firstname} ${profile.lastname}`;
  const initials = profile.firstname.charAt(0).toUpperCase();

  const menuItems: MenuItemConfig[] = [
    {
      icon: "person-outline",
      label: "Kişisel Bilgiler",
      onPress: () => router.push("/profile/profile-edit"),
    },
    {
      icon: "heart-outline",
      label: "Favorilerim",
      onPress: () => { },
    },
    {
      icon: "notifications-outline",
      label: "Bildirimler",
      onPress: () => { },
    },
    {
      icon: "card-outline",
      label: "Ödeme Yöntemleri",
      onPress: () => { },
    },
    {
      icon: "log-out-outline",
      label: "Çıkış Yap",
      onPress: handleLogout,
      danger: true,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      {/* ── Dark header ── */}
      <View className="px-6 pt-4 pb-9">
        {/* Nav row */}
        <View className="flex-row items-center justify-between mb-7">
          <BackButton light={false} />

          <Text className="text-white text-lg font-bold">Profilim</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 45,
              height: 45,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Avatar + name */}
        <View className="items-center">
          <View className="relative mb-3">
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 3,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "rgba(255,107,74,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "rgba(255,107,74,0.3)",
                }}
              >
                <Text className="text-primary text-4xl font-bold">{initials}</Text>
              </View>
            )}

            {/* Edit button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.primary.DEFAULT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-xl font-bold">{fullName}</Text>
        </View>
      </View>

      {/* ── White card ── */}
      <View
        className="flex-1 bg-white px-5 pt-4"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.label}
            item={item}
            isLast={index === menuItems.length - 1}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
