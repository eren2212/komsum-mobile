import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { apiClient } from "./client";

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

// Spring Page<T> zarfı (nearby endpoint'i bunu döndürür)
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

// ─── Kategori enum (backend ServiceCategory ile birebir) ──────────────────────

export type ServiceCategory =
  | "OGRETMEN"
  | "OZEL_DERS"
  | "SU_TESISATCISI"
  | "ELEKTRIKCI"
  | "BOYACI"
  | "MARANGOZ"
  | "TADILAT"
  | "TEMIZLIK"
  | "BAKICI"
  | "NAKLIYAT"
  | "KLIMA_BEYAZ_ESYA"
  | "BAHCIVAN"
  | "KUAFOR_GUZELLIK"
  | "TERZI"
  | "DIGER";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Enum değeri → Türkçe etiket (UI'da gösterim) */
export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  OGRETMEN: "Öğretmen",
  OZEL_DERS: "Özel Ders",
  SU_TESISATCISI: "Su Tesisatçısı",
  ELEKTRIKCI: "Elektrikçi",
  BOYACI: "Boyacı",
  MARANGOZ: "Marangoz",
  TADILAT: "Tadilat",
  TEMIZLIK: "Temizlik",
  BAKICI: "Bakıcı",
  NAKLIYAT: "Nakliyat",
  KLIMA_BEYAZ_ESYA: "Klima & Beyaz Eşya",
  BAHCIVAN: "Bahçıvan",
  KUAFOR_GUZELLIK: "Kuaför & Güzellik",
  TERZI: "Terzi",
  DIGER: "Diğer",
};

/** Enum değeri → Ionicons ikonu (kart/rozet için) */
export const SERVICE_CATEGORY_ICONS: Record<ServiceCategory, IconName> = {
  OGRETMEN: "school-outline",
  OZEL_DERS: "book-outline",
  SU_TESISATCISI: "water-outline",
  ELEKTRIKCI: "flash-outline",
  BOYACI: "color-fill-outline",
  MARANGOZ: "hammer-outline",
  TADILAT: "construct-outline",
  TEMIZLIK: "sparkles-outline",
  BAKICI: "heart-outline",
  NAKLIYAT: "cube-outline",
  KLIMA_BEYAZ_ESYA: "snow-outline",
  BAHCIVAN: "leaf-outline",
  KUAFOR_GUZELLIK: "cut-outline",
  TERZI: "shirt-outline",
  DIGER: "ellipsis-horizontal-outline",
};

/** UI listeleri için sıralı kategori dizisi */
export const SERVICE_CATEGORIES = Object.keys(
  SERVICE_CATEGORY_LABELS,
) as ServiceCategory[];

export const categoryLabel = (c: ServiceCategory): string =>
  SERVICE_CATEGORY_LABELS[c] ?? c;

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface DtoServiceProvider {
  id: number;
  /** Profil sahibinin kullanıcı id'si — detay endpoint'i /{userId} ile çalışır */
  userId: number;
  title: string;
  category: ServiceCategory;
  phone: string;
  address: string;
  description?: string | null;
  experienceYears?: number | null;
  priceInfo?: string | null;
  /** Usta şu an iş alıyor mu */
  available: boolean;
  /** Admin onayı — false ise rehberde görünmez */
  verified: boolean;
  profileImageUrl?: string | null;
  ownerFirstName: string;
  ownerLastName: string;
  /** Harita konumu (pin için). Girilmemişse null. */
  latitude?: number | null;
  longitude?: number | null;
}

export interface DtoCreateServiceProvider {
  title: string;
  category: ServiceCategory;
  phone: string;
  address: string;
  description?: string;
  experienceYears?: number;
  priceInfo?: string;
  available?: boolean;
  /** Harita konumu — zorunlu (usta haritadan işaretler) */
  latitude: number;
  longitude: number;
}

