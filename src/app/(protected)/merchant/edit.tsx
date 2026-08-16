import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { merchantApi, DtoUpdateMerchant } from "@/api/merchant";
import { colors } from "@/theme/color";
import {
  BackButton,
  CustomButton,
  CustomInput,
  SkeletonBox,
} from "@/components";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MerchantEditSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={130} height={22} borderRadius={11} />
        <View className="w-[40px]" />
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* İkon */}
        <View className="items-center mb-8">
          <View className="mb-3">
            <SkeletonBox width={80} height={80} borderRadius={24} />
          </View>
          <SkeletonBox width={120} height={14} borderRadius={7} />
        </View>

        {[1, 2, 3].map((i) => (
          <View key={i} className="mb-5">
            <View className="mb-2">
              <SkeletonBox width={90} height={13} borderRadius={6} />
            </View>
            <SkeletonBox width={320} height={62} borderRadius={16} />
          </View>
        ))}
      </ScrollView>

      <View className="px-6 pb-8">
        <SkeletonBox width={320} height={62} borderRadius={16} />
      </View>
    </SafeAreaView>
  );
}

// ─── Mağaza İkon Bölümü ──────────────────────────────────────────────────────

function ShopIconSection({ shopName }: { shopName: string }) {
  const initial = shopName?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <View className="items-center mb-8">
      <View className="w-[80px] h-[80px] rounded-[24px] bg-[#FFF1EE] items-center justify-center mb-2.5 border-2 border-[rgba(255,107,74,0.15)]">
        <Text
          className="text-[34px] font-extrabold"
          style={{ color: colors.primary.DEFAULT }}
        >
          {initial}
        </Text>
      </View>
      <Text className="text-neutral-400 text-[13px] font-medium">
        İşletme Baş Harfi
      </Text>
    </View>
  );
}

// ─── Ekran ───────────────────────────────────────────────────────────────────

export default function MerchantEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["myMerchantProfile"],
    queryFn: merchantApi.getMyMerchantProfile,
  });

  const initializedRef = useRef(false);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!profile || initializedRef.current) return;
    setShopName(profile.shopName ?? "");
    setPhone(profile.phone ?? "");
    setDescription(profile.description ?? "");
    initializedRef.current = true;
  }, [profile]);

  const {
    mutate: updateProfile,
    isPending,
    error,
  } = useMutation({
    mutationFn: (payload: DtoUpdateMerchant) =>
      merchantApi.updateMerchantProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMerchantProfile"] });
      queryClient.invalidateQueries({ queryKey: ["merchantDirectory"] });
      Alert.alert("Başarılı", "İşletme bilgileriniz güncellendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message);
    },
  });

  const onSave = () => {
    if (!shopName.trim()) {
      Alert.alert("Uyarı", "Mağaza adı boş bırakılamaz.");
      return;
    }
    updateProfile({
      shopName: shopName.trim() || undefined,
      phone: phone.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  if (isLoading) {
    return <MerchantEditSkeleton />;
  }

  if (!profile) return null;

  const isChanged =
    shopName.trim() !== (profile.shopName ?? "").trim() ||
    phone.trim() !== (profile.phone ?? "").trim() ||
    description.trim() !== (profile.description ?? "").trim();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      {/* ── Başlık ── */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <BackButton />

        <Text className="text-neutral-700 text-[17px] font-bold">
          Bilgileri Düzenle
        </Text>

        <View className="w-[40px]" />
      </View>

      {/* ── İçerik ── */}
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <ShopIconSection shopName={shopName} />

        {/* Kategori — salt okunur */}
        <View className="mb-4">
          <CustomInput
            label="Kategori"
            value={profile.category}
            editable={false}
            disabled
            hint="Kategori değiştirmek için destek ekibiyle iletişime geçin."
            leftIcon={
              <Ionicons name="grid-outline" size={18} color="#A0A5BA" />
            }
            rightIcon={
              <Ionicons name="lock-closed-outline" size={16} color="#A0A5BA" />
            }
          />
        </View>

        {/* Mağaza Adı */}
        <View className="mb-4">
          <CustomInput
            label="Mağaza Adı"
            value={shopName}
            onChangeText={setShopName}
            placeholder="örn. Meram Etli Ekmek Salonu"
            autoCapitalize="words"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="storefront-outline" size={18} color="#A0A5BA" />
            }
          />
        </View>

        {/* Telefon */}
        <View className="mb-4">
          <CustomInput
            label="Telefon Numarası"
            value={phone}
            onChangeText={setPhone}
            placeholder="0212 XXX XX XX"
            keyboardType="phone-pad"
            returnKeyType="next"
            leftIcon={
              <Ionicons name="call-outline" size={18} color="#A0A5BA" />
            }
          />
        </View>

        {/* Açıklama */}
        <View className="mb-4">
          <CustomInput
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="İşletmenizi kısaca tanıtın..."
            autoCapitalize="sentences"
            returnKeyType="done"
            leftIcon={
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#A0A5BA"
              />
            }
          />
        </View>

        {/* Adres — salt okunur */}
        <View className="mb-4">
          <CustomInput
            label="Adres / Mahalle"
            value={profile.address}
            editable={false}
            disabled
            hint="Adres değişikliği için esnaf profilinizi yeniden oluşturmanız gerekir."
            leftIcon={
              <Ionicons name="location-outline" size={18} color="#A0A5BA" />
            }
            rightIcon={
              <Ionicons name="lock-closed-outline" size={16} color="#A0A5BA" />
            }
          />
        </View>

        {/* Bilgi kutusu */}
        <View className="flex-row items-start gap-3 rounded-2xl p-4 mb-2 bg-[#FFF1EE]">
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary.DEFAULT}
            className="mt-[1px]"
          />
          <Text className="flex-1 text-[12px] text-neutral-500 leading-[18px]">
            Güncellenen bilgiler anında profilinize yansır. Onay gerektiren
            değişiklikler için destek ekibiyle iletişime geçin.
          </Text>
        </View>

        {error ? (
          <Text className="text-red-500 text-xs mt-2 ml-1">
            {(error as Error).message}
          </Text>
        ) : null}
      </KeyboardAwareScrollView>

      {/* ── Kaydet Butonu ── */}
      <View className="px-6 pb-8 pt-2">
        <CustomButton
          label="Değişiklikleri Kaydet"
          onPress={onSave}
          loading={isPending}
          disabled={isPending || !isChanged}
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
