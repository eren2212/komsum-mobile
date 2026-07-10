import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import {
  DtoNotification,
  notificationApi,
} from "@/api/notification";
import { BackButton } from "@/components";
import { colors } from "@/theme/color";

function formatTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function getInitials(first: string | null, last: string | null): string {
  return `${(first ?? "?").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase();
}

function iconForType(type: DtoNotification["type"]) {
  switch (type) {
    case "NEW_POST":
      return "document-text-outline" as const;
    case "NEW_EVENT":
      return "calendar-outline" as const;
    case "NEW_MESSAGE":
      return "chatbubble-ellipses-outline" as const;
  }
}

interface NotificationItemProps {
  notification: DtoNotification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const bg = notification.isRead ? "bg-white" : "bg-[#FFF6F2]";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-5 py-4 border-b border-[#F0F2F8] ${bg}`}
    >
      <View
        className="w-[48px] h-[48px] rounded-full bg-secondary items-center justify-center mr-4 overflow-hidden"
        style={{ flexShrink: 0 }}
      >
        {notification.actorAvatarUrl ? (
          <Image
            source={{ uri: notification.actorAvatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <Text className="text-[14px] font-bold text-white">
            {getInitials(notification.actorFirstName, notification.actorLastName)}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons
            name={iconForType(notification.type)}
            size={14}
            color={colors.primary.DEFAULT}
          />
          <Text
            className="text-[14px] font-bold text-[#1A1D2E] flex-1"
            numberOfLines={1}
          >
            {notification.title}
          </Text>
        </View>
        {notification.body ? (
          <Text className="text-[12px] text-neutral-400 mt-1" numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
      </View>

      <View className="items-end ml-2" style={{ minWidth: 48 }}>
        <Text className="text-[11px] text-neutral-300">
          {formatTime(notification.createdAt)}
        </Text>
        {!notification.isRead && (
          <View
            style={{
              marginTop: 6,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary.DEFAULT,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getMyNotifications(0, 30),
    staleTime: 30_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const items = data?.content ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  const handlePress = (n: DtoNotification) => {
    if (!n.isRead) markAsReadMutation.mutate(n.id);

    if (n.relatedEntityType && n.relatedEntityId) {
      switch (n.relatedEntityType) {
        case "POST":
          router.push(`/post/${n.relatedEntityId}` as never);
          break;
        case "CHAT_ROOM":
          router.push(`/chat/${n.relatedEntityId}` as never);
          break;
        case "EVENT":
          router.push(`/(protected)/(tabs)` as never);
          break;
      }
    }
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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton variant="ghost" />
            <Text className="text-white text-[24px] font-bold">Bildirimler</Text>
          </View>
          {hasUnread && (
            <TouchableOpacity
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              activeOpacity={0.7}
            >
              <Text
                style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: "600" }}
              >
                Tümünü okundu yap
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* İçerik */}
      <View
        className="flex-1 bg-white"
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" }}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary.DEFAULT} />
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-10">
            <Ionicons name="notifications-off-outline" size={48} color="#C8CADE" />
            <Text className="text-[14px] text-neutral-400 mt-3 text-center">
              Henüz bildirimin yok. İlçendeki yeni gönderiler ve mesajlar burada görünecek.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(n) => String(n.id)}
            renderItem={({ item }) => (
              <NotificationItem notification={item} onPress={() => handlePress(item)} />
            )}
            contentContainerStyle={{ paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary.DEFAULT}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
