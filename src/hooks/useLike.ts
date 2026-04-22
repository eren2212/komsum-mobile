import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postApi } from "@/api/post";

// ─── Tip ──────────────────────────────────────────────────────────────────────

interface LikeState {
  isLiked:   boolean;
  likeCount: number;
}

// ─── Modül-düzeyinde paylaşılan yapılar ───────────────────────────────────────
//
// Neden modül-düzeyi?
//   React Query cache sadece "gösterim" state'ini tutar.
//   "committed" (backend'e ulaşan) state ve debounce timer'ları
//   aynı postId için birden fazla component instance'ı olsa bile
//   TEK bir yerden yönetilmesi gerekir.
//   → Feed'de beğenip detay sayfasına geçince her ikisi aynı
//     committed state'i ve timer'ı paylaşır.

const _committed = new Map<number, LikeState>();
const _timers    = new Map<number, ReturnType<typeof setTimeout>>();

function getCommitted(postId: number): LikeState {
  return _committed.get(postId) ?? { isLiked: false, likeCount: 0 };
}

// ─── useLike ──────────────────────────────────────────────────────────────────
//
// Özellikler:
//   • React Query cache  → her iki sayfada anlık senkronizasyon
//   • Optimistic UI      → tıklama anında görsel güncelleme
//   • Debounce 600 ms    → hızlı çift-tıkta hiç API isteği atılmaz
//   • Rollback           → API hata dönerse committed state'e geri dönülür

export function useLike(postId: number) {
  const queryClient = useQueryClient();

  // React Query cache = tek kaynak, feed + detay paylaşır
  const { data: likeState = { isLiked: false, likeCount: 0 } } =
    useQuery<LikeState>({
      queryKey:    ["postLike", postId],
      // Gerçek bir API isteği yok; sadece committed state'i döndürür
      queryFn:     () => getCommitted(postId),
      // Cache'de veri yoksa committed state ile başla
      initialData: () => getCommitted(postId),
      staleTime:   Infinity, // asla otomatik refetch
      gcTime:      10 * 60 * 1000,
    });

  const toggle = useCallback(() => {
    // Şu anki cache değerini oku (iki instance aynı değeri okur)
    const current: LikeState =
      queryClient.getQueryData<LikeState>(["postLike", postId]) ??
      { isLiked: false, likeCount: 0 };

    const newLiked = !current.isLiked;
    const newCount = newLiked ? current.likeCount + 1 : current.likeCount - 1;
    const newState: LikeState = { isLiked: newLiked, likeCount: newCount };

    // 1. Optimistic: cache'i hemen güncelle → feed ve detay anında yenilenir
    queryClient.setQueryData(["postLike", postId], newState);

    // 2. Önceki debounce timer'ı iptal et
    const existing = _timers.get(postId);
    if (existing) clearTimeout(existing);

    // 3. Net sonuç committed ile aynıysa API çağrısına gerek yok
    const committed = getCommitted(postId);
    if (newLiked === committed.isLiked) {
      _timers.delete(postId);
      return;
    }

    // 4. Debounced API çağrısı
    const timer = setTimeout(async () => {
      try {
        await postApi.toggleLike(postId);
        _committed.set(postId, newState); // committed state güncelle
      } catch {
        // Rollback: cache'i committed state'e döndür
        queryClient.setQueryData(["postLike", postId], getCommitted(postId));
      }
      _timers.delete(postId);
    }, 600);

    _timers.set(postId, timer);
  }, [postId, queryClient]);

  return {
    isLiked:   likeState.isLiked,
    likeCount: likeState.likeCount,
    toggle,
  };
}
