import { apiClient } from "./client";

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface DtoMerchant {
  id: number;
  shopName: string;
  category: string;
  phone: string;
  address: string;
  description?: string | null;
  /** Admin onayı — false ise SPONSORED post atanamaz */
  verified: boolean;
  ownerFirstName: string;
  ownerLastName: string;
}

export interface DtoCreateMerchant {
  shopName: string;
  category: string;
  phone: string;
  address: string;
  description?: string;
}

export interface DtoUpdateMerchant {
  shopName?: string;
  phone?: string;
  description?: string;
  profileImageUrl?: string;
  neighborhoodId?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const merchantApi = {
  /**
   * POST /api/merchants/create – Yeni esnaf profili oluşturur.
   */
  createMerchantProfile: (data: DtoCreateMerchant): Promise<DtoMerchant> =>
    apiClient
      .post<RootEntity<DtoMerchant>>("/api/merchants/create", data)
      .then((res) => {
        if (!res.data.result) throw new Error(res.data.errormessage ?? "Profil oluşturulamadı.");
        return res.data.data;
      }),

  /**
   * GET /api/merchants/me – Giriş yapmış kullanıcının esnaf profilini getirir.
   * Profil yoksa veya bir hata olursa null döner (crash atmaz).
   */
  getMyMerchantProfile: (): Promise<DtoMerchant | null> =>
    apiClient
      .get<RootEntity<DtoMerchant>>("/api/merchants/me")
      .then((res) => (res.data.result ? res.data.data : null))
      .catch(() => null),

  /** GET /api/merchants/directory – Mahalledeki esnaf rehberi */
  getDirectory: (): Promise<DtoMerchant[]> =>
    apiClient
      .get<RootEntity<DtoMerchant[]>>("/api/merchants/directory")
      .then((res) => {
        if (!res.data.result) throw new Error(res.data.errormessage ?? "Sunucu hatası.");
        return res.data.data;
      })
      .catch(() => []),

  /** GET /api/merchants/{userId} – Belirli bir kullanıcının esnaf profili */
  getMerchantProfile: (userId: number): Promise<DtoMerchant | null> =>
    apiClient
      .get<RootEntity<DtoMerchant>>(`/api/merchants/${userId}`)
      .then((res) => (res.data.result ? res.data.data : null))
      .catch(() => null),

  /** POST /api/merchants/me/update – Esnaf profilini günceller */
  updateMerchantProfile: (data: DtoUpdateMerchant): Promise<DtoMerchant> =>
    apiClient
      .post<RootEntity<DtoMerchant>>("/api/merchants/me/update", data)
      .then((res) => {
        if (!res.data.result) throw new Error(res.data.errormessage ?? "Profil güncellenemedi.");
        return res.data.data;
      }),

  /** DELETE /api/merchants/me/delete – Esnaf profilini kalıcı olarak siler */
  deleteMyMerchantProfile: (): Promise<boolean> =>
    apiClient
      .delete<RootEntity<boolean>>("/api/merchants/me/delete")
      .then((res) => {
        if (!res.data.result) throw new Error(res.data.errormessage ?? "Profil kapatılamadı.");
        return res.data.data;
      }),
};
