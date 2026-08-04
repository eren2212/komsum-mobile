import { router } from "expo-router";
import { apiClient } from "./client";
import { authApi } from "./auth";
import { useAuthStore } from "@/store/authStore";
import { tokenStorage } from "@/utils/tokenStorage";
import { realtimeChat } from "@/lib/realtimeChat";

// ─── Public endpoint'ler — token eklenmez, 401'de refresh tetiklenmez ─────────

const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh-token",
  // logout, Authorization başlığında REFRESH token taşır — request
  // interceptor'ın onu access token'la ezmemesi için public sayılır.
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Kayıt öncesi (token yokken) çağrılan açık uçlar. Bunlar PUBLIC olmazsa,
  // dönen 401 refresh→logout akışını tetikleyip kullanıcıyı signin'e atar.
  "/api/legal",
  "/api/locations",
];

const isPublicPath = (url?: string) =>
  PUBLIC_PATHS.some((p) => url?.includes(p));

// ─── Refresh queue — eş zamanlı 401'leri tek refresh'e indir ─────────────────

let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(err: unknown, token: string | null = null) {
  queue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token!)
  );
  queue = [];
}

/**
 * Oturumun sunucu tarafında geçersiz olduğu anlaşıldığında (refresh token
 * reddedildi ya da hiç yok) yerel durumu KESİN olarak temizler.
 *
 * authStore.logout() burada bilerek kullanılmıyor: o, sunucuya çıkış isteği
 * gönderiyor ve state'i ancak istek sonuçlandıktan sonra temizliyor. Oysa
 * buradaki senaryoda token'ın geçersiz olduğunu zaten biliyoruz — istek boşuna
 * gider ve temizlik gecikirse signin'e giderken bir an korumalı ekran
 * görünebilir. Bu yüzden temizlik doğrudan ve sırayla yapılır.
 */
async function forceLocalLogout() {
  realtimeChat.disconnect();
  await tokenStorage.clear();
  useAuthStore.setState({ tokens: null, error: null });
  router.replace("/auth/signin");
}

// ─── Kurulum (bir kez çağrılır) ───────────────────────────────────────────────

export function setupInterceptors() {
  /**
   * REQUEST interceptor:
   * Public olmayan her isteğe geçerli access token'ı ekler.
   */
  apiClient.interceptors.request.use((config) => {
    if (isPublicPath(config.url)) return config;

    const tokens = useAuthStore.getState().tokens;
    if (tokens?.access_token) {
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    } else if (__DEV__) {
      // Token'ın kendisi (parçası dahi) ASLA loglanmaz: cihaz logları
      // Logcat/Console ve crash toplayıcılar tarafından okunabiliyor,
      // refresh token uzun ömürlü olduğu için sızması hesap ele geçirmeye
      // yeter. Sadece hangi isteğin token'sız gittiği bilgisi bırakıldı.
      console.warn(
        "[axios] →",
        config.method?.toUpperCase(),
        config.url,
        "AUTH HEADER YOK",
      );
    }
    return config;
  });

  /**
   * RESPONSE interceptor:
   * - 401 alındığında refresh token ile yeni access token ister.
   * - Refresh başarılıysa orijinal istek token güncellenerek tekrarlanır.
   * - Refresh başarısızsa kullanıcı logout edilir ve signin'e yönlendirilir.
   */
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Public endpoint hatalarını ya da zaten tekrarlanmış istekleri geç
      if (
        error.response?.status !== 401 ||
        originalRequest._retry ||
        isPublicPath(originalRequest.url)
      ) {
        return Promise.reject(error);
      }

      // Başka bir refresh devam ediyorsa sıraya gir
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { tokens } = useAuthStore.getState();

      // Refresh token yoksa direkt çıkış
      if (!tokens?.refresh_token) {
        isRefreshing = false;
        flushQueue(error);
        await forceLocalLogout();
        return Promise.reject(error);
      }

      try {
        const newTokens = await authApi.refreshToken(tokens.refresh_token);

        // Yeni token'ları kaydet
        await tokenStorage.save(newTokens);
        useAuthStore.setState({ tokens: newTokens });

        flushQueue(null, newTokens.access_token);

        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError);
        await forceLocalLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
