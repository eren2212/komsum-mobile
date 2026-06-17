import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { userApi, DtoUserUpdate } from "@/api/user";
import { uploadApi } from "@/api/upload";
import { colors } from "@/theme/color";
import {
  BackButton,
  CustomButton,
  CustomInput,
  SkeletonBox,
} from "@/components";

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
          <SkeletonBox
            width={96}
            height={96}
            borderRadius={48}
            style={{ marginBottom: 12 }}
          />
          <SkeletonBox width={160} height={16} borderRadius={8} />
        </View>

        {/* Input skeletons */}
        {[1, 2, 3].map((i) => (
          <View key={i} className="mb-5">
            <SkeletonBox
              width={80}
              height={13}
              borderRadius={6}
              style={{ marginBottom: 8 }}
            />
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
  isUploading,
  onChangePress,
}: {
  avatarUrl?: string | null;
  initials: string;
  isUploading: boolean;
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
              borderColor: colors.primary.light,
              borderWidth: 0.5,
            }}
            transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
            cachePolicy="memory-disk"
            contentFit="cover"
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

        {/* Yükleniyor overlay */}
        {isUploading && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 48,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {/* Camera button */}
        <TouchableOpacity
          onPress={onChangePress}
          disabled={isUploading}
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
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onChangePress}
        disabled={isUploading}
        activeOpacity={0.7}
      >
        <Text className="text-primary text-sm font-medium">
          {isUploading ? "Yükleniyor..." : "Profil Fotoğrafını Değiştir"}
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

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const {
    mutate: updateProfile,
    isPending,
    error,
  } = useMutation({
    mutationFn: (payload: DtoUserUpdate) => userApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "profile"] });
      router.back();
    },
  });

  const onSave = async () => {
    let finalAvatarUrl = avatarUrl;

    if (localAvatarUri) {
      setIsUploadingAvatar(true);
      try {
        finalAvatarUrl = await uploadApi.uploadAvatar(localAvatarUri);
      } catch {
        Alert.alert(
          "Hata",
          "Profil fotoğrafı yüklenirken sorun oluştu, tekrar dene.",
        );
        setIsUploadingAvatar(false);
        return;
      }
      setIsUploadingAvatar(false);
    }

    updateProfile({
      firstname: firstname.trim() || undefined,
      lastname: lastname.trim() || undefined,
      avatarUrl: finalAvatarUrl.trim() || undefined,
    });
  };

  const openAvatarFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Galeri erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalAvatarUri(result.assets[0].uri);
  };

  const openAvatarFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Kamera erişimine izin vermeniz gerekiyor.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setLocalAvatarUri(result.assets[0].uri);
  };

  const onChangeAvatar = () => {
    Alert.alert("Profil Fotoğrafı", "Nasıl eklemek istersiniz?", [
      { text: "Kamera", onPress: openAvatarFromCamera },
      { text: "Galeri", onPress: openAvatarFromGallery },
      { text: "İptal", style: "cancel" },
    ]);
  };

  if (isLoading) {
    return <ProfileEditSkeleton />;
  }

  if (!profile) return null;

  const initials = profile.firstname.charAt(0).toUpperCase();

  const isChanged =
    (profile.firstname ?? "").trim() !== firstname.trim() ||
    (profile.lastname ?? "").trim() !== lastname.trim() ||
    (profile.avatarUrl ?? "") !== avatarUrl ||
    localAvatarUri !== null;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <BackButton />

        <Text className="text-neutral-600 text-[17px] font-bold">
          Profili Düzenle
        </Text>

        {/* Sağ tarafı dengele */}
        <View style={{ width: 40 }} />
      </View>

      {/* ── İçerik ── */}
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* Avatar */}
        <AvatarSection
          avatarUrl={localAvatarUri || avatarUrl || profile.avatarUrl}
          initials={initials}
          isUploading={isUploadingAvatar}
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
            <Ionicons
              name="lock-closed"
              size={16}
              color={colors.primary.DEFAULT}
            />
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
      </KeyboardAwareScrollView>

      {/* ── Kaydet butonu ── */}
      <View className="px-6 pb-8 pt-2">
        <CustomButton
          label="Değişiklikleri Kaydet"
          onPress={onSave}
          loading={isPending}
          activeOpacity={0.8}
          disabled={isPending || !isChanged || isUploadingAvatar}
          fullWidth
          rightIcon={
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#FFFFFF"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
