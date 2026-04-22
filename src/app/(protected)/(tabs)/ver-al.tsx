import { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { marketplaceApi, DtoListing, ListingType } from "@/api/marketplace";
import { colors } from "@/theme/color";
import { SkeletonBox } from "@/components";

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = (SCREEN_W - 48 - 12) / 2; // 2 col, 24px h-padding × 2, 12px gap

// Ortak Gölge Stilleri
const cardShadow = Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 3 },
});

const searchShadow = Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    android: { elevation: 2 },
});

// ─── Skeleton ────────────────────────────────────────────────────────────────

function FeedSkeleton() {
    return (
        <View className="flex-row flex-wrap px-6 pt-4 gap-3 bg-surface">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ width: CARD_W }}>
                    <SkeletonBox width={CARD_W} height={CARD_W} borderRadius={15} style={{ marginBottom: 20 }} />
                    <SkeletonBox width={CARD_W * 0.7} height={16} borderRadius={8} style={{ marginBottom: 1.5 }} />
                    <SkeletonBox width={CARD_W * 0.4} height={14} borderRadius={7} />
                </View>
            ))}
        </View>
    );
}

// ─── Tip Rozeti ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ListingType }) {
    const isSale = type === "FOR_SALE";
    return (
        <View
            className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full"
            style={{
                backgroundColor: isSale ? "rgba(255,255,255,0.9)" : colors.primary.DEFAULT,
            }}
        >
            <Text
                className="text-[10px] font-bold"
                style={{ color: isSale ? "#191970" : "#FFFFFF" }}
            >
                {isSale ? "Satılık" : "Takas"}
            </Text>
        </View>
    );
}

// ─── İlan Kartı ──────────────────────────────────────────────────────────────

