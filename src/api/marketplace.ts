import { apiClient } from "./client";

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) throw new Error(entity.errormessage ?? "Sunucu hatası.");
  return entity.data;
}

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type ListingType = "FOR_SALE" | "TRADE_GIFT";
export type ListingStatus = "ACTIVE" | "SOLD" | "DELETED";

export interface DtoListing {
  id: number;
  title: string;
  imageUrl: string;
  type: ListingType;
  price?: number | null;
  category: string;
  status: ListingStatus;
  createdAt: string;
  sellerId: number;
  sellerFirstName: string;
  sellerLastName: string;
}

export interface DtoCreateListing {
  title: string;
  imageUrl: string;
  type: ListingType;
  price?: number | null;
  category: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const marketplaceApi = {
  /** POST /api/marketplace – Yeni ilan oluştur */
  createListing: (data: DtoCreateListing): Promise<DtoListing> =>
    apiClient
      .post<RootEntity<DtoListing>>("/api/marketplace", data)
      .then((res) => unwrap(res.data)),

  /** GET /api/marketplace/feed – Mahalledeki ilanlar (sayfalı) */
  getFeed: (pageNo = 0, pageSize = 20): Promise<PageResponse<DtoListing>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoListing>>>("/api/marketplace/feed", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/marketplace/me – Kendi ilanlarım */
  getMyListings: (pageNo = 0, pageSize = 20): Promise<PageResponse<DtoListing>> =>
    apiClient
      .get<RootEntity<PageResponse<DtoListing>>>("/api/marketplace/me", {
        params: { pageNo, pageSize },
      })
      .then((res) => unwrap(res.data)),

  /** PATCH /api/marketplace/{id}/status – İlan durumunu güncelle */
  updateListingStatus: (listingId: number, status: ListingStatus): Promise<DtoListing> =>
    apiClient
      .patch<RootEntity<DtoListing>>(`/api/marketplace/${listingId}/status`, null, {
        params: { status },
      })
      .then((res) => unwrap(res.data)),
};