export interface DtoUpdateServiceProvider {
  title?: string;
  category?: ServiceCategory;
  phone?: string;
  description?: string;
  experienceYears?: number;
  priceInfo?: string;
  available?: boolean;
  profileImageUrl?: string;
  neighborhoodId?: number;
  /** Konum taşındıysa yeni koordinat — ikisi birlikte gönderilmeli */
  latitude?: number;
  longitude?: number;
}

export interface NearbyParams {
  lat: number;
  lng: number;
  /** metre cinsinden yarıçap */
  radius: number;
  category?: ServiceCategory;
  pageNo?: number;
  pageSize?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const serviceProviderApi = {
  /** POST /api/service-providers/create – Yeni usta profili oluşturur. */
  createServiceProviderProfile: (
    data: DtoCreateServiceProvider,
  ): Promise<DtoServiceProvider> =>
    apiClient
      .post<RootEntity<DtoServiceProvider>>(
        "/api/service-providers/create",
        data,
      )
      .then((res) => {
        if (!res.data.result)
          throw new Error(res.data.errormessage ?? "Profil oluşturulamadı.");
        return res.data.data;
      }),

  /**
   * GET /api/service-providers/me – Giriş yapmış kullanıcının usta profili.
   * Profil yoksa null döner (crash atmaz).
   */
  getMyServiceProviderProfile: (): Promise<DtoServiceProvider | null> =>
    apiClient
      .get<RootEntity<DtoServiceProvider>>("/api/service-providers/me")
      .then((res) => (res.data.result ? res.data.data : null))
      .catch(() => null),

  /** GET /api/service-providers/directory – Mahalledeki onaylı ustalar (opsiyonel kategori). */
  getDirectory: (category?: ServiceCategory): Promise<DtoServiceProvider[]> =>
    apiClient
      .get<RootEntity<DtoServiceProvider[]>>(
        "/api/service-providers/directory",
        { params: category ? { category } : undefined },
      )
      .then((res) => {
        if (!res.data.result)
          throw new Error(res.data.errormessage ?? "Sunucu hatası.");
        return res.data.data;
      })
      .catch(() => []),

  /**
   * GET /api/service-providers/nearby – Konuma bağlı (km/radius) listeleme.
   * En yakın usta en üstte. Page döner; content dizisini çıkarırız.
   */
  getNearby: ({
    lat,
    lng,
    radius,
    category,
    pageNo = 0,
    pageSize = 50,
  }: NearbyParams): Promise<DtoServiceProvider[]> =>
    apiClient
      .get<RootEntity<SpringPage<DtoServiceProvider>>>(
        "/api/service-providers/nearby",
        {
          params: { lat, lng, radius, category, pageNo, pageSize },
        },
      )
      .then((res) => (res.data.result ? (res.data.data.content ?? []) : []))
      .catch(() => []),

  /** GET /api/service-providers/{userId} – Belirli bir kullanıcının usta profili. */
  getServiceProviderProfile: (
    userId: number,
  ): Promise<DtoServiceProvider | null> =>
    apiClient
      .get<RootEntity<DtoServiceProvider>>(
        `/api/service-providers/${userId}`,
      )
      .then((res) => (res.data.result ? res.data.data : null))
      .catch(() => null),

  /** POST /api/service-providers/me/update – Usta profilini günceller. */
  updateServiceProviderProfile: (
    data: DtoUpdateServiceProvider,
  ): Promise<DtoServiceProvider> =>
    apiClient
      .post<RootEntity<DtoServiceProvider>>(
        "/api/service-providers/me/update",
        data,
      )
      .then((res) => {
        if (!res.data.result)
          throw new Error(res.data.errormessage ?? "Profil güncellenemedi.");
        return res.data.data;
      }),

  /** DELETE /api/service-providers/me/delete – Usta profilini kalıcı siler. */
  deleteMyServiceProviderProfile: (): Promise<boolean> =>
    apiClient
      .delete<RootEntity<boolean>>("/api/service-providers/me/delete")
      .then((res) => {
        if (!res.data.result)
          throw new Error(res.data.errormessage ?? "Profil kapatılamadı.");
        return res.data.data;
      }),
};
