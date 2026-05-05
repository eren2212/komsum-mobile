import type { ComponentProps } from "react";
import { Alert, StatusBar, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { userApi } from "@/api/user";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme/color";
import { SkeletonBox } from "@/components";
// Bunu bul ve ScrollView'u içine ekle:


// Şunu SİL (Yanlış import):
// import { ScrollView } from "react-native-reanimated/lib/typescript/Animated";

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
      <StatusBar
        backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
        barStyle="light-content"  // iOS ve Android: İkonların ve yazıların rengi
        animated={true}           // Renk değişirken yumuşak bir animasyon yapar
      />
      {/* Dark header skeleton */}
      <View className="px-6 pt-4 pb-9">
        {/* Nav row */}
        <View className="flex-row items-center justify-center mb-7">
          <SkeletonBox width={80} height={22} borderRadius={11} isDark />
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
          className="w-[44px] h-[44px] rounded-lg bg-primary/20 items-center justify-center mr-4"
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
        <StatusBar
          backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
          barStyle="light-content"  // iOS ve Android: İkonların ve yazıların rengi
          animated={true}           // Renk değişirken yumuşak bir animasyon yapar
        />
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
      icon: "chatbubble-outline",
      label: "Postlarım",
      onPress: () => router.push("/profile/my-posts"),
    },
    {
      icon: "notifications-outline",
      label: "Bildirimler",
      onPress: () => { },
    },
    {
      icon: "list-outline",
      label: "İlanlarım",
      onPress: () => router.push("/profile/my-listings"),
    },
    // {
    //   icon: "card-outline",
    //   label: "Ödeme Yöntemleri",
    //   onPress: () => { },
    // },
    {
      icon: "storefront-outline",
      label: "Esnaf Profilim",
      onPress: () => router.push("/merchant/esnaf"),
    },
    {
      icon: "bookmark-outline",
      label: "Etkinlikler",
      onPress: () => router.push("/profile/my-events"),
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
      <StatusBar
        backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
        barStyle="light-content"  // iOS ve Android: İkonların ve yazıların rengi
        animated={true}           // Renk değişirken yumuşak bir animasyon yapar
      />
      {/* ── Dark header ── */}
      <View className="px-6 pt-4 pb-9">
        {/* Nav row */}
        <View className="flex-row items-center justify-center mb-7">

          <Text className="text-white text-lg font-bold text-center">Profilim</Text>

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
                  borderColor: colors.primary.light,
                  borderWidth: 0.5,
                }}
                contentFit="cover"
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                className="w-[96px] h-[96px] rounded-full border-3 border-white/20 bg-primary/20 items-center justify-center"
              >
                <Text className="text-primary text-4xl font-bold">{initials}</Text>
              </View>
            )}

          </View>

          <Text className="text-white text-xl font-bold">{fullName}</Text>
        </View>
      </View>

      {/* ── White card ── */}
      <View
        className="flex-1 bg-white overflow-hidden"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false} // Sağdaki çirkin kaydırma çubuğunu gizler
          contentContainerClassName="px-5 pt-4 pb-40" // pb-10 ile en alta nefes alma boşluğu verdik
        >
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.label}
              item={item}
              isLast={index === menuItems.length - 1}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
