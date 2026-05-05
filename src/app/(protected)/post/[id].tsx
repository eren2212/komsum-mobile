import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

import { commentApi, DtoComment } from "@/api/comment";
import { DtoPost } from "@/api/post";
import { userApi } from "@/api/user";
import { colors } from "@/theme/color";
import { useLike } from "@/hooks/useLike";
import { BackButton, SkeletonBox } from "@/components";

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
  });
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ─── LikeButton (inline – same as feed) ──────────────────────────────────────

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
}

function LikeButton({ isLiked, likeCount, onPress }: LikeButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      className="flex-row items-center gap-[6px]"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={20}
          color={isLiked ? "#EF4444" : "#A0A5BA"}
        />
      </Animated.View>
      <Text
        className="text-[14px] font-bold"
        style={{ color: isLiked ? "#EF4444" : "#64748B" }}
      >
        {likeCount > 0 ? `${likeCount} Beğeni` : "Beğen"}
      </Text>
    </Pressable>
  );
}

// ─── Comment Skeleton ─────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <View className="flex-row items-start gap-3 mb-5">
      <SkeletonBox width={36} height={36} borderRadius={18} />
      <View className="flex-1 gap-2">
        <SkeletonBox width={120} height={14} borderRadius={7} />
        <SkeletonBox width={220} height={14} borderRadius={7} />
        <SkeletonBox width={160} height={14} borderRadius={7} />
      </View>
    </View>
  );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: DtoComment;
  isOwner: boolean;
  onDelete: (id: number) => void;
  onEdit: (comment: DtoComment) => void;
  isDeletingId: number | null;
}

