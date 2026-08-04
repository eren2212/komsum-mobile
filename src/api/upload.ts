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

/**
 * Yüklenmesine izin verilen görsel türleri. Backend de aynı üçünü kabul ediyor
 * ve dosyanın gerçek içeriğine (magic byte) bakarak doğruluyor — burası yalnızca
 * kullanıcıya hızlı ve anlaşılır bir hata verebilmek için.
 *
 * Boyut sınırı (5 MB) bilerek burada değil sunucuda: cihazda dosya boyutu
 * okumak expo-file-system gerektiriyor ve bu native bağımlılığı eklemek yeni
 * bir derleme demek. Sunucu limiti aşan dosyaya anlaşılır Türkçe hata dönüyor.
 */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function buildFormData(uri: string): FormData {
  // Yalnızca cihazdaki yerel dosyalar yüklenebilir. Bozuk bir seçici sonucu ya
  // da deep link ile gelen uzak bir adres, farkında olmadan üçüncü taraf bir
  // URL'in sunucumuza aktarılmasına yol açabilirdi.
  if (!/^(file|content|ph|assets-library):/i.test(uri)) {
    throw new Error("Geçersiz dosya seçimi, lütfen galeriden bir görsel seçin.");
  }

  const filename = uri.split("/").pop() ?? "photo.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME_BY_EXTENSION[ext];

  // Önceden png dışındaki HER ŞEY image/jpeg olarak etiketleniyordu; webp ve
  // heic dosyalar yanlış türle gidiyordu.
  if (!type) {
    throw new Error("Sadece JPG, PNG veya WebP formatında görsel yükleyebilirsin.");
  }

  const formData = new FormData();
  formData.append("file", { uri, name: filename, type } as any);
  return formData;
}

/**
 * Ortak yükleme. Metotlar bilerek `async`: buildFormData artık geçersiz
 * dosyada senkron hata fırlatıyor ve senkron bir throw, çağıranın
 * `.catch()`/`Promise.all` zincirini atlayıp yukarı kaçardı.
 */
async function upload(path: string, uri: string): Promise<string> {
  const res = await apiClient.post<RootEntity<string>>(path, buildFormData(uri), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(res.data);
}

export const uploadApi = {
  /** POST /api/upload/avatar – Profil fotoğrafı yükle, public URL döner */
  uploadAvatar: (uri: string): Promise<string> => upload("/api/upload/avatar", uri),

  /** POST /api/upload/post-image – Gönderi fotoğrafı yükle, public URL döner */
  uploadPostImage: (uri: string): Promise<string> => upload("/api/upload/post-image", uri),

  /** POST /api/upload/listing-image – Pazar yeri ilan fotoğrafı yükle, public URL döner */
  uploadListingImage: (uri: string): Promise<string> => upload("/api/upload/listing-image", uri),

  /** POST /api/upload/event-image – Etkinlik kapak fotoğrafı yükle, public URL döner */
  uploadEventImage: (uri: string): Promise<string> => upload("/api/upload/event-image", uri),

  /** POST /api/upload/roomio-photo – Roomio profil fotoğrafı yükle, public URL döner */
  uploadRoomioPhoto: (uri: string): Promise<string> => upload("/api/upload/roomio-photo", uri),
};
