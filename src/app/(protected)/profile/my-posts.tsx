import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { postApi, DtoPost, PostType } from "@/api/post";
import { colors } from "@/theme/color";
import { BackButton, SkeletonBox } from "@/components";
import { router } from "expo-router";

const SCREEN_W = Dimensions.get("window").width;
const CARD_INNER_W = SCREEN_W - 40 - 32; // 20px padding * 2 + 16px card padding * 2

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

// ─── Post type config ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  PostType,
  { label: string; bg: string; text: string; icon: string }
> = {
  STANDARD: {
    label: "Normal",
    bg: "#F5F6FA",
    text: "#646982",
    icon: "chatbubble-outline",
  },
  HELP_REQUEST: {
    label: "Yardım",
    bg: "#FEF3C7",
    text: "#B45309",
    icon: "hand-right-outline",
  },
  SPONSORED: {
    label: "Esnaf",
    bg: "#FFF1EE",
    text: colors.primary.DEFAULT,
    icon: "storefront-outline",
  },
};

// Ortak Gölge Stili
const cardShadow = Platform.select({
  ios: { shadowColor: "#121223", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ─── PostCardSkeleton ─────────────────────────────────────────────────────────

function PostCardSkeleton() {
  return (
    <View
      className="bg-white rounded-[20px] p-4 mb-3 border border-slate-50"
      style={cardShadow}
    >
      <View className="flex-row justify-between items-center mb-3">
        <SkeletonBox width={70} height={26} borderRadius={13} />
        <SkeletonBox width={64} height={14} borderRadius={7} />
      </View>
      <SkeletonBox
        width={CARD_INNER_W}
        height={16}
        borderRadius={8}
        style={{ marginBottom: 8 }}
      />
      <SkeletonBox
        width={CARD_INNER_W * 0.75}
        height={16}
        borderRadius={8}
        style={{ marginBottom: 18 }}
      />
      <View className="flex-row justify-between items-center">
        <SkeletonBox width={110} height={14} borderRadius={7} />
        <SkeletonBox width={68} height={30} borderRadius={15} />
      </View>
    </View>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: DtoPost;
  onDelete: (id: number) => void;
  onEdit: (post: DtoPost) => void;
  isDeleting: boolean;
}

function PostCard({ post, onDelete, onEdit, isDeleting }: PostCardProps) {
  const cfg = TYPE_CONFIG[post.type] ?? TYPE_CONFIG.STANDARD;

  const handleDelete = () => {
    Alert.alert(
      "Gönderiyi Sil",
      "Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => onDelete(post.id) },
      ]
    );
  };

  const navigateToDetail = () => {
    router.push({
      pathname: "/(protected)/post/[id]",
      params: { id: String(post.id), postJson: JSON.stringify(post) },
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={navigateToDetail}>
      <View
        className="bg-white rounded-[20px] p-4 mb-3 border border-slate-50"
        style={cardShadow}
      >
        {/* ── Top row: badge + date ── */}
        <View className="flex-row items-center justify-between mb-2.5">
          <View
            className="flex-row items-center px-2.5 py-1.5 rounded-xl gap-1"
            style={{ backgroundColor: cfg.bg }}
          >
            <Ionicons name={cfg.icon as any} size={12} color={cfg.text} />
            <Text className="text-xs font-semibold" style={{ color: cfg.text }}>
              {cfg.label}
            </Text>
          </View>

          <Text className="text-xs text-[#A0A5BA]">
            {formatDate(post.createdAt)}
          </Text>
        </View>

        {/* ── Shop name (SPONSORED only) ── */}
        {post.type === "SPONSORED" && post.shopName ? (
          <View className="flex-row items-center gap-1 mb-2">
            <Ionicons name="storefront" size={13} color={colors.primary.DEFAULT} />
            <Text
              className="text-xs font-semibold"
              style={{ color: colors.primary.DEFAULT }}
            >
              {post.shopName}
            </Text>
          </View>
        ) : null}

        {/* ── Content ── */}
        <Text
          numberOfLines={5}
          className="text-[15px] text-[#32343E] leading-[22px] mb-3.5"
        >
          {post.content}
        </Text>

        {/* ── Bottom row: neighborhood + actions ── */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color="#A0A5BA" />
            <Text className="text-xs text-[#A0A5BA]">
              {post.neighborhoodName}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => onEdit(post)}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-[14px] bg-blue-50"
            >
              <Ionicons name="pencil-outline" size={13} color="#3B82F6" />
              <Text className="text-xs font-semibold text-blue-500">Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-[14px] bg-red-100"
              style={{ opacity: isDeleting ? 0.45 : 1 }}
            >
              <Ionicons name="trash-outline" size={13} color="#EF4444" />
              <Text className="text-xs font-semibold text-red-500">Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── EditModal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  post: DtoPost | null;
  onClose: () => void;
  onSave: (postId: number, content: string) => void;
  isSaving: boolean;
}

function EditModal({ post, onClose, onSave, isSaving }: EditModalProps) {
  const [text, setText] = useState(post?.content ?? "");

  useEffect(() => {
    if (post) setText(post.content);
  }, [post?.id]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("Uyarı", "Gönderi metni boş olamaz.");
      return;
    }
    if (post?.id != null) {
      onSave(post.id, trimmed);
    }
  };

  return (
    <Modal
      visible={post !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center px-5"
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-[24px] p-5" style={cardShadow}>
              {/* ── Header ── */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[16px] font-bold text-[#32343E]">
                  Gönderiyi Düzenle
                </Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color="#A0A5BA" />
                </TouchableOpacity>
              </View>

              {/* ── Input ── */}
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
                placeholder="Gönderi metni..."
                placeholderTextColor="#A0A5BA"
                className="bg-slate-50 rounded-[14px] p-3.5 text-[15px] text-[#32343E] leading-[22px]"
                style={{ minHeight: 120, textAlignVertical: "top" }}
                autoFocus
              />

              <Text className="text-xs text-[#A0A5BA] text-right mt-1.5 mb-4">
                {text.length}/500
              </Text>

              {/* ── Buttons ── */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  className="flex-1 py-3 rounded-[14px] bg-slate-100 items-center"
                >
                  <Text className="text-sm font-semibold text-[#646982]">
                    İptal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.7}
                  className="flex-1 py-3 rounded-[14px] items-center"
                  style={{
                    backgroundColor: colors.primary.DEFAULT,
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      Kaydet
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center pt-20 px-8">
      <View className="w-[88px] h-[88px] rounded-full bg-[#FFF1EE] items-center justify-center mb-5">
        <Ionicons
          name="chatbubbles-outline"
          size={38}
          color={colors.primary.DEFAULT}
        />
      </View>
      <Text className="text-lg font-bold text-[#32343E] mb-2.5 text-center">
        Henüz Gönderi Yok
      </Text>
      <Text className="text-sm text-[#A0A5BA] text-center leading-relaxed">
        Mahallenle bir şeyler paylaştığında gönderilerin burada görünecek.
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyPostsScreen() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<DtoPost | null>(null);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ["my-posts"],
    queryFn: ({ pageParam }) => postApi.getMyPosts(pageParam as number, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

  const {
    mutate: deletePost,
    isPending: isDeleting,
    variables: deletingId,
  } = useMutation({
    mutationFn: postApi.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => {
      Alert.alert("Hata", "Gönderi silinirken bir sorun oluştu, tekrar dene.");
    },
  });

  const { mutate: updatePost, isPending: isUpdating } = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      postApi.updatePost(postId, { content }),
    onSuccess: () => {
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => {
      Alert.alert("Hata", "Gönderi güncellenirken bir sorun oluştu, tekrar dene.");
    },
  });

  const posts = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
        <BackButton />

        <Text className="text-[17px] font-bold text-[#32343E]">
          Postlarım
        </Text>

        {/* Post count badge */}
        {!isLoading ? (
          <View className="px-3 py-1.5 rounded-full bg-[#FFF1EE] min-w-[36px] items-center">
            <Text
              className="text-[13px] font-bold"
              style={{ color: colors.primary.DEFAULT }}
            >
              {totalElements}
            </Text>
          </View>
        ) : (
          <View className="w-[36px]" />
        )}
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View className="px-5 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <PostCardSkeleton key={i} />
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
          data={posts}
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
            <PostCard
              post={item}
              onDelete={deletePost}
              onEdit={setEditingPost}
              isDeleting={isDeleting && deletingId === item.id}
            />
          )}
        />
      )}

      <EditModal
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={(postId, content) => updatePost({ postId, content })}
        isSaving={isUpdating}
      />
    </SafeAreaView>
  );
}