import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { chatApi, DtoChatRoom, PageResponse } from "@/api/chat";
import { userApi } from "@/api/user";
import { realtimeChat } from "@/lib/realtimeChat";
import { colors } from "@/theme/color";
import { SkeletonBox } from "@/components";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLastSeen(iso: string | null | undefined): string {
    if (!iso) return "";
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} sa`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün`;
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChatRoomSkeleton() {
    return (
        <View className="flex-row items-center px-5 py-4 bg-white border-b border-[#F0F2F8]">
            <SkeletonBox width={52} height={52} borderRadius={26} style={{ marginRight: 14 }} />
            <View className="flex-1 gap-2">
                <SkeletonBox width={130} height={15} borderRadius={8} />
                <SkeletonBox width={180} height={12} borderRadius={6} />
            </View>
            <SkeletonBox width={36} height={11} borderRadius={6} />
        </View>
    );
}

// ─── ChatRoomItem ─────────────────────────────────────────────────────────────

interface ChatRoomItemProps {
    room: DtoChatRoom;
    onPress: () => void;
}

function ChatRoomItem({ room, onPress }: ChatRoomItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className="flex-row items-center px-5 py-4 bg-white border-b border-[#F0F2F8]"
        >
            {/* Avatar */}
            <View
                className="w-[52px] h-[52px] rounded-full bg-secondary items-center justify-center mr-4 overflow-hidden"
                style={{ flexShrink: 0 }}
            >
                {room.otherUserAvatarUrl ? (
                    <Image
                        source={{ uri: room.otherUserAvatarUrl }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <Text className="text-[15px] font-bold text-white">
                        {getInitials(room.otherUserFirstName, room.otherUserLastName)}
                    </Text>
                )}
            </View>

            {/* İsim + Son mesaj önizlemesi */}
            <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1A1D2E]" numberOfLines={1}>
                    {room.otherUserFirstName} {room.otherUserLastName}
                </Text>
                {room.lastMessageContent ? (
                    <Text className="text-[12px] text-neutral-300 mt-0.5" numberOfLines={1}>
                        {room.lastMessageContent}
                    </Text>
                ) : room.lastMessageAt ? (
                    <Text className="text-[12px] text-neutral-300 mt-0.5">
                        Sohbet başladı
                    </Text>
                ) : null}
            </View>

            {/* Zaman + Badge + Chevron */}
            <View className="items-end ml-2" style={{ minWidth: 48 }}>
                {room.lastMessageAt && (
                    <Text className="text-[11px] text-neutral-300 mb-1">
                        {formatLastSeen(room.lastMessageAt)}
                    </Text>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {room.unreadCount > 0 && (
                        <View
                            style={{
                                backgroundColor: colors.primary.DEFAULT,
                                borderRadius: 10,
                                minWidth: 20,
                                height: 20,
                                alignItems: "center",
                                justifyContent: "center",
                                paddingHorizontal: 5,
                            }}
                        >
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                                {room.unreadCount > 9 ? "9+" : room.unreadCount}
                            </Text>
                        </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#C8CADE" />
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── MessagesScreen ───────────────────────────────────────────────────────────

export default function MessagesScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: myProfile } = useQuery({
        queryKey: ["me", "profile"],
        queryFn: userApi.getMyProfile,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data,
        isLoading,
        isRefetching,
        refetch,
        error,
    } = useQuery({
        queryKey: ["chatRooms"],
        queryFn: () => chatApi.getMyChatRooms(0, 30),
        staleTime: 30_000,
        refetchInterval: 60_000,
    });

    const rooms = data?.content ?? [];

    // Stale closure'dan kaçınmak için ref'ler
    const roomsRef = useRef<DtoChatRoom[]>([]);
    const myIdRef = useRef<number | null>(null);

    useEffect(() => {
        roomsRef.current = rooms;
    }, [rooms]);

    useEffect(() => {
        myIdRef.current = myProfile?.id ?? null;
    }, [myProfile?.id]);

    // Canlı akış (kendi sunucumuz, SSE): herhangi bir odaya yeni mesaj gelince inbox'ı güncelle
    useEffect(() => {
        const unsubscribe = realtimeChat.addMessageListener((raw) => {
            const knownIds = roomsRef.current.map((r) => r.id);

            if (knownIds.includes(raw.chatRoomId)) {
                queryClient.setQueryData<PageResponse<DtoChatRoom>>(
                    ["chatRooms"],
                    (old) => {
                        if (!old) return old;
                        const myId = myIdRef.current;
                        const isFromOther = myId !== null && raw.senderId !== myId;
                        const updated = old.content
                            .map((room) => {
                                if (room.id !== raw.chatRoomId) return room;
                                return {
                                    ...room,
                                    lastMessageContent: raw.content,
                                    lastMessageAt: raw.createdAt,
                                    unreadCount: isFromOther
                                        ? (room.unreadCount ?? 0) + 1
                                        : room.unreadCount ?? 0,
                                };
                            })
                            .sort((a, b) => {
                                const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                                const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                                return bT - aT;
                            });
                        return { ...old, content: updated };
                    },
                );
            } else {
                // Yeni bir sohbet başlamış olabilir, listeyi yenile
                queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
            }
        });

        return unsubscribe;
    }, []);

    const handleRoomPress = (room: DtoChatRoom) => {
        router.push({
            pathname: "/(protected)/chat/[roomId]",
            params: {
                roomId: String(room.id),
                otherUserFirstName: room.otherUserFirstName,
                otherUserLastName: room.otherUserLastName,
                otherUserAvatarUrl: room.otherUserAvatarUrl ?? "",
            },
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
            <StatusBar
                backgroundColor={colors.secondary.DEFAULT}
                barStyle="light-content"
                animated
            />

            {/* Header */}
            <View className="px-6 pt-2 pb-5">
                <Text className="text-white text-[24px] font-bold">Mesajlar</Text>
            </View>

            {/* İçerik */}
            <View
                className="flex-1 bg-white"
                style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" }}
            >
                {isLoading ? (
                    <View className="pt-2">
                        {[1, 2, 3, 4, 5].map((k) => <ChatRoomSkeleton key={k} />)}
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <Ionicons name="wifi-outline" size={52} color="#C8CADE" />
                        <Text className="text-[16px] font-bold text-[#1A1D2E] mt-4 mb-2">
                            Bağlantı Hatası
                        </Text>
                        <Text className="text-[13px] text-neutral-300 text-center mb-5">
                            Mesajlar yüklenirken bir sorun oluştu.
                        </Text>
                        <TouchableOpacity
                            onPress={() => refetch()}
                            activeOpacity={0.8}
                            className="px-6 py-3 rounded-[14px]"
                            style={{ backgroundColor: colors.primary.DEFAULT }}
                        >
                            <Text className="text-white font-bold text-[14px]">Tekrar Dene</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={rooms}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => (
                            <ChatRoomItem room={item} onPress={() => handleRoomPress(item)} />
                        )}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center pt-24 px-8">
                                <View
                                    className="w-[88px] h-[88px] rounded-full items-center justify-center mb-5"
                                    style={{ backgroundColor: `${colors.primary.DEFAULT}18` }}
                                >
                                    <Ionicons
                                        name="chatbubbles-outline"
                                        size={44}
                                        color={colors.primary.DEFAULT}
                                    />
                                </View>
                                <Text className="text-[18px] font-bold text-[#1A1D2E] mb-2 text-center">
                                    Henüz Mesaj Yok
                                </Text>
                                <Text className="text-[13px] text-neutral-300 text-center leading-[20px]">
                                    Bir komşunun profiline git ve mesaj atmaya başla!
                                </Text>
                            </View>
                        }
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching && !isLoading}
                                onRefresh={refetch}
                                tintColor={colors.primary.DEFAULT}
                                colors={[colors.primary.DEFAULT]}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
