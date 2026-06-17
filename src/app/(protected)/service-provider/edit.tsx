import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  serviceProviderApi,
  DtoUpdateServiceProvider,
  SERVICE_CATEGORY_LABELS,
} from "@/api/serviceProvider";
import { colors } from "@/theme/color";
import {
  BackButton,
  CustomButton,
  CustomInput,
  SkeletonBox,
} from "@/components";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function UstaEditSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={130} height={22} borderRadius={11} />
        <View className="w-[40px]" />
      </View>

      <ScrollView contentContainerClassName="px-6 pb-8" showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
          <View className="mb-3">
            <SkeletonBox width={80} height={80} borderRadius={24} />
          </View>
          <SkeletonBox width={120} height={14} borderRadius={7} />
        </View>

        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="mb-5">
            <View className="mb-2">
              <SkeletonBox width={90} height={13} borderRadius={6} />
            </View>
            <SkeletonBox width={320} height={62} borderRadius={16} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── İkon Bölümü ──────────────────────────────────────────────────────────────

function TitleIconSection({ title }: { title: string }) {
  const initial = title?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <View className="items-center mb-8">
      <View className="w-[80px] h-[80px] rounded-[24px] bg-[#FFF1EE] items-center justify-center mb-2.5 border-2 border-[rgba(255,107,74,0.15)]">
        <Text className="text-[34px] font-extrabold" style={{ color: colors.primary.DEFAULT }}>
          {initial}
        </Text>
      </View>
      <Text className="text-neutral-400 text-[13px] font-medium">Profil Baş Harfi</Text>
    </View>
  );
}

// ─── Ekran ───────────────────────────────────────────────────────────────────

export default function ServiceProviderEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["myServiceProviderProfile"],
    queryFn: serviceProviderApi.getMyServiceProviderProfile,
  });

  const initializedRef = useRef(false);
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!profile || initializedRef.current) return;
    setTitle(profile.title ?? "");
    setPhone(profile.phone ?? "");
    setExperienceYears(
      profile.experienceYears != null ? String(profile.experienceYears) : "",
    );
    setPriceInfo(profile.priceInfo ?? "");
    setDescription(profile.description ?? "");
    setAvailable(profile.available);
    initializedRef.current = true;
  }, [profile]);

  const { mutate: updateProfile, isPending, error } = useMutation({
    mutationFn: (payload: DtoUpdateServiceProvider) =>
      serviceProviderApi.updateServiceProviderProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myServiceProviderProfile"] });
      queryClient.invalidateQueries({ queryKey: ["serviceProviderNearby"] });
      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => {
      Alert.alert("Hata", err.message);
    },
  });

  const onSave = () => {
    if (!title.trim()) {
      Alert.alert("Uyarı", "Başlık boş bırakılamaz.");
      return;
    }
    const years = experienceYears.trim() ? Number(experienceYears) : undefined;
    updateProfile({
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
      experienceYears: years,
      priceInfo: priceInfo.trim() || undefined,
      description: description.trim() || undefined,
      available,
    });
  };

  if (isLoading) {
    return <UstaEditSkeleton />;
  }

  if (!profile) return null;

  const isChanged =
    title.trim() !== (profile.title ?? "").trim() ||
    phone.trim() !== (profile.phone ?? "").trim() ||
    experienceYears.trim() !==
      (profile.experienceYears != null ? String(profile.experienceYears) : "") ||
    priceInfo.trim() !== (profile.priceInfo ?? "").trim() ||
    description.trim() !== (profile.description ?? "").trim() ||
    available !== profile.available;

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      {/* ── Başlık ── */}
      <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
        <BackButton />
        <Text className="text-neutral-700 text-[17px] font-bold">Bilgileri Düzenle</Text>
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
        <TitleIconSection title={title} />

        {/* Meslek — salt okunur */}
        <View className="mb-4">
          <CustomInput
            label="Meslek"
            value={SERVICE_CATEGORY_LABELS[profile.category]}
            editable={false}
            disabled
            hint="Meslek değiştirmek için destek ekibiyle iletişime geçin."
            leftIcon={<Ionicons name="briefcase-outline" size={18} color="#A0A5BA" />}
            rightIcon={<Ionicons name="lock-closed-outline" size={16} color="#A0A5BA" />}
          />
        </View>

        {/* Başlık */}
        <View className="mb-4">
          <CustomInput
            label="Başlık"
            value={title}
            onChangeText={setTitle}
            placeholder="örn. Matematik Öğretmeni"
            autoCapitalize="words"
            returnKeyType="next"
            leftIcon={<Ionicons name="text-outline" size={18} color="#A0A5BA" />}
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
            leftIcon={<Ionicons name="call-outline" size={18} color="#A0A5BA" />}
          />
        </View>

        {/* Deneyim yılı */}
        <View className="mb-4">
          <CustomInput
            label="Deneyim Yılı"
            value={experienceYears}
            onChangeText={(v) => setExperienceYears(v.replace(/[^0-9]/g, ""))}
            placeholder="örn. 8"
            keyboardType="number-pad"
            returnKeyType="next"
            leftIcon={<Ionicons name="time-outline" size={18} color="#A0A5BA" />}
          />
        </View>

        {/* Ücret bilgisi */}
        <View className="mb-4">
          <CustomInput
            label="Ücret Bilgisi"
            value={priceInfo}
            onChangeText={setPriceInfo}
            placeholder="örn. 500₺/saat veya Pazarlığa açık"
            autoCapitalize="sentences"
            returnKeyType="next"
            leftIcon={<Ionicons name="pricetag-outline" size={18} color="#A0A5BA" />}
          />
        </View>

        {/* Açıklama */}
        <View className="mb-4">
          <CustomInput
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="Verdiğin hizmeti kısaca tanıt..."
            autoCapitalize="sentences"
            returnKeyType="done"
            leftIcon={<Ionicons name="document-text-outline" size={18} color="#A0A5BA" />}
          />
        </View>

        {/* Müsaitlik */}
        <View className="mb-4 flex-row items-center justify-between rounded-[16px] px-4 py-3.5 bg-white border border-neutral-100">
          <View className="flex-row items-center gap-3 flex-1">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={20}
              color={available ? colors.primary.DEFAULT : "#A0A5BA"}
            />
            <Text className="text-[14px] font-semibold text-[#32343E]">
              Şu an iş alıyorum
            </Text>
          </View>
          <Switch
            value={available}
            onValueChange={setAvailable}
            trackColor={{ false: "#E8EAF0", true: colors.primary.light }}
            thumbColor={available ? colors.primary.DEFAULT : "#f4f3f4"}
          />
        </View>

        {/* Adres — salt okunur */}
        <View className="mb-4">
          <CustomInput
            label="Adres / Konum"
            value={profile.address}
            editable={false}
            disabled
            hint="Konum değişikliği için usta profilinizi yeniden oluşturmanız gerekir."
            leftIcon={<Ionicons name="location-outline" size={18} color="#A0A5BA" />}
            rightIcon={<Ionicons name="lock-closed-outline" size={16} color="#A0A5BA" />}
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
            Güncellenen bilgiler anında profilinize yansır.
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
          rightIcon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
