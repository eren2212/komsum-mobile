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

export interface DtoPost {
  id: number;
  content: string;
  imageUrl?: string | null;
  type: PostType;
  shopName?: string | null;
  authorFirstName: string;
  authorLastName: string;
  authorKarmaScore?: number | null;
  neighborhoodName: string;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const postApi = {
  /** POST /api/posts/create – Yeni gönderi oluştur */
  createPost: (payload: DtoCreatePost): Promise<DtoPost> =>
    apiClient
      .post<RootEntity<DtoPost>>("/api/posts/create", payload)
      .then((res) => unwrap(res.data)),

  /** GET /api/posts/feed – Mahalle akışı */
  getFeed: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoPost>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoPost>>>("/api/posts/feed", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/posts/my-posts – Kendi gönderilerim */
  getMyPosts: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoPost>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoPost>>>("/api/posts/my-posts", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** POST /api/posts/delete/{id} – Gönderi sil */
  deletePost: (postId: number): Promise<boolean> =>
    apiClient
      .post<RootEntity<boolean>>(`/api/posts/delete/${postId}`)
      .then((res) => unwrap(res.data)),

  /** POST /api/posts/{id}/like – Beğen / beğeniyi geri al */
  toggleLike: (postId: number): Promise<string> =>
    apiClient
      .post<RootEntity<string>>(`/api/posts/${postId}/like`)
      .then((res) => unwrap(res.data)),
};
