import { apiClient } from "./client";

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

export interface DtoCity {
  id: number;
  name: string;
}

export interface DtoDistrict {
  id: number;
  name: string;
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
  /** GET /api/locations/cities */
  getCities: (): Promise<DtoCity[]> =>
    apiClient
      .get<RootEntity<DtoCity[]>>("/api/locations/cities")
      .then((res) => unwrap(res.data)),

  /** GET /api/locations/districts?cityId=34 */
  getDistricts: (cityId: number): Promise<DtoDistrict[]> =>
    apiClient
      .get<RootEntity<DtoDistrict[]>>("/api/locations/districts", {
        params: { cityId },
      })
      .then((res) => unwrap(res.data)),

  /** GET /api/locations/neighborhoods?districtId=100 */
  getNeighborhoods: (districtId: number): Promise<DtoNeighborhood[]> =>
    apiClient
      .get<RootEntity<DtoNeighborhood[]>>("/api/locations/neighborhoods", {
        params: { districtId },
      })
      .then((res) => unwrap(res.data)),
};
