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

export interface DtoComment {
  id: number;
  content: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
}

export interface DtoCreateComment {
  content: string;
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

export const commentApi = {
  /** GET /api/posts/{postId}/comments – Postun yorumlarını getir */
  getPostComments: (
    postId: number,
    pageNo = 0,
    pageSize = 20
  ): Promise<PageResponse<DtoComment>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoComment>>>(
        `/api/posts/${postId}/comments`,
        { params: { pageNo, pageSize } }
      )
      .then((res) => unwrap(res.data)),

  /** POST /api/posts/{postId}/comments – Yorum ekle */
  createComment: (
    postId: number,
    payload: DtoCreateComment
  ): Promise<DtoComment> =>
    apiClient
      .post<RootEntity<DtoComment>>(
        `/api/posts/${postId}/comments`,
        payload
      )
      .then((res) => unwrap(res.data)),

  /** DELETE /api/comments/{commentId} – Yorumu sil */
  deleteComment: (commentId: number): Promise<boolean> =>
    apiClient
      .delete<RootEntity<boolean>>(`/api/comments/${commentId}`)
      .then((res) => unwrap(res.data)),
};
