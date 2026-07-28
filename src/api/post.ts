import { apiClient } from "./client";

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) {
    throw new Error(entity.errormessage ?? "Sunucu hatası.");
  }
  return entity.data;
}

// ─── Tipler ───────────────────────────────────────────────────────────────────

/** Backend PostType enum ile birebir eşleşir */
export type PostType = "STANDARD" | "HELP_REQUEST" | "SPONSORED";

export interface DtoCreatePost {
  content: string;
  imageUrl?: string;
  type: PostType;
}

export interface DtoUpdatePost {
  content: string;
}

export interface DtoPost {
  id: number;
  content: string;
  imageUrl?: string | null;
  type: PostType;
  shopName?: string | null;
  authorId?: number | null;
  authorFirstName: string;
  authorLastName: string;
  authorAvatarUrl?: string | null;
  authorKarmaScore?: number | null;
  neighborhoodName: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  /** Yalnızca SPONSORED postlarda dolu: esnafın dükkan konumu (harita pini) */
  latitude?: number | null;
  longitude?: number | null;
}

export interface DtoToggleLike {
  /** Jackson: boolean isLiked getter → "liked" JSON key */
  liked: boolean;
  newLikeCount: number;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

/**
 * Cursor (keyset) tabanlı feed dilimi. Backend DtoPostSlice ile birebir eşleşir.
 * nextCursor'u incelemeden, bir sonraki (daha eski) sayfa için aynen geri yolla.
 * null ise daha eski post yok.
 */
export interface DtoPostSlice {
  content: DtoPost[];
  nextCursor: string | null;
  hasNext: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const postApi = {
  /** POST /api/posts/create – Yeni gönderi oluştur */
  createPost: (payload: DtoCreatePost): Promise<DtoPost> =>
    apiClient
      .post<RootEntity<DtoPost>>("/api/posts/create", payload)
      .then((res) => unwrap(res.data)),

  /** GET /api/posts/{id} – Tek gönderi detayı (bildirim/derin link için) */
  getPostById: (postId: number): Promise<DtoPost> =>
    apiClient
      .get<RootEntity<DtoPost>>(`/api/posts/${postId}`)
      .then((res) => unwrap(res.data)),

  /**
   * GET /api/posts/feed – Mahalle akışı (cursor/keyset tabanlı, type verilirse filtreli).
   * cursor: bir önceki dilimin nextCursor'u; ilk sayfada null/undefined geç.
   * type=SPONSORED + lat/lng verilirse esnaf postları radius (metre) bazlı yakınlığa göre gelir;
   * aksi halde saf kronolojik akış korunur (lat/lng/radius opsiyonel).
   */
  getFeed: (
    cursor?: string | null,
    pageSize = 10,
    type?: PostType,
    lat?: number,
    lng?: number,
    radius = 5000,
  ): Promise<DtoPostSlice> =>
    apiClient
      .get<RootEntity<DtoPostSlice>>("/api/posts/feed", {
        params: {
          pageSize,
          radius,
          ...(cursor ? { cursor } : {}),
          ...(type ? { type } : {}),
          ...(lat != null && lng != null ? { lat, lng } : {}),
        },
      })
      .then((res) => unwrap(res.data)),

  /**
   * GET /api/posts/feed/new-count – Akışta "en son görülenden" bu yana kaç yeni post var.
   * İlk çağrıda backend taban çizgisini kurar ve 0 döner.
   */
  getFeedNewCount: (): Promise<number> =>
    apiClient
      .get<RootEntity<number>>("/api/posts/feed/new-count")
      .then((res) => unwrap(res.data)),

  /**
   * POST /api/posts/feed/mark-seen/{postId} – "En son görülen" işaretini ilerlet.
   * pull-to-refresh veya "N yeni gönderi" tıklamasından sonra en yeni post id'si ile çağrılır.
   */
  markFeedSeen: (postId: number): Promise<boolean> =>
    apiClient
      .post<RootEntity<boolean>>(`/api/posts/feed/mark-seen/${postId}`)
      .then((res) => unwrap(res.data)),

  /** GET /api/posts/my-posts – Kendi standart gönderilerim */
  getMyPosts: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoPost>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoPost>>>("/api/posts/my-posts", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/posts/my-sponsored-posts – Esnaf olarak kendi sponsorlu gönderilerim */
  getMySponsoredPosts: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoPost>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoPost>>>("/api/posts/my-sponsored-posts", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** POST /api/posts/delete/{id} – Gönderi sil */
  deletePost: (postId: number): Promise<boolean> =>
    apiClient
      .post<RootEntity<boolean>>(`/api/posts/delete/${postId}`)
      .then((res) => unwrap(res.data)),

  /** PUT /api/posts/update/{id} – Gönderi metnini güncelle */
  updatePost: (postId: number, payload: DtoUpdatePost): Promise<boolean> =>
    apiClient
      .put<RootEntity<boolean>>(`/api/posts/update/${postId}`, payload)
      .then((res) => unwrap(res.data)),

  /** POST /api/posts/{id}/like – Beğen / beğeniyi geri al */
  toggleLike: (postId: number): Promise<DtoToggleLike> =>
    apiClient
      .post<RootEntity<DtoToggleLike>>(`/api/posts/${postId}/like`)
      .then((res) => unwrap(res.data)),
};
