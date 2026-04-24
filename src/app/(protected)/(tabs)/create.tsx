import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { userApi } from "@/api/user";
import { merchantApi } from "@/api/merchant";
import { postApi, PostType } from "@/api/post";
import { uploadApi } from "@/api/upload";
import { colors } from "@/theme/color";
import { SkeletonBox } from "@/components";

// ─── Mod tipi ────────────────────────────────────────────────────────────────

type PostMode = "NORMAL" | "ESNAF";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CreateSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-100">
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <SkeletonBox width={100} height={20} borderRadius={10} />
        <SkeletonBox width={68} height={36} borderRadius={18} />
      </View>

      <View className="px-5 pt-6">
        {/* Mode cards */}
        <View className="flex-row gap-3 mb-6">
          <SkeletonBox width={160} height={88} borderRadius={16} style={{ flex: 1 }} />
          <SkeletonBox width={160} height={88} borderRadius={16} style={{ flex: 1 }} />
        </View>

        {/* Divider */}
        <SkeletonBox width={320} height={1} borderRadius={1} style={{ marginBottom: 20 }} />

        {/* Text area */}
        <View className="flex-row gap-3">
          <SkeletonBox width={40} height={40} borderRadius={20} />
          <SkeletonBox width={240} height={80} borderRadius={12} style={{ flex: 1 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Mode Card ───────────────────────────────────────────────────────────────

interface ModeCardProps {
  icon: "person" | "storefront";
  title: string;
  subtitle?: string;
  selected: boolean;
  disabled?: boolean;
  locked?: boolean;
  onPress: () => void;
}

function ModeCard({
  icon,
  title,
  subtitle,
  selected,
  disabled = false,
  locked = false,
  onPress,
}: ModeCardProps) {
  const bg = selected ? colors.primary.DEFAULT : "#FFFFFF";
  const border = selected ? colors.primary.DEFAULT : "#E8EAF0";
  const iconColor = selected ? "#FFFFFF" : disabled ? "#C0C4D0" : "#A0A5BA";
  const textColor = selected ? "#FFFFFF" : disabled ? "#C0C4D0" : "#32343E";
  const subtitleColor = selected ? "rgba(255,255,255,0.7)" : "#A0A5BA";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      className="flex-1 rounded-2xl border-[1.5px] py-3.5 px-3 items-center justify-center min-h-[88px] relative"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Kilit rozeti — sağ üst köşe */}
      {locked && (
        <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E8EAF0] items-center justify-center">
          <Ionicons name="lock-closed" size={11} color="#A0A5BA" />
        </View>
      )}

      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{
          backgroundColor: selected
            ? "rgba(255,255,255,0.2)"
            : disabled
              ? "#F5F6FA"
              : "#FFF1EE",
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <Text
        className="text-[13px] font-semibold text-center"
        style={{ color: textColor }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          className="text-[11px] text-center mt-0.5"
          style={{ color: subtitleColor }}
        >
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<PostMode>("NORMAL");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Veri ──
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
  });

  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ["me", "merchant", "myMerchantProfile"],
    queryFn: merchantApi.getMyMerchantProfile,
  });

  const isLoading = profileLoading || merchantLoading;

  // ── Esnaf profil durumu ──
  const hasNoMerchant = !merchant;
  const pendingVerification = merchant && !merchant.verified;
  const esnafLocked = hasNoMerchant || !!pendingVerification;

  const esnafSubtitle = hasNoMerchant
    ? "Esnaf Profiliniz Yok"
    : pendingVerification
      ? "Onay Bekliyor"
      : merchant.shopName;

  // ── Mutation ──
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: postApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setContent("");
      router.back();
    },
  });

  const onPickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("İzin Gerekli", "Galeri erişimine izin vermeniz gerekiyor.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const onRemoveImage = () => setImageUri(null);

  const onShare = async () => {
    if (!content.trim()) return;

    const type: PostType = mode === "ESNAF" ? "SPONSORED" : "STANDARD";
    let uploadedImageUrl: string | undefined;

    if (imageUri) {
      setIsUploadingImage(true);
      try {
        uploadedImageUrl = await uploadApi.uploadPostImage(imageUri);
      } catch {
        Alert.alert("Hata", "Fotoğraf yüklenirken sorun oluştu. Fotoğrafsız paylaşmak ister misin?", [
          { text: "İptal", style: "cancel" },
          { text: "Fotoğrafsız Paylaş", onPress: () => createPost({ content: content.trim(), type, imageUrl: undefined }) },
        ]);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    createPost({ content: content.trim(), type, imageUrl: uploadedImageUrl });
  };

  const canShare = content.trim().length > 0 && !isPending && !isUploadingImage;

  const placeholder =
    mode === "ESNAF"
      ? `${merchant?.shopName ?? "Dükkanınız"} hakkında bir şeyler paylaşın...`
      : "Mahallede ne oluyor? Bir takış, bir duyuru veya bir hizmet mi var?...";

  // ── Avatar ──
  const initials = profile
    ? profile.firstname.charAt(0).toUpperCase()
    : "?";

  if (isLoading) return <CreateSkeleton />;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT} // Sadece Android: Arka plan rengini değiştirir
        barStyle="dark-content"  // iOS ve Android: İkonların ve yazıların rengi
        animated={true}          // Renk değişirken yumuşak bir animasyon yapar
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-neutral-100">

          <Text className="text-base font-bold text-[#32343E]">
            Yeni Gönderi
          </Text>

          {/* Paylaş */}
          <TouchableOpacity
            onPress={onShare}
            disabled={!canShare}
            activeOpacity={0.85}
            className="px-[18px] py-[9px] rounded-[20px]"
            style={{ backgroundColor: canShare ? "#121223" : "#E8EAF0" }}
          >
            {isPending || isUploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className="text-[13px] font-bold"
                style={{ color: canShare ? "#FFFFFF" : "#A0A5BA" }}
              >
                Paylaş
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName="px-5 pt-5 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Mod seçici ── */}
          <View className="flex-row gap-3 mb-5">
            <ModeCard
              icon="person"
              title="Normal Kullanıcı"
              selected={mode === "NORMAL"}
              onPress={() => setMode("NORMAL")}
            />
            <ModeCard
              icon="storefront"
              title="Esnaf Profili"
              subtitle={esnafSubtitle}
              selected={mode === "ESNAF"}
              disabled={esnafLocked}
              locked={esnafLocked}
              onPress={() => {
                if (!esnafLocked) setMode("ESNAF");
              }}
            />
          </View>

          {/* ── Esnaf bilgi notu ── */}
          {mode === "ESNAF" && merchant && (
            <View className="flex-row items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-[#FFF1EE]">
              <Ionicons name="storefront" size={14} color={colors.primary.DEFAULT} />
              <Text
                className="text-xs font-semibold"
                style={{ color: colors.primary.DEFAULT }}
              >
                {merchant.shopName} adına paylaşılacak
              </Text>
            </View>
          )}

          {/* ── Ayırıcı ── */}
          <View className="h-px bg-neutral-100 mb-5" />

          {/* ── İçerik alanı ── */}
          <View className="flex-row gap-3">
            {/* Avatar */}
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }}
                contentFit="cover"
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-[#FFF1EE] items-center justify-center mt-0.5">
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.primary.DEFAULT }}
                >
                  {initials}
                </Text>
              </View>
            )}

            {/* TextInput */}
            <TextInput
              ref={inputRef}
              value={content}
              onChangeText={setContent}
              placeholder={placeholder}
              placeholderTextColor="#A0A5BA"
              multiline
              autoFocus
              className="flex-1 text-[15px] text-[#32343E] leading-[22px] min-h-[120px] pt-1"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* ── Karakter sayacı ── */}
          {content.length > 0 && (
            <Text
              className="text-right text-xs mt-2"
              style={{ color: content.length > 280 ? colors.error.DEFAULT : "#A0A5BA" }}
            >
              {content.length} / 500
            </Text>
          )}

          {/* ── Fotoğraf önizleme ── */}
          {imageUri && (
            <View className="mt-4 relative">
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: "100%",
                  aspectRatio: 16 / 9,
                  borderRadius: 12,
                }}
                contentFit="cover"
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
              />
              <TouchableOpacity
                onPress={onRemoveImage}
                activeOpacity={0.8}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Araç çubuğu ── */}
          <View className="flex-row items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
            <TouchableOpacity
              onPress={onPickImage}
              disabled={isUploadingImage}
              activeOpacity={0.7}
              className="flex-row items-center gap-2 px-4 py-2.5 rounded-[14px] bg-[#F5F6FA]"
              style={{ opacity: isUploadingImage ? 0.5 : 1 }}
            >
              <Ionicons name="image-outline" size={18} color="#646982" />
              <Text className="text-[13px] font-semibold text-[#646982]">
                {imageUri ? "Fotoğrafı Değiştir" : "Fotoğraf Ekle"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}