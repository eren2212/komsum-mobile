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

/** Backend EventCategory enum ile birebir eşleşir */
export type EventCategory =
  | "SPORTS"
  | "ARTS_MUSIC"
  | "FOOD_DRINK"
  | "TRAVEL"
  | "EDUCATION"
  | "OTHER";

export interface DtoEvent {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category: EventCategory;
  /** ISO-8601 string (LocalDateTime) – örn: "2025-04-28T19:30:00" */
  eventDate: string;
  location: string;
  latitude: number;
  longitude: number;
  priceText?: string | null;

  authorId: number;
  authorFirstName: string;
  authorLastName: string;
  neighborhoodName: string;

  participantCount: number;
  joinedByMe: boolean;
  bookmarkedByMe: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

export interface DtoCreateEvent {
  title: string;
  description?: string;
  imageUrl?: string;
  category: EventCategory;
  /** ISO-8601 LocalDateTime – örn: "2025-04-28T19:30:00" */
  eventDate: string;
  location: string;
  latitude: number;
  longitude: number;
  priceText?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const eventApi = {
  /** GET /api/events/{id} – Tekil etkinlik detayı */
  getEventById: (eventId: number): Promise<DtoEvent> =>
    apiClient
      .get<RootEntity<DtoEvent>>(`/api/events/${eventId}`)
      .then((res) => unwrap(res.data)),

  /** GET /api/events/district – Kullanıcının ilçesindeki aktif etkinlikler (eski, geriye uyumlu) */
  getDistrictEvents: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoEvent>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoEvent>>>("/api/events/district", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /**
   * GET /api/events/nearby – Cihaz konumuna göre radius (metre) içindeki etkinlikler.
   * lat/lng verilmezse backend ilçe bazlı akışa düşer (geriye uyumluluk).
   */
  getNearbyEvents: (
    lat?: number,
    lng?: number,
    radius = 10000,
    pageNo = 0,
    pageSize = 10,
  ): Promise<PageResponse<DtoEvent>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoEvent>>>("/api/events/nearby", {
        params: {
          pageNo,
          pageSize,
          radius,
          ...(lat != null && lng != null ? { lat, lng } : {}),
        },
      })
      .then((res) => unwrap(res.data)),

  /** POST /api/events/{id}/participate – Katıl / Ayrıl toggle */
  toggleParticipation: (eventId: number): Promise<string> =>
    apiClient
      .post<RootEntity<string>>(`/api/events/${eventId}/participate`)
      .then((res) => unwrap(res.data)),

  /** POST /api/events/{id}/bookmark – Kaydet / Çıkar toggle */
  toggleBookmark: (eventId: number): Promise<string> =>
    apiClient
      .post<RootEntity<string>>(`/api/events/${eventId}/bookmark`)
      .then((res) => unwrap(res.data)),

  /** POST /api/events – Yeni etkinlik oluştur */
  createEvent: (body: DtoCreateEvent): Promise<DtoEvent> =>
    apiClient
      .post<RootEntity<DtoEvent>>("/api/events/create", body)
      .then((res) => unwrap(res.data)),

  /** GET /api/events/my-events – Benim oluşturduğum etkinlikler */
  getMyEvents: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoEvent>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoEvent>>>("/api/events/my-events", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/events/my-bookmarked – Kaydettiğim etkinlikler */
  getMyBookmarkedEvents: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoEvent>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoEvent>>>("/api/events/my-bookmarked", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/events/my-joined – Katıldığım etkinlikler */
  getMyJoinedEvents: (pageNo = 0, pageSize = 10): Promise<PageResponse<DtoEvent>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoEvent>>>("/api/events/my-joined", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),
};
