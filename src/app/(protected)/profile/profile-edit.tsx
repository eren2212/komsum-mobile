import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { userApi, DtoUserUpdate } from "@/api/user";
import { colors } from "@/theme/color";
import { BackButton, CustomButton, CustomInput, SkeletonBox } from "@/components";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ProfileEditSkeleton() {
  const screenW = Dimensions.get("window").width;
  const inputW = screenW - 48; // horizontal padding: 24 * 2

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={110} height={22} borderRadius={11} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View className="items-center mb-8">
          <SkeletonBox width={96} height={96} borderRadius={48} style={{ marginBottom: 12 }} />
          <SkeletonBox width={160} height={16} borderRadius={8} />
        </View>

        {/* Input skeletons */}
        {[1, 2, 3].map((i) => (
          <View key={i} className="mb-5">
            <SkeletonBox width={80} height={13} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonBox width={inputW} height={62} borderRadius={16} />
          </View>
        ))}

        {/* Şifre Değiştir row skeleton */}
        <View className="mb-5">
          <SkeletonBox width={inputW} height={62} borderRadius={16} />
        </View>
      </ScrollView>

      {/* Bottom button skeleton */}
      <View className="px-6 pb-8">
        <SkeletonBox width={inputW} height={62} borderRadius={16} />
      </View>
    </SafeAreaView>
  );
}

// ─── Avatar Section ──────────────────────────────────────────────────────────

function AvatarSection({
  avatarUrl,
  initials,
  onChangePress,
}: {
  avatarUrl?: string | null;
  initials: string;
  onChangePress: () => void;
}) {
  return (
    <View className="items-center mb-8">
      <View className="relative mb-3">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              borderWidth: 2,
              borderColor: colors.primary.light,
            }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#EEF0F5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={40} color="#A0A5BA" />
          </View>
        )}

        {/* Camera button */}
        <TouchableOpacity
          onPress={onChangePress}
          activeOpacity={0.85}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.primary.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#F5F6FA",
          }}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onChangePress} activeOpacity={0.7}>
        <Text className="text-primary text-sm font-medium">
          Profil Fotoğrafını Değiştir
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
  });

  const initializedRef = useRef(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!profile || initializedRef.current) return;
    setFirstname(profile.firstname ?? "");
    setLastname(profile.lastname ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
    initializedRef.current = true;
  }, [profile]);

  const { mutate: updateProfile, isPending, error } = useMutation({
    mutationFn: (payload: DtoUserUpdate) => userApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
      router.back();
    },
  });

  const onSave = () => {
    updateProfile({
      firstname: firstname.trim() || undefined,
      lastname: lastname.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  const onChangeAvatar = () => {
    Alert.prompt(
      "Profil Fotoğrafı",
      "Fotoğraf URL'sini girin:",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaydet",
          onPress: (value: string | undefined) => {
            if (value !== undefined) setAvatarUrl(value);
          },
        },
      ],
      "plain-text",
      avatarUrl
    );
  };

  if (isLoading) {
    return <ProfileEditSkeleton />;
  }

  if (!profile) return null;

  const initials = profile.firstname.charAt(0).toUpperCase();

  const isChanged =
    (profile.firstname ?? "").trim() !== firstname.trim() ||
    (profile.lastname ?? "").trim() !== lastname.trim();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
          <BackButton light={false} />

          <Text className="text-neutral-600 text-[17px] font-bold">
            Profili Düzenle
          </Text>

          {/* Sağ tarafı dengele */}
          <View style={{ width: 40 }} />
        </View>

        {/* ── İçerik ── */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <AvatarSection
            avatarUrl={avatarUrl || profile.avatarUrl}
            initials={initials}
            onChangePress={onChangeAvatar}
          />

          {/* Ad */}
          <View className="mb-4">
            <CustomInput
              label="Ad"
              value={firstname}
              onChangeText={setFirstname}
              placeholder="Adınız"
              autoCapitalize="words"
              leftIcon={
                <Ionicons name="person-outline" size={18} color="#A0A5BA" />
              }
            />
          </View>

          {/* Soy Ad */}
          <View className="mb-4">
            <CustomInput
              label="Soy Ad"
              value={lastname}
              onChangeText={setLastname}
              placeholder="Soyadınız"
              autoCapitalize="words"
              leftIcon={
                <Ionicons name="person-outline" size={18} color="#A0A5BA" />
              }
            />
          </View>

          {/* E-posta — salt okunur */}
          <View className="mb-4">
            <CustomInput
              label="E-posta Adresi"
              value={profile.email}
              editable={false}
              disabled
              keyboardType="email-address"
              autoCapitalize="none"
              hint="E-posta adresi güvenlik nedeniyle değiştirilemez."
              leftIcon={
                <Ionicons name="mail-outline" size={18} color="#A0A5BA" />
              }
              rightIcon={
                <Ionicons name="lock-closed-outline" size={16} color="#A0A5BA" />
              }
            />
          </View>

          {/* Şifre Değiştir — navigasyon satırı */}
          <TouchableOpacity
            onPress={() => router.push("/profile/profile-password")}
            activeOpacity={0.7}
            className="flex-row items-center h-[62px] rounded-2xl px-4 bg-white border border-neutral-100 mb-4"
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: "#FFF1EE",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="lock-closed" size={16} color={colors.primary.DEFAULT} />
            </View>

            <Text className="flex-1 text-neutral-600 text-sm font-medium">
              Şifre Değiştir
            </Text>

            <Ionicons name="chevron-forward" size={16} color="#A0A5BA" />
          </TouchableOpacity>

          {/* Hata mesajı */}
          {error ? (
            <Text className="text-error text-xs mt-1 ml-1">
              {(error as Error).message}
            </Text>
          ) : null}
        </ScrollView>

        {/* ── Kaydet butonu ── */}
        <View className="px-6 pb-8 pt-2">
          <CustomButton
            label="Değişiklikleri Kaydet"
            onPress={onSave}
            loading={isPending}
            activeOpacity={0.8}
            disabled={isPending || !isChanged}
            fullWidth
            rightIcon={
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