function ListingCard({ item }: { item: DtoListing }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const onPress = () => {
        // Detay sayfası açılmadan önce veriyi cache'e yaz (endpoint olmadığı için)
        queryClient.setQueryData(["marketplace", "listing", item.id], item);
        router.push(`/marketplace/${item.id}`);
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                width: CARD_W,
                ...(cardShadow as any), // Platform spesifik gölgeyi buraya ekledik
            }}
            // Kartı sarmalayan ana kapsayıcı (beyaz arka plan ve yumuşak köşeler)
            className="mb-5 bg-white rounded-[18px] border border-neutral-100/80 overflow-hidden"
        >
            {/* 1. Resim Alanı */}
            <View
                className="relative w-full bg-slate-50"
                style={{ height: CARD_W }}
            >
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="flex-1 items-center justify-center bg-slate-100">
                        <Ionicons name="image-outline" size={32} color="#94A3B8" />
                    </View>
                )}

                {/* Badge: Resmin üzerine, sol üst veya sağ üst köşeye hizalı ve daha şık */}
                <View className="absolute top-2.5 left-2.5">
                    <TypeBadge type={item.type} />
                </View>
            </View>

            {/* 2. İçerik (Metin) Alanı */}
            <View className="p-3.5">
                <Text
                    className="text-[15px] font-bold text-neutral-800 capitalize mb-1.5 leading-tight"
                    numberOfLines={2}
                >
                    {item.title}
                </Text>

                <View className="flex-row items-center justify-between mt-0.5">
                    {item.type === "FOR_SALE" && item.price != null ? (
                        <Text className="text-[16px] font-extrabold text-blue-600 tracking-tight">
                            {Number(item.price).toLocaleString("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                                minimumFractionDigits: 0,
                            })}
                        </Text>
                    ) : (
                        // Kategori için hap (pill) tasarımı
                        <View className="flex-row items-center bg-neutral-100 px-2 py-1 rounded-md">
                            <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                            <Text className="text-[12px] font-medium text-neutral-600 ml-1 capitalize">
                                {item.category}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Boş Durum ───────────────────────────────────────────────────────────────

function EmptyState({ onAddPress }: { onAddPress: () => void }) {
    return (
        <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="w-20 h-20 rounded-[24px] bg-[#FFF1EE] items-center justify-center mb-6">
                <Ionicons name="storefront-outline" size={36} color={colors.primary.DEFAULT} />
            </View>
            <Text className="text-[20px] font-extrabold text-neutral-800 text-center mb-2">
                Henüz İlan Yok
            </Text>
            <Text className="text-[14px] text-neutral-400 text-center mb-8 leading-5">
                Mahallenizden henüz ilan paylaşılmamış. İlk ilanı sen ver!
            </Text>
            <TouchableOpacity
                onPress={onAddPress}
                activeOpacity={0.8}
                className="flex-row items-center gap-2 px-6 py-3.5 rounded-2xl"
                style={{ backgroundColor: colors.primary.DEFAULT }}
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text className="text-white font-bold text-[15px]">İlan Ver</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

type FilterTab = "TRADE_GIFT" | "FOR_SALE";

export default function VerAlScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<FilterTab>("TRADE_GIFT");
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["marketplace", "feed"],
        queryFn: () => marketplaceApi.getFeed(0, 40),
    });

    const allListings = data?.content ?? [];

    const filtered = allListings.filter((item) => {
        const matchesTab = item.type === activeTab;
        const matchesSearch =
            !search.trim() ||
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.category.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
            <StatusBar
                backgroundColor={colors.secondary.DEFAULT} // Sadece Android: Arka plan rengini değiştirir
                barStyle="light-content"  // iOS ve Android: İkonların ve yazıların rengi
                animated={true}           // Renk değişirken yumuşak bir animasyon yapar
            />
            {/* ── Koyu Başlık ── */}
            <View className="px-6 pt-5 pb-6 overflow-hidden">
                {/* Dekoratif köşe çizgisi */}
                <View
                    className="absolute top-2.5 right-2.5 w-[100px] h-[100px] border-t-2 border-r-2 border-dashed rounded-tr-[20px] opacity-30"
                    style={{ borderColor: colors.primary.DEFAULT }}
                />

                {/* Başlık + İlan Ekle */}
                <View className="flex-row items-center justify-between mb-5">
                    <Text className="text-white text-[24px] font-extrabold tracking-tight">
                        Mahalle Dayanışması
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push("/marketplace/create")}
                        activeOpacity={0.8}
                        className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-[12px]"
                        style={{ backgroundColor: colors.primary.DEFAULT }}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text className="text-white text-[13px] font-bold">İlan Ekle</Text>
                    </TouchableOpacity>
                </View>

                {/* Arama */}
                <View className="relative">
                    <View
                        className="flex-row items-center h-12 rounded-2xl px-4 gap-3 bg-white"
                        style={searchShadow}
                    >
                        <Ionicons name="search-outline" size={20} color="#94A3B8" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Ürün veya kategori ara..."
                            placeholderTextColor="#6B7280"
                            className="flex-1 text-[14px] text-neutral-700"
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
                                <Ionicons name="close-circle" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* ── Filtre Sekmeleri ── */}
            <View className="flex-row px-6 pt-5 pb-3 gap-2 bg-surface justify-center items-center">
                {(
                    [
                        { value: "TRADE_GIFT", label: "Takas" },
                        { value: "FOR_SALE", label: "Satılık" },
                    ] as { value: FilterTab; label: string }[]
                ).map((tab) => {
                    const active = activeTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            onPress={() => setActiveTab(tab.value)}
                            activeOpacity={0.8}
                            className="px-7 py-2 rounded-full border"
                            style={{
                                backgroundColor: active ? colors.primary.DEFAULT : "#FFFFFF",
                                borderColor: active ? colors.primary.DEFAULT : "#E2E8F0",
                            }}
                        >
                            <Text
                                className="text-[16px] font-bold"
                                style={{ color: active ? "#FFFFFF" : "#191970" }}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* ── İçerik ── */}
            {isLoading ? (
                <FeedSkeleton />
            ) : (
                <FlatList
                    className="flex-1 bg-surface"
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingBottom: 120,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />
                    }
                    renderItem={({ item }) => <ListingCard item={item} />}
                    ListEmptyComponent={
                        <EmptyState onAddPress={() => router.push("/marketplace/create")} />
                    }
                    ListFooterComponent={
                        isLoading ? (
                            <ActivityIndicator color={colors.primary.DEFAULT} className="mt-4" />
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}