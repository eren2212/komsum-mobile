import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { chatApi, DtoMessage, DtoChatRoom, PageResponse } from "@/api/chat";
import { userApi } from "@/api/user";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme/color";
import { BackButton } from "@/components";

// Supabase'den gelen raw mesaj şeması (snake_case)
interface SupabaseMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { roomId, otherUserFirstName, otherUserLastName, otherUserAvatarUrl } =
    useLocalSearchParams<{
      roomId: string;
      otherUserFirstName: string;
      otherUserLastName: string;
      otherUserAvatarUrl?: string;
    }>();

  const parsedRoomId = Number(roomId);

  const [messages, setMessages] = useState<DtoMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const { data: myProfile } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
    staleTime: 5 * 60 * 1000,
  });

  // İlk mesajları yükle + odaya girilince badge'i sıfırla
  useEffect(() => {
    chatApi
      .getChatMessages(parsedRoomId, 0, 50)
      .then((page) => {
        setMessages(page.content);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    chatApi.markAsRead(parsedRoomId).catch(() => {});
    queryClient.setQueryData<PageResponse<DtoChatRoom>>(["chatRooms"], (old) => {
      if (!old) return old;
      return {
        ...old,
        content: old.content.map((r) =>
          r.id === parsedRoomId ? { ...r, unreadCount: 0 } : r,
        ),
      };
    });
  }, [parsedRoomId]);

  // İlk yüklemeden sonra en alta kaydır
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        100,
      );
    }
  }, [isLoading]);

  // Supabase real-time aboneliği
  useEffect(() => {
    const channel = supabase
      .channel(`messages:room:${parsedRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${parsedRoomId}`,
        },
        (payload) => {
          const raw = payload.new as SupabaseMessage;
          const newMsg: DtoMessage = {
            id: raw.id,
            senderId: raw.sender_id,
            content: raw.content,
            createdAt: raw.created_at,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            50,
          );
          // Kullanıcı odadayken gelen mesajı hemen okundu yap
          chatApi.markAsRead(parsedRoomId).catch(() => {});
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parsedRoomId]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    setInputText("");
    setIsSending(true);

    const tempId = -Date.now();
    const optimisticMsg: DtoMessage = {
      id: tempId,
      senderId: myProfile?.id ?? 0,
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const saved = await chatApi.sendMessage(parsedRoomId, content);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === saved.id)) return withoutTemp;
        return [...withoutTemp, saved];
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert("Hata", "Mesaj gönderilemedi, tekrar dene.");
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: DtoMessage }) => {
    const isMe = item.senderId === myProfile?.id;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          marginBottom: 8,
          paddingHorizontal: 16,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe && (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.secondary.DEFAULT,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              overflow: "hidden",
            }}
          >
            {otherUserAvatarUrl ? (
              <Image
                source={{ uri: otherUserAvatarUrl }}
                style={{ width: 30, height: 30, borderRadius: 15 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>
                {getInitials(
                  otherUserFirstName ?? "?",
                  otherUserLastName ?? "?",
                )}
              </Text>
            )}
          </View>
        )}

        <View
          style={{
            maxWidth: "72%",
            backgroundColor: isMe ? colors.primary.DEFAULT : "#FFFFFF",
            borderRadius: 18,
            borderBottomRightRadius: isMe ? 4 : 18,
            borderBottomLeftRadius: isMe ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: isMe ? "#FFFFFF" : "#1A1D2E",
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isMe ? "rgba(255,255,255,0.65)" : "#A0A5BA",
              marginTop: 4,
              alignSelf: "flex-end",
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.secondary.DEFAULT }}>
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT}
        barStyle="light-content"
        animated
      />

      {/* Header — SafeArea sadece üst için, header'ın kendisine padding olarak */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.secondary.DEFAULT }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 56,
            paddingHorizontal: 12,
          }}
        >
          <BackButton variant="overlay" />
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12, // ← BackButton'dan boşluk
              marginRight: 12,
              overflow: "hidden",
            }}
          >
            {otherUserAvatarUrl ? (
              <Image
                source={{ uri: otherUserAvatarUrl }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                {getInitials(
                  otherUserFirstName ?? "?",
                  otherUserLastName ?? "?",
                )}
              </Text>
            )}
          </View>

          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
              numberOfLines={1}
            >
              {otherUserFirstName} {otherUserLastName}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* İçerik Alanı — açık zemin */}
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#F0F2F8" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{
              paddingVertical: 16,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                }}
              >
                <Ionicons name="chatbubble-outline" size={48} color="#C8CADE" />
                <Text
                  style={{
                    color: "#A0A5BA",
                    marginTop: 12,
                    fontSize: 14,
                  }}
                >
                  Henüz mesaj yok. İlk mesajı sen at!
                </Text>
              </View>
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center", // ← flex-end yerine center
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E8EAF0",
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesaj yaz..."
            placeholderTextColor="#A0A5BA"
            multiline
            maxLength={1000}
            style={{
              flex: 1,
              backgroundColor: "#F0F2F8",
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingTop: Platform.OS === "ios" ? 12 : 10,
              paddingBottom: Platform.OS === "ios" ? 12 : 10,
              fontSize: 14,
              color: "#1A1D2E",
              maxHeight: 120,
              minHeight: 44,
              marginRight: 8,
              textAlignVertical: "center", // ← Android için dikey ortalama
            }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                inputText.trim() && !isSending
                  ? colors.primary.DEFAULT
                  : "#E0E2ED",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "#FF6B4A" : "#A0A5BA"}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
