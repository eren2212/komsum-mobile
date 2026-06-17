import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  serviceProviderApi,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_ICONS,
} from "@/api/serviceProvider";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-5 pt-4 pb-6 items-center">
        <SkeletonBox width={110} height={110} borderRadius={55} style={{ marginBottom: 4 }} />
        <SkeletonBox width={160} height={24} borderRadius={12} style={{ marginBottom: 2 }} />
        <SkeletonBox width={100} height={16} borderRadius={8} style={{ marginBottom: 1.5 }} />
        <SkeletonBox width={130} height={14} borderRadius={7} style={{ marginBottom: 5 }} />
        <View className="flex-row gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={72} height={52} borderRadius={12} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── İstatistik Kutusu ────────────────────────────────────────────────────────

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center justify-center py-3">
      <Text className="text-[20px] font-extrabold text-[#121223] mb-1">{value}</Text>
      <Text className="text-xs text-slate-400 font-medium">{label}</Text>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function ServiceProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ["serviceProvider", id],
    queryFn: () => serviceProviderApi.getServiceProviderProfile(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return <DetailSkeleton />;

  if (error || !provider) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <BackButton style={{ margin: 16 }} />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="person-outline" size={48} color="#CBD5E1" />
          <Text className="text-base font-bold text-[#121223] mt-4 mb-2">
            Profil Bulunamadı
          </Text>
          <Text className="text-sm text-slate-400 text-center">
            Bu usta profili artık mevcut değil veya kaldırılmış olabilir.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = provider.title.charAt(0).toUpperCase();

  const handleCall = () => {
    if (provider.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-[100px]">
        {/* ── Üst navigasyon ── */}
        <View className="flex-row items-center px-4 py-3">
          <BackButton />
        </View>

        {/* ── Profil Başlığı ── */}
        <View className="items-center px-6 pb-6">
          <View
            className="w-[110px] h-[110px] rounded-full bg-[#FFF1EE] border-[3px] items-center justify-center mb-4 relative"
            style={{ borderColor: colors.primary.DEFAULT }}
          >
            <Ionicons
              name={SERVICE_CATEGORY_ICONS[provider.category]}
              size={44}
              color={colors.primary.DEFAULT}
            />
            {provider.verified && (
              <View className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white" />
            )}
          </View>

          <Text className="text-[22px] font-extrabold text-[#121223] text-center tracking-[-0.4px] mb-1.5">
            {provider.title}
          </Text>

          <Text className="text-[15px] font-semibold mb-2" style={{ color: colors.primary.DEFAULT }}>
            {SERVICE_CATEGORY_LABELS[provider.category]}
          </Text>

          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={14} color="#94A3B8" />
            <Text className="text-[13px] text-slate-400">{provider.address}</Text>
          </View>

          {/* Müsaitlik rozeti */}
          <View
            className={`flex-row items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full ${
              provider.available ? "bg-green-500/10" : "bg-slate-100"
            }`}
          >
            <Ionicons
              name={provider.available ? "ellipse" : "ellipse-outline"}
              size={10}
              color={provider.available ? "#22C55E" : "#94A3B8"}
            />
            <Text
              className="text-[12px] font-bold"
              style={{ color: provider.available ? "#16A34A" : "#94A3B8" }}
            >
              {provider.available ? "Şu an iş alıyor" : "Şu an müsait değil"}
            </Text>
          </View>
        </View>

        {/* ── İstatistikler ── */}
        <View className="flex-row mx-5 rounded-2xl border border-slate-100 mb-7 overflow-hidden">
          <StatBox
            value={provider.experienceYears != null ? `${provider.experienceYears}` : "—"}
            label="Yıl Deneyim"
          />
          <View className="w-px bg-slate-100" />
          <StatBox value="—" label="Puan" />
          <View className="w-px bg-slate-100" />
          <StatBox value="—" label="Yorum" />
        </View>

        {/* ── Ücret bilgisi ── */}
        {provider.priceInfo ? (
          <View className="mx-5 mb-7 flex-row items-center gap-3 bg-[#FFF1EE] rounded-2xl p-4">
            <Ionicons name="pricetag" size={20} color={colors.primary.DEFAULT} />
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400 uppercase tracking-[0.4px] mb-0.5">
                Ücret Bilgisi
              </Text>
              <Text className="text-sm text-[#32343E] font-semibold">
                {provider.priceInfo}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Açıklama ── */}
        {provider.description ? (
          <View className="px-5 mb-7">
            <Text className="text-sm text-[#4A4E5A] leading-[22px]">
              {provider.description}
            </Text>
          </View>
        ) : null}

        {/* ── İletişim Bilgileri ── */}
        <View className="px-5 mb-7">
          <Text className="text-[15px] font-bold text-[#121223] mb-3.5">
            İletişim Bilgileri
          </Text>

          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.7}
            className="flex-row items-center py-3.5 border-b border-slate-100"
          >
            <View className="w-10 h-10 rounded-xl bg-[#FFF1EE] items-center justify-center mr-3.5">
              <Ionicons name="call-outline" size={18} color={colors.primary.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-[0.4px]">
                Telefon
              </Text>
              <Text className="text-sm text-[#32343E] font-semibold">{provider.phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View className="flex-row items-center py-3.5">
            <View className="w-10 h-10 rounded-xl bg-[#FFF1EE] items-center justify-center mr-3.5">
              <Ionicons name="location-outline" size={18} color={colors.primary.DEFAULT} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-[0.4px]">
                Adres
              </Text>
              <Text className="text-sm text-[#32343E] font-semibold">{provider.address}</Text>
            </View>
          </View>
        </View>

        {/* ── Hizmet Veren ── */}
        <View className="mx-5 bg-slate-50 rounded-2xl p-4 flex-row items-center mb-6">
          <View className="w-11 h-11 rounded-full bg-[#FFF1EE] items-center justify-center mr-3.5">
            <Text className="text-lg font-bold" style={{ color: colors.primary.DEFAULT }}>
              {provider.ownerFirstName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-[0.4px]">
              Hizmet Veren
            </Text>
            <Text className="text-sm text-[#32343E] font-semibold">
              {provider.ownerFirstName} {provider.ownerLastName}
            </Text>
          </View>
          {provider.verified && (
            <View className="flex-row items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
              <Text className="text-[11px] text-green-500 font-semibold">Onaylı</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Sabit Alt Buton: Hemen Ara ── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-3.5 pb-7 border-t border-slate-100">
        <TouchableOpacity
          onPress={handleCall}
          activeOpacity={0.85}
          className="rounded-2xl h-14 flex-row items-center justify-center gap-2.5"
          style={{ backgroundColor: colors.primary.DEFAULT }}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text className="text-white text-base font-bold">Hemen Ara</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
