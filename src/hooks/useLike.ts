import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postApi } from "@/api/post";

// ─── Tip ──────────────────────────────────────────────────────────────────────

interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

// ─── Modül-düzeyinde paylaşılan yapılar ───────────────────────────────────────
//
// Committed state ve debounce timer'ları aynı postId için
// birden fazla component instance'ında (feed + detay) paylaşılır.

const _committed = new Map<number, LikeState>();
const _timers = new Map<number, ReturnType<typeof setTimeout>>();

function getCommitted(postId: number, fallback: LikeState): LikeState {
  return _committed.get(postId) ?? fallback;
}

// ─── useLike ──────────────────────────────────────────────────────────────────
//
// Özellikler:
//   • Sunucu verisiyle başlar (likedByMe + likeCount), feed'den geçince doğru
//   • React Query cache  → feed ve detay sayfası senkron çalışır
//   • Optimistic UI      → tıklama anında görsel güncelleme
//   • Debounce 600 ms    → hızlı çift-tıkta hiç API isteği atılmaz
//   • Rollback           → API hata dönerse committed state'e geri döner
//   • API yanıtını kullanır → backend'in döndürdüğü gerçek sayıyla güncellenir

export function useLike(
  postId: number,
  initialIsLiked = false,
  initialLikeCount = 0,
) {
  const queryClient = useQueryClient();

  const fallback: LikeState = { isLiked: initialIsLiked, likeCount: initialLikeCount };

  const { data: likeState = fallback } = useQuery<LikeState>({
    queryKey: ["postLike", postId],
    queryFn: () => getCommitted(postId, fallback),
    // Cache'de henüz veri yoksa sunucudan gelen başlangıç değerini kullan
    initialData: () => {
      const existing = queryClient.getQueryData<LikeState>(["postLike", postId]);
      if (existing) return existing;
      // İlk kez görülen post: committed'ı sunucu verisiyle başlat
      _committed.set(postId, fallback);
      return fallback;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  const toggle = useCallback(() => {
    const current: LikeState =
      queryClient.getQueryData<LikeState>(["postLike", postId]) ?? fallback;

    const optimisticLiked = !current.isLiked;
    const optimisticCount = optimisticLiked
      ? current.likeCount + 1
      : Math.max(0, current.likeCount - 1);
    const optimisticState: LikeState = {
      isLiked: optimisticLiked,
      likeCount: optimisticCount,
    };

    // 1. Optimistic: cache'i hemen güncelle → feed ve detay anında yenilenir
    queryClient.setQueryData(["postLike", postId], optimisticState);

    // 2. Önceki debounce timer'ı iptal et
    const existing = _timers.get(postId);
    if (existing) clearTimeout(existing);

    // 3. Net sonuç committed ile aynıysa API çağrısına gerek yok
    const committed = getCommitted(postId, fallback);
    if (optimisticLiked === committed.isLiked) {
      _timers.delete(postId);
      return;
    }

    // 4. Debounced API çağrısı — yanıttaki gerçek değerleri kullan
    const timer = setTimeout(async () => {
      try {
        const result = await postApi.toggleLike(postId);
        const confirmedState: LikeState = {
          isLiked: result.liked,
          likeCount: result.newLikeCount,
        };
        _committed.set(postId, confirmedState);
        queryClient.setQueryData(["postLike", postId], confirmedState);
      } catch {
        // Rollback: cache'i committed state'e döndür
        queryClient.setQueryData(["postLike", postId], getCommitted(postId, fallback));
      }
      _timers.delete(postId);
    }, 600);

    _timers.set(postId, timer);
  }, [postId, queryClient]);

  return {
    isLiked: likeState.isLiked,
    likeCount: likeState.likeCount,
    toggle,
  };
}