function CommentItem({ comment, isOwner, onDelete, onEdit, isDeletingId }: CommentItemProps) {
  const isDeleting = isDeletingId === comment.id;

  return (
    <View
      className="flex-row items-start gap-3 mb-5"
      style={{ opacity: isDeleting ? 0.4 : 1 }}
    >
      {/* Avatar */}
      <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center flex-shrink-0">
        <Text className="text-[11px] font-bold text-white">
          {getInitials(comment.authorFirstName, comment.authorLastName)}
        </Text>
      </View>

      {/* Bubble */}
      <View className="flex-1 bg-[#f8fafc] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] p-3">
        {/* Name + time + actions */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[14px] font-bold text-[#121223]">
            {comment.authorFirstName} {comment.authorLastName.charAt(0)}.
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] text-[#94a3b8]">
              {formatDate(comment.createdAt)}
            </Text>
            {isOwner && (
              <>
                <TouchableOpacity
                  onPress={() => onEdit(comment)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  disabled={isDeleting}
                >
                  <Ionicons name="pencil-outline" size={12} color="#94a3b8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(comment.id)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  disabled={isDeleting}
                >
                  <Ionicons name="trash-outline" size={12} color="#CBD5E1" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Content */}
        <Text className="text-[14px] text-[#475569] leading-[20px]">
          {comment.content}
        </Text>
      </View>
    </View>
  );
}

// ─── CommentEditModal ─────────────────────────────────────────────────────────

interface CommentEditModalProps {
  comment: DtoComment | null;
  onClose: () => void;
  onSave: (commentId: number, content: string) => void;
  isSaving: boolean;
}

function CommentEditModal({ comment, onClose, onSave, isSaving }: CommentEditModalProps) {
  const [text, setText] = useState(comment?.content ?? "");

  useEffect(() => {
    if (comment) setText(comment.content);
  }, [comment?.id]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert("Uyarı", "Yorum boş olamaz.");
      return;
    }
    if (comment?.id != null) {
      onSave(comment.id, trimmed);
    }
  };

  const cardShadow = Platform.select({
    ios: { shadowColor: "#121223", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
    android: { elevation: 4 },
  });

  return (
    <Modal
      visible={comment !== null}
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
            <View className="bg-white rounded-[20px] p-5" style={cardShadow}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[15px] font-bold text-[#121223]">
                  Yorumu Düzenle
                </Text>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Input */}
              <TextInput
                value={text}
                onChangeText={setText}
                multiline
                maxLength={300}
                placeholder="Yorumunu yaz..."
                placeholderTextColor="#94a3b8"
                className="bg-[#f8fafc] rounded-[12px] p-3 text-[14px] text-[#334155] leading-[20px]"
                style={{ minHeight: 90, textAlignVertical: "top" }}
                autoFocus
              />

              <Text className="text-[11px] text-[#94a3b8] text-right mt-1 mb-4">
                {text.length}/300
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-[12px] bg-slate-100 items-center"
                >
                  <Text className="text-sm font-semibold text-[#64748b]">İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-[12px] items-center"
                  style={{ backgroundColor: colors.primary.DEFAULT, opacity: isSaving ? 0.6 : 1 }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">Kaydet</Text>
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

// ─── Post Detail Screen ───────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { postJson } = useLocalSearchParams<{ postJson: string }>();

  const post: DtoPost = JSON.parse(decodeURIComponent(postJson ?? "{}"));
  const { isLiked, likeCount, toggle } = useLike(post.id, post.likedByMe, post.likeCount);

  const isSponsored = post.type === "SPONSORED";
  const isHelp = post.type === "HELP_REQUEST";

  // ── Giriş yapan kullanıcının ID'si
  const { data: myProfile } = useQuery({
    queryKey: ["me", "profile"],
    queryFn: userApi.getMyProfile,
    staleTime: Infinity,
  });
  const currentUserId = myProfile?.id;

  // ── Yorum state
  const [commentText, setCommentText] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<DtoComment | null>(null);
  const inputRef = useRef<TextInput>(null);

  // ── Yorumları infinite yükle
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["postComments", post.id],
    queryFn: ({ pageParam }) =>
      commentApi.getPostComments(post.id, pageParam as number, 20),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });

  const comments = commentsData?.pages.flatMap((p) => p.content) ?? [];
  const totalComments =
    commentsData?.pages[commentsData.pages.length - 1]?.totalElements ?? 0;

  // ── Yorum ekle mutation
  const { mutate: addComment, isPending: isSending } = useMutation({
    mutationFn: () =>
      commentApi.createComment(post.id, { content: commentText.trim() }),
    onSuccess: (newComment) => {
      setCommentText("");
      queryClient.setQueryData(
        ["postComments", post.id],
        (old: any) => {
          if (!old) return old;
          const pages = [...old.pages];
          // Yeni yorumu son sayfanın başına ekle (en yeni yukarıda görünmesi için)
          pages[pages.length - 1] = {
            ...pages[pages.length - 1],
            content: [...pages[pages.length - 1].content, newComment],
            totalElements:
              (pages[pages.length - 1].totalElements ?? 0) + 1,
          };
          return { ...old, pages };
        }
      );
    },
  });

  // ── Yorum sil mutation
  const { mutate: deleteComment } = useMutation({
    mutationFn: (commentId: number) => commentApi.deleteComment(commentId),
    onMutate: (commentId) => setDeletingId(commentId),
    onSuccess: (_, commentId) => {
      setDeletingId(null);
      queryClient.setQueryData(["postComments", post.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.filter((c: DtoComment) => c.id !== commentId),
            totalElements: Math.max(0, (page.totalElements ?? 1) - 1),
          })),
        };
      });
    },
    onError: () => setDeletingId(null),
  });

  // ── Yorum güncelle mutation
  const { mutate: updateComment, isPending: isUpdatingComment } = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      commentApi.updateComment(commentId, { content }),
    onSuccess: (updatedComment) => {
      setEditingComment(null);
      queryClient.setQueryData(["postComments", post.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((c: DtoComment) =>
              c.id === updatedComment.id ? updatedComment : c
            ),
          })),
        };
      });
    },
    onError: () => {
      Alert.alert("Hata", "Yorum güncellenirken bir sorun oluştu, tekrar dene.");
    },
  });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = () => {
    if (!commentText.trim() || isSending) return;
    addComment();
    inputRef.current?.blur();
  };

  const keyExtractor = useCallback((item: DtoComment) => String(item.id), []);

  // ── Kart renk yardımcıları
  const avatarBg = isSponsored
    ? colors.primary.DEFAULT
    : isHelp
      ? "#FEF3C7"
      : "#121223";

  // ── FlatList ListHeaderComponent: post içeriği
  const PostHeader = (
    <View>
      {/* Post: author row */}
      <View className="flex-row items-center px-4 pt-4 pb-3 gap-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: avatarBg,
            borderWidth: isSponsored ? 2 : 0,
            borderColor: "rgba(255,107,74,0.2)",
          }}
        >
          {isHelp ? (
            <Ionicons name="hand-right" size={22} color="#B45309" />
          ) : (
            post.authorAvatarUrl ? (
              <Image
                source={{ uri: post.authorAvatarUrl }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                }}
                transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            ) : (
              <Text className="text-[16px] font-bold text-white">
                {getInitials(post.authorFirstName, post.authorLastName)}
              </Text>
            )
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[16px] font-bold text-[#121223]">
              {post.authorFirstName} {post.authorLastName.charAt(0)}.
            </Text>
            {isSponsored && (
              <View className="bg-primary-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-primary">
                  ESNAF
                </Text>
              </View>
            )}
            {isHelp && (
              <View className="bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-[#B45309]">
                  YARDIM
                </Text>
              </View>
            )}
          </View>
          <Text className="text-[12px] text-[#64748b] mt-0.5">
            {post.neighborhoodName} • {formatDate(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Sponsorlu: dükkan adı */}
      {isSponsored && post.shopName ? (
        <View className="mx-4 mb-2 flex-row items-center gap-1.5 bg-primary-50 px-3 py-1.5 rounded-xl self-start">
          <Ionicons
            name="storefront-outline"
            size={13}
            color={colors.primary.DEFAULT}
          />
          <Text className="text-[12px] font-semibold text-primary">
            {post.shopName}
          </Text>
        </View>
      ) : null}

      {/* Post içeriği */}
      <View className="px-4 pb-3">
        <Text className="text-[16px] text-[#334155] leading-[26px]">
          {post.content}
        </Text>
      </View>

      {/* Post resmi */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={{
            width: "90%",
            aspectRatio: 16 / 9,
            borderRadius: 12,
            marginBottom: 12,
            alignSelf: "center",
          }}
          transition={300} // Yüklendiğinde 300ms'lik yumuşak bir geçiş (fade-in) yapar
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ) : null}

      {/* Interaction bar */}
      <View
        className="flex-row items-center px-4 py-3 gap-6 border-t border-b border-[#f8fafc]"
        style={{ marginBottom: 0 }}
      >
        <LikeButton isLiked={isLiked} likeCount={likeCount} onPress={toggle} />

        <View className="flex-row items-center gap-1.5">
          <Ionicons name="chatbubble-outline" size={20} color="#A0A5BA" />
          <Text className="text-[14px] font-bold text-[#64748b]">
            {totalComments > 0 ? `${totalComments} Yorum` : "Yorum"}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-social-outline" size={20} color="#A0A5BA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Yorumlar başlığı */}
      <View className="px-4 pt-5 pb-2">
        <Text className="text-[16px] font-bold text-[#121223]">Yorumlar</Text>
      </View>
    </View>
  );

  // ── Yorum listesi skeleton
  const CommentSkeletons = (
    <View className="px-4 pt-2">
      {[1, 2, 3].map((k) => (
        <CommentSkeleton key={k} />
      ))}
    </View>
  );

  const renderComment = useCallback(
    ({ item }: { item: DtoComment }) => (
      <View className="px-4">
        <CommentItem
          comment={item}
          isOwner={currentUserId === item.authorId}
          onDelete={(id) => deleteComment(id)}
          onEdit={(c) => setEditingComment(c)}
          isDeletingId={deletingId}
        />
      </View>
    ),
    [deletingId, currentUserId, deleteComment]
  );

  const ListFooter = (
    <View className="pb-6">
      {isFetchingNextPage && (
        <ActivityIndicator
          size="small"
          color={colors.primary.DEFAULT}
          style={{ marginVertical: 12 }}
        />
      )}
    </View>
  );

  const ListEmpty = commentsLoading ? (
    CommentSkeletons
  ) : (
    <View className="px-4 py-6 items-center">
      <Ionicons name="chatbubbles-outline" size={36} color="#CBD5E1" />
      <Text className="text-[14px] text-neutral-300 mt-2 text-center">
        Henüz yorum yok. İlk yorumu sen yap!
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Top App Bar ── */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b border-[#f1f5f9] bg-white"
          style={{ zIndex: 10 }}
        >
          {/* Geri butonu */}
          <BackButton />

          {/* Başlık */}
          <Text className="text-[18px] font-bold text-[#121223] tracking-[-0.4px]">
            Gönderi Detayı
          </Text>

          {/* 3-nokta menü */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color="#121223"
            />
          </TouchableOpacity>
        </View>

        {/* ── Post + Yorumlar listesi ── */}
        <FlatList
          data={comments}
          keyExtractor={keyExtractor}
          renderItem={renderComment}
          ListHeaderComponent={PostHeader}
          ListEmptyComponent={ListEmpty as any}
          ListFooterComponent={ListFooter as any}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <CommentEditModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onSave={(commentId, content) => updateComment({ commentId, content })}
          isSaving={isUpdatingComment}
        />

        {/* ── Sticky Bottom: Yorum giriş alanı ── */}
        <View
          className="flex-row items-center gap-3 px-4 pt-3 pb-4 bg-white border-t border-[#f1f5f9]"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Kullanıcı avatarı */}
          <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center flex-shrink-0">
            <Ionicons name="person" size={18} color="#fff" />
          </View>

          {/* Input container */}
          <View className="flex-1 relative">
            <View className="bg-[#f0f5fa] rounded-full px-5 h-[44px] justify-center overflow-hidden">
              <TextInput
                ref={inputRef}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Yorum ekle..."
                placeholderTextColor="#94a3b8"
                className="text-[14px] text-[#121223] pr-10"
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!isSending}
              />
            </View>

            {/* Gönder butonu (input içinde sağda) */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!commentText.trim() || isSending}
              activeOpacity={0.85}
              className="absolute right-2 top-[6px] w-8 h-8 rounded-full bg-primary items-center justify-center"
              style={{
                opacity: commentText.trim() && !isSending ? 1 : 0.45,
                shadowColor: "#FF6B4A",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
