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

function buildFormData(uri: string): FormData {
  const filename = uri.split("/").pop() ?? "photo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = ext === "png" ? "image/png" : "image/jpeg";
  const formData = new FormData();
  formData.append("file", { uri, name: filename, type } as any);
  return formData;
}

export const uploadApi = {
  /** POST /api/upload/avatar – Profil fotoğrafı yükle, public URL döner */
  uploadAvatar: (uri: string): Promise<string> =>
    apiClient
      .post<RootEntity<string>>("/api/upload/avatar", buildFormData(uri), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => unwrap(res.data)),

  /** POST /api/upload/post-image – Gönderi fotoğrafı yükle, public URL döner */
  uploadPostImage: (uri: string): Promise<string> =>
    apiClient
      .post<RootEntity<string>>("/api/upload/post-image", buildFormData(uri), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => unwrap(res.data)),

  /** POST /api/upload/listing-image – Pazar yeri ilan fotoğrafı yükle, public URL döner */
  uploadListingImage: (uri: string): Promise<string> =>
    apiClient
      .post<RootEntity<string>>("/api/upload/listing-image", buildFormData(uri), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => unwrap(res.data)),
};
