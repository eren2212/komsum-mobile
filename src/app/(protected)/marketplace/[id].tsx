import { Dimensions, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { DtoListing } from "@/api/marketplace";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

const SCREEN_W = Dimensions.get("window").width;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="px-4 pt-3 pb-2">
                <SkeletonBox width={44} height={44} borderRadius={22} />
            </View>
            {/* Aspect oranıyla ekran genişliğini doldurur */}
            <SkeletonBox width={SCREEN_W} height={SCREEN_W * 0.75} borderRadius={0} />
            <View className="px-5 pt-5">
                <SkeletonBox width={220} height={26} borderRadius={13} style={{ marginBottom: 10 }} />
                <SkeletonBox width={100} height={18} borderRadius={9} style={{ marginBottom: 20 }} />
                <View className="h-px bg-slate-100 mb-4" />
                <SkeletonBox width={160} height={14} borderRadius={7} style={{ marginBottom: 8 }} />
                <SkeletonBox width={260} height={14} borderRadius={7} style={{ marginBottom: 6 }} />
                <SkeletonBox width={200} height={14} borderRadius={7} />
            </View>
        </SafeAreaView>
    );
}

// ─── Bilgi Satırı ─────────────────────────────────────────────────────────────

function InfoRow({
    icon,
    label,
    value,
    isLast = false,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    value: string;
    isLast?: boolean;
}) {
    return (
        <View>
            <View className="flex-row items-center py-3.5">
                <View className="w-10 h-10 rounded-xl bg-[#FFF1EE] items-center justify-center mr-3.5">
                    <Ionicons name={icon} size={18} color={colors.primary.DEFAULT} />
                </View>
                <View className="flex-1">
                    <Text className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-[0.4px]">
                        {label}
                    </Text>
                    <Text className="text-[14px] text-[#32343E] font-semibold">
                        {value}
                    </Text>
                </View>
            </View>
            {!isLast && <View className="h-px bg-slate-100" />}
        </View>
    );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const listing = queryClient.getQueryData<DtoListing>(["marketplace", "listing", Number(id)]);

    if (!listing) {
        return <DetailSkeleton />;
    }

    const isSale = listing.type === "FOR_SALE";
    const sellerInitial = listing.sellerFirstName?.charAt(0)?.toUpperCase() ?? "?";

    const formattedDate = listing.createdAt
        ? new Date(listing.createdAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "—";

    const statusLabel =
        listing.status === "ACTIVE" ? "Yayında" :
            listing.status === "SOLD" ? "Satıldı" : "Kaldırıldı";

    const statusColor =
        listing.status === "ACTIVE" ? "#10B981" :
            listing.status === "SOLD" ? "#F59E0B" : "#EF4444";

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
            <StatusBar
                backgroundColor={colors.secondary.DEFAULT}
                barStyle="dark-content"
                animated={true}
            />

            {/* contentContainerClassName prop'u ile scroll içeriğinin padding'ini verdik */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-[100px]">

                {/* ── Navigasyon ── */}
                <View className="flex-row items-center justify-between px-4 py-3">
                <BackButton />

                    {/* Durum rozeti - Hex kodları dinamik olduğu için renkleri style'da tuttuk */}
                    <View
                        className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                        style={{ backgroundColor: `${statusColor}18` }}
                    >
                        <View className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: statusColor }} />
                        <Text className="text-xs font-bold" style={{ color: statusColor }}>
                            {statusLabel}
                        </Text>
                    </View>
                </View>

                {/* ── Ürün Görseli ── */}
                <View className="w-full aspect-[4/3] bg-slate-50">
                    {listing.imageUrl ? (
                        <Image
                            source={{ uri: listing.imageUrl }}
                            style={{
                                width: "95%",
                                height: "95%",
                                alignSelf: "center",
                                borderRadius: 12,
                            }}
                            transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                            cachePolicy="memory-disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="image-outline" size={48} color="#CBD5E1" />
                        </View>
                    )}

                    {/* Tür rozeti — görsel üzerinde */}
                    <View
                        className="absolute top-3 left-6 px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: isSale ? "rgba(255,255,255,0.92)" : colors.primary.DEFAULT }}
                    >
                        <Text className={`text-[11px] font-bold ${isSale ? "text-[#191970]" : "text-white"}`}>
                            {isSale ? "Satılık" : "Takas / Hediye"}
                        </Text>
                    </View>
                </View>

                {/* ── Başlık + Fiyat ── */}
                <View className="px-5 pt-5 pb-1">
                    <View className="flex-row items-start justify-between gap-3">
                        <Text className="flex-1 text-[22px] font-extrabold text-[#121223] tracking-[-0.4px] leading-7 capitalize">
                            {listing.title}
                        </Text>

                        {isSale && listing.price != null ? (
                            <View className="bg-blue-50 px-3 py-1.5 rounded-xl">
                                <Text className="text-[17px] font-extrabold text-blue-600 tracking-[-0.3px]">
                                    {Number(listing.price).toLocaleString("tr-TR", {
                                        style: "currency",
                                        currency: "TRY",
                                        minimumFractionDigits: 0,
                                    })}
                                </Text>
                            </View>
                        ) : (
                            <View className="bg-[#FFF1EE] px-3 py-1.5 rounded-xl">
                                <Text className="text-[13px] font-bold" style={{ color: colors.primary.DEFAULT }}>
                                    Ücretsiz
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Kategori + Tarih */}
                    <View className="flex-row items-center gap-2 mt-2.5 mb-5">
                        <View className="bg-slate-100 px-2 py-1 rounded-md">
                            <Text className="text-[11px] font-semibold text-slate-500">
                                {listing.category}
                            </Text>
                        </View>
                        <Text className="text-slate-300 text-xs">•</Text>
                        <Text className="text-xs text-slate-400">{formattedDate}</Text>
                    </View>
                </View>

                {/* ── Satıcı Bilgisi ── */}
                <View className="mx-5 bg-slate-50 rounded-2xl p-4 flex-row items-center mb-6">
                    <View className="w-11 h-11 rounded-full bg-[#FFF1EE] items-center justify-center mr-3.5 border-2 border-[#FF6B4A]/15">
                        <Text className="text-lg font-bold" style={{ color: colors.primary.DEFAULT }}>
                            {sellerInitial}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-[11px] text-slate-400 mb-0.5 uppercase tracking-[0.4px]">
                            Satıcı
                        </Text>
                        <Text className="text-[14px] text-[#32343E] font-semibold">
                            {listing.sellerFirstName} {listing.sellerLastName}
                        </Text>
                    </View>
                    <Ionicons name="person-circle-outline" size={20} color="#CBD5E1" />
                </View>

                {/* ── Detay Bilgileri ── */}
                <View className="px-5 mb-6">
                    <Text className="text-[15px] font-bold text-[#121223] mb-3.5">
                        İlan Detayları
                    </Text>

                    <InfoRow
                        icon="grid-outline"
                        label="Kategori"
                        value={listing.category}
                    />
                    <InfoRow
                        icon={isSale ? "pricetag-outline" : "swap-horizontal-outline"}
                        label="İlan Türü"
                        value={isSale ? "Satılık" : "Takas / Hediye"}
                    />
                    <InfoRow
                        icon="calendar-outline"
                        label="Yayın Tarihi"
                        value={formattedDate}
                        isLast
                    />
                </View>

                {/* ── Bilgi Notu ── */}
                <View className="mx-5 flex-row items-start gap-3 bg-[#FFF1EE] rounded-2xl p-4">
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary.DEFAULT} className="mt-0.5" />
                    <Text className="flex-1 text-xs text-slate-500 leading-relaxed">
                        Satıcıyla iletişime geçmek için mahallenizin ortak kanallarını kullanabilirsiniz.
                    </Text>
                </View>

            </ScrollView>

            {/* ── Sabit Alt Buton ── */}
            {/* <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-3.5 pb-7 border-t border-slate-100">
                <TouchableOpacity
                    activeOpacity={0.85}
                    className="rounded-2xl h-14 flex-row items-center justify-center gap-2.5"
                    style={{ backgroundColor: colors.primary.DEFAULT }}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text className="text-white text-base font-bold">
                        {isSale ? "Satın Almak İstiyorum" : "Takas Teklifi Ver"}
                    </Text>
                </TouchableOpacity>
            </View> */}
        </SafeAreaView>
    );
}