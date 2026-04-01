import { apiClient } from "./client";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

export interface DtoNeighborhood {
  id: number;
  city: string;
  district: string;
  name: string;
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) throw new Error(entity.errormessage ?? "Sunucu hatası.");
  return entity.data;
}

// ─── Neighborhood API ─────────────────────────────────────────────────────────

export const neighborhoodApi = {
  /**
   * GET /api/locations/districts?city=Konya
   * Verilen şehirdeki ilçeleri döner.
   */
  getDistricts: (city = "Konya"): Promise<string[]> =>
    apiClient
      .get<RootEntity<string[]>>("/api/locations/districts", {
        params: { city },
      })
      .then((res) => unwrap(res.data)),

  /**
   * GET /api/locations/neighborhoods?district=Meram
   * İlçeye ait mahalleleri döner.
   */
  getNeighborhoods: (district: string): Promise<DtoNeighborhood[]> =>
    apiClient
      .get<RootEntity<DtoNeighborhood[]>>("/api/locations/neighborhoods", {
        params: { district },
      })
      .then((res) => unwrap(res.data)),
};
