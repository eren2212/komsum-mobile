import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { marketplaceApi, DtoListing, ListingStatus } from "@/api/marketplace";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";

const SCREEN_W = Dimensions.get("window").width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Durum Konfigürasyonu ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ListingStatus, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Yayında", bg: "#DCFCE7", text: "#16A34A" },
  SOLD: { label: "Satıldı", bg: "#FEF3C7", text: "#B45309" },
  DELETED: { label: "Kaldırıldı", bg: "#FEE2E2", text: "#DC2626" },
};

// Ortak Gölge Stili
const cardShadow = Platform.select({
  ios: { shadowColor: "#121223", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListingCardSkeleton() {
  const cardW = SCREEN_W - 40;
  return (
    <View
      className="bg-white rounded-[20px] p-4 mb-3 flex-row gap-3 border border-slate-50"
      style={cardShadow}
    >
      <SkeletonBox width={80} height={80} borderRadius={14} />
      <View className="flex-1 gap-2">
        <SkeletonBox width={cardW * 0.55} height={16} borderRadius={8} />
        <SkeletonBox width={70} height={22} borderRadius={11} />
        <View className="flex-row justify-between">
          <SkeletonBox width={80} height={14} borderRadius={7} />
          <SkeletonBox width={60} height={14} borderRadius={7} />
        </View>
      </View>
    </View>
  );
}

// ─── İlan Kartı ───────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: DtoListing;
  onStatusChange: (id: number, status: ListingStatus) => void;
  isUpdating: boolean;
}

function ListingCard({ listing, onStatusChange, isUpdating }: ListingCardProps) {
  const isSale = listing.type === "FOR_SALE";
  const statusCfg = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.ACTIVE;

  const handleStatusPress = () => {
    const options: { text: string; status: ListingStatus }[] = [];

    if (listing.status !== "ACTIVE")
      options.push({ text: "Yayına Al", status: "ACTIVE" });
    if (listing.status !== "SOLD" && isSale)
      options.push({ text: "Satıldı Olarak İşaretle", status: "SOLD" });
    if (listing.status !== "DELETED")
      options.push({ text: "İlanı Kaldır", status: "DELETED" });

    Alert.alert(
      "Durum Güncelle",
      "Bu ilanın durumunu değiştirmek istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        ...options.map((o) => ({
          text: o.text,
          style: o.status === "DELETED" ? ("destructive" as const) : ("default" as const),
          onPress: () => onStatusChange(listing.id, o.status),
        })),
      ]
    );
  };

  return (
    <View
      className="bg-white rounded-[20px] p-3.5 mb-3 flex-row gap-3 border border-slate-50"
      style={cardShadow}
    >
      {/* Küçük görsel */}
      <View className="w-20 h-20 rounded-[14px] bg-slate-50 overflow-hidden shrink-0">
        {listing.imageUrl ? (
          <Image
            source={{ uri: listing.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#CBD5E1" />
          </View>
        )}
      </View>

      {/* Sağ içerik */}
      <View className="flex-1">
        {/* Başlık + tarih */}
        <View className="flex-row items-start justify-between mb-1.5">
          <Text
            numberOfLines={2}
            className="flex-1 text-[15px] font-bold text-[#32343E] leading-5 mr-2 capitalize"
          >
            {listing.title}
          </Text>
          <Text className="text-[11px] text-[#A0A5BA] shrink-0 mt-0.5">
            {formatDate(listing.createdAt)}
          </Text>
        </View>

        {/* Tip + fiyat */}
        <View className="flex-row items-center gap-1.5 mb-2.5">
          <View
            className="flex-row items-center gap-1 px-2 py-1 rounded-xl"
            style={{ backgroundColor: isSale ? "#EFF6FF" : "#FFF1EE" }}
          >
            <Ionicons
              name={isSale ? "pricetag-outline" : "swap-horizontal-outline"}
              size={11}
              color={isSale ? "#2563EB" : colors.primary.DEFAULT}
            />
            <Text
              className="text-[11px] font-semibold"
              style={{ color: isSale ? "#2563EB" : colors.primary.DEFAULT }}
            >
              {isSale ? "Satılık" : "Takas"}
            </Text>
          </View>

          {isSale && listing.price != null && (
            <Text className="text-[13px] font-bold text-blue-600">
              {Number(listing.price).toLocaleString("tr-TR", {
                style: "currency",
                currency: "TRY",
                minimumFractionDigits: 0,
              })}
            </Text>
          )}
        </View>

        {/* Alt satır: durum rozeti + güncelle butonu */}
        <View className="flex-row items-center justify-between mt-auto">
          <View
            className="px-2.5 py-1 rounded-xl"
            style={{ backgroundColor: statusCfg.bg }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: statusCfg.text }}>
              {statusCfg.label}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleStatusPress}
            disabled={isUpdating}
            activeOpacity={0.7}
            className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50"
            style={{ opacity: isUpdating ? 0.45 : 1 }}
          >
            <Ionicons name="sync-outline" size={12} color="#64748B" />
            <Text className="text-[11px] font-semibold text-slate-500">
              Durumu Değiştir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Boş Durum ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center pt-20 px-8">
      <View className="w-[88px] h-[88px] rounded-full bg-[#FFF1EE] items-center justify-center mb-5">
        <Ionicons name="pricetags-outline" size={38} color={colors.primary.DEFAULT} />
      </View>
      <Text className="text-lg font-bold text-[#32343E] mb-2.5 text-center">
        Henüz İlan Yok
      </Text>
      <Text className="text-sm text-[#A0A5BA] text-center leading-relaxed">
        Mahallenle bir şeyler paylaştığında ilanların burada görünecek.
      </Text>
    </View>
  );
}

// ─── Ekran ────────────────────────────────────────────────────────────────────

export default function MyListingsScreen() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ["my-listings"],
    queryFn: ({ pageParam }) =>
      marketplaceApi.getMyListings(pageParam as number, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

  const {
    mutate: updateStatus,
    isPending: isUpdating,
    variables: updatingVars,
  } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ListingStatus }) =>
      marketplaceApi.updateListingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "feed"] });
    },
    onError: () => {
      Alert.alert("Hata", "Durum güncellenirken bir sorun oluştu, tekrar dene.");
    },
  });

  const listings = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>

      {/* ── Başlık ── */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <BackButton light={false} />

        <Text className="text-[17px] font-bold text-[#32343E]">
          İlanlarım
        </Text>

        {!isLoading ? (
          <View className="px-3 py-1.5 rounded-full bg-[#FFF1EE] min-w-[36px] items-center">
            <Text className="text-[13px] font-bold" style={{ color: colors.primary.DEFAULT }}>
              {totalElements}
            </Text>
          </View>
        ) : (
          <View className="w-[36px]" />
        )}
      </View>

      {/* ── İçerik ── */}
      {isLoading ? (
        <View className="px-5 pt-1">
          {[1, 2, 3].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={52} color="#A0A5BA" />
          <Text className="text-[#A0A5BA] text-center mt-4 text-sm leading-relaxed">
            {(error as Error).message}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="px-5 pt-1 pb-8 grow"
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-5 items-center">
                <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onStatusChange={(id, status) => updateStatus({ id, status })}
              isUpdating={isUpdating && updatingVars?.id === item.id}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}