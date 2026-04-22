import { useState, type ComponentProps } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { merchantApi, DtoMerchant } from "@/api/merchant";
import { colors } from "@/theme/color";
import { SkeletonBox, CustomButton } from "@/components";

// ─── Skeleton (Modernize Edilmiş) ─────────────────────────────────────────────

function EsnafSkeleton() {
    return (
        <SafeAreaView className="flex-1 bg-neutral-50" edges={["top"]}>
            <StatusBar
                backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
                barStyle="dark-content"  // iOS ve Android: İkonların ve yazıların rengi
                animated={true}           // Renk değişirken yumuşak bir animasyon yapar
            />
            <View className="px-6 pt-4 pb-12">
                <View className="flex-row items-center justify-between mb-8">
                    <SkeletonBox width={80} height={24} borderRadius={12} />
                    <SkeletonBox width={44} height={44} borderRadius={22} />
                </View>
                <View className="flex-row items-center gap-4">
                    <SkeletonBox width={72} height={72} borderRadius={24} />
                    <View className="flex-1 gap-2">
                        <SkeletonBox width={120} height={16} borderRadius={8} />
                        <SkeletonBox width={180} height={24} borderRadius={12} />
                        <SkeletonBox width={100} height={14} borderRadius={7} />
                    </View>
                </View>
            </View>
            <View className="flex-1 bg-white px-6 pt-8 rounded-t-[32px] border-t border-neutral-100 shadow-sm">
                <SkeletonBox width={160} height={20} borderRadius={10} style={{ marginBottom: 24 }} />
                {([1, 2, 3] as const).map((i) => (
                    <View key={i} className="flex-row items-center mb-6 p-4 border border-neutral-100 rounded-2xl">
                        <SkeletonBox width={50} height={50} borderRadius={16} style={{ marginRight: 16 }} />
                        <View className="gap-2 flex-1">
                            <SkeletonBox width={60} height={16} borderRadius={8} />
                            <SkeletonBox width={40} height={14} borderRadius={7} />
                        </View>
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}

// ─── Boş Durum – Profil Yok (Daha Davetkar ve Temiz) ─────────────────────────

function EsnafEmptyState({ onCreatePress }: { onCreatePress: () => void }) {
    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
            <StatusBar
                backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
                barStyle="dark-content"  // iOS ve Android: İkonların ve yazıların rengi
                animated={true}           // Renk değişirken yumuşak bir animasyon yapar
            />
            <View className="flex-1 items-center justify-center px-8">
                {/* Dekoratif Arka Planlı İkon */}
                <View className="relative items-center justify-center mb-10">
                    <View className="absolute w-[160px] h-[160px] bg-primary-50 rounded-full opacity-60" />
                    <View className="w-[100px] h-[100px] bg-primary-100 rounded-[32px] items-center justify-center rotate-3 shadow-sm">
                        <Ionicons name="storefront" size={48} color={colors.primary.DEFAULT} />
                    </View>
                    <View className="absolute -right-2 -bottom-2 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                        <Ionicons name="sparkles" size={20} color="#F59E0B" />
                    </View>
                </View>

                <Text className="text-[28px] font-extrabold text-neutral-900 text-center mb-3 tracking-tight">
                    Esnaf Profilini Aç
                </Text>
                <Text className="text-[15px] text-neutral-500 text-center leading-6 mb-12 px-2">
                    Mahallendeki komşularına ulaşmak, hizmetlerini tanıtmak ve işletmeni dijitale taşımak için hemen ücretsiz profilini oluştur.
                </Text>

                <View className="w-full mb-6">
                    <CustomButton
                        label="Hemen Oluştur"
                        onPress={onCreatePress}
                        fullWidth
                        className="py-4 rounded-2xl shadow-md"
                        rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                    />
                </View>

                <View className="flex-row items-center gap-2 bg-neutral-50 px-5 py-3.5 rounded-2xl border border-neutral-100">
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                    <Text className="text-[13px] font-medium text-neutral-600 flex-1">
                        Profiliniz admin onayından geçtikten sonra mahallenizde görünür olacaktır.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

// ─── Mahalle Esnaf Kartı (Daha Modern & Derinlikli) ──────────────────────────

function DirectoryCard({ merchant }: { merchant: DtoMerchant }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/merchant/${merchant.id}`)}
            className="bg-white rounded-[20px] p-4 mb-4 border border-neutral-100 flex-row items-center shadow-sm"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            {/* Logomsu İkon */}
            <View className="w-[56px] h-[56px] rounded-[18px] bg-primary-50 items-center justify-center mr-4 border border-primary-100">
                <Text className="text-[22px] font-black text-primary-DEFAULT">
                    {merchant.shopName.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                    <Text className="text-[16px] font-bold text-neutral-900 tracking-tight" numberOfLines={1}>
                        {merchant.shopName}
                    </Text>
                    {merchant.verified && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    )}
                </View>

                <View className="flex-row items-center gap-2 mt-0.5">
                    <View className="bg-neutral-100 px-2 py-0.5 rounded-md">
                        <Text className="text-[11px] font-semibold text-neutral-600">
                            {merchant.category}
                        </Text>
                    </View>
                    <Text className="text-[12px] text-neutral-400 flex-1" numberOfLines={1}>
                        • {merchant.address}
                    </Text>
                </View>
            </View>

            <View className="w-8 h-8 rounded-full bg-neutral-50 items-center justify-center ml-2">
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );
}

// ─── Yönetim Menüsü Satırı (iOS Tarzı Gruplanmış) ────────────────────────────

function ManageRow({
    icon,
    label,
    onPress,
    isDanger = false,
    isLast = false,
    disabled = false,
    badge,
}: {
    icon: ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress?: () => void;
    isDanger?: boolean;
    isLast?: boolean;
    disabled?: boolean;
    badge?: string;
}) {
    const iconBg = isDanger ? "#FEF2F2" : disabled ? "#F5F5F5" : "#FFF1EE";
    const iconColor = isDanger ? "#EF4444" : disabled ? "#94A3B8" : colors.primary.DEFAULT;
    const chevronColor = isDanger ? "#FCA5A5" : "#A0A5BA";

    return (
        <View>
            <TouchableOpacity
                activeOpacity={disabled ? 1 : 0.7}
                onPress={disabled ? undefined : onPress}
                className={`flex-row items-center py-4 ${disabled ? "opacity-70" : ""}`}
            >
                <View
                    className="w-[44px] h-[44px] rounded-lg bg-primary/20 items-center justify-center mr-4"
                >
                    <Ionicons name={icon} size={20} color={iconColor} />
                </View>

                <Text
                    className={`flex-1 text-[15px] font-medium ${isDanger ? "text-red-500" : disabled ? "text-neutral-400" : "text-neutral-600"
                        }`}
                >
                    {label}
                </Text>

                {badge ? (
                    <View className="bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
                        <Text className="text-[11px] text-primary-DEFAULT font-bold uppercase tracking-widest">
                            {badge}
                        </Text>
                    </View>
                ) : (
                    <Ionicons name="chevron-forward" size={18} color={chevronColor} />
                )}
            </TouchableOpacity>

            {!isLast && <View className="h-px bg-neutral-100 ml-[60px]" />}
        </View>
    );
}

// ─── Profil Görünümü (Dinamik ve Temiz) ──────────────────────────────────────

function EsnafProfile({
    profile,
    onRefresh,
    refreshing,
}: {
    profile: DtoMerchant;
    directory: DtoMerchant[];
    directoryLoading: boolean;
    onRefresh: () => void;
    refreshing: boolean;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { mutate: deleteProfile, isPending: isDeleting } = useMutation({
        mutationFn: merchantApi.deleteMyMerchantProfile,
        onSuccess: () => {
            queryClient.setQueryData(["myMerchantProfile"], null);
            queryClient.invalidateQueries({ queryKey: ["merchantDirectory"] });
        },
        onError: (err: Error) => {
            Alert.alert("Hata", err.message);
        },
    });

    const handleDeletePress = () => {
        Alert.alert(
            "Profili Kapat",
            "Esnaf profilinizi tamamen kapatmak istediğinize emin misiniz? Bu işlem geri alınamaz.",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Evet, Kapat",
                    style: "destructive",
                    onPress: () => deleteProfile(),
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
            <StatusBar
                backgroundColor="#6200EE" // Sadece Android: Arka plan rengini değiştirir
                barStyle="light-content"  // iOS ve Android: İkonların ve yazıların rengi
                animated={true}           // Renk değişirken yumuşak bir animasyon yapar
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* ── Üst Bilgi Kartı ── */}
                <View className="px-6 pt-6 pb-12 relative overflow-hidden">
                    {/* Dekoratif Efektler */}
                    <View className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-primary-DEFAULT rounded-full opacity-20 blur-3xl" />
                    <View className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-purple-500 rounded-full opacity-10 blur-2xl" />

                    <View className="flex-row items-start justify-between mb-6">
                        <View className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 self-start">
                            <Text className="text-white/90 text-[12px] font-bold uppercase tracking-widest">
                                {profile.category}
                            </Text>
                        </View>

                        {profile.verified ? (
                            <View className="flex-row items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                                <Ionicons name="checkmark-circle" size={14} color="#34D399" />
                                <Text className="text-emerald-400 text-[12px] font-bold">Onaylı</Text>
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
                                <Ionicons name="time" size={14} color="#FBBF24" />
                                <Text className="text-amber-400 text-[12px] font-bold">Onay Bekliyor</Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-white text-[32px] font-extrabold tracking-tight mb-2">
                        {profile.shopName}
                    </Text>
                    <View className="flex-row items-center gap-2 opacity-80">
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text className="text-white text-[14px] font-medium" numberOfLines={1}>
                            {profile.address}
                        </Text>
                    </View>
                </View>

                {/* ── Alt Beyaz Alan ── */}
                <View className="flex-1 bg-white px-5 pt-8 rounded-t-[36px] -mt-6">

                    {/* Gönderi Paylaşma Call-to-Action */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push("/create")}
                        className="bg-primary rounded-[20px] p-5 mb-8 flex-row items-center justify-between shadow-lg shadow-primary-500/30"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                                <Ionicons name="megaphone" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text className="text-white text-[16px] font-bold mb-0.5">Mahalleye Duyur</Text>
                                <Text className="text-white/80 text-[12px] font-medium">İşletmen adına yeni bir gönderi paylaş</Text>
                            </View>
                        </View>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                    </TouchableOpacity>

                    {/* YÖNETİM MENÜSÜ */}
                    <Text className="text-[13px] text-neutral-500 font-bold tracking-widest uppercase mb-3 ml-2">
                        İşletme Yönetimi
                    </Text>
                    <View className="mb-2 px-2">
                        <ManageRow icon="create-outline" label="Bilgileri Düzenle" onPress={() => router.push("/merchant/edit")} />
                        <ManageRow icon="images-outline" label="Gönderilerim" onPress={() => { }} />
                        <ManageRow icon="bar-chart-outline" label="İstatistikler" badge="Yakında" disabled />
                        <ManageRow icon="card-outline" label="Ödeme ve Abonelik" badge="Yakında" disabled isLast />
                    </View>

                    {/* TEHLİKELİ BÖLGE */}
                    <View className="mb-8 px-2 border border-error/10  bg-error/5 rounded-3xl">
                        <ManageRow
                            icon="trash-outline"
                            label={isDeleting ? "Kapatılıyor..." : "İşletme Profilini Kapat"}
                            onPress={handleDeletePress}
                            isDanger
                            isLast
                            disabled={isDeleting}
                        />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function EsnafScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: myProfile,
        isLoading: profileLoading,
        refetch: refetchProfile,
    } = useQuery({
        queryKey: ["myMerchantProfile"],
        queryFn: merchantApi.getMyMerchantProfile,
    });

    const {
        data: directory = [],
        isLoading: directoryLoading,
        refetch: refetchDirectory,
    } = useQuery({
        queryKey: ["merchantDirectory"],
        queryFn: merchantApi.getDirectory,
        enabled: !!myProfile,
    });

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchProfile(), refetchDirectory()]);
        setRefreshing(false);
    };

    if (profileLoading) {
        return <EsnafSkeleton />;
    }

    if (!myProfile) {
        return <EsnafEmptyState onCreatePress={() => router.push("/merchant/create")} />;
    }

    return (
        <EsnafProfile
            profile={myProfile}
            directory={directory}
            directoryLoading={directoryLoading}
            onRefresh={handleRefresh}
            refreshing={refreshing}
        />
    );
}