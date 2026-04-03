import { apiClient } from "./client";
import type { DtoNeighborhood } from "./neighborhood";

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

export interface DtoUserProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  verifiedNeighbor: boolean;
  neighborhood: DtoNeighborhood;
}

export interface DtoNeighbour {
  id: number;
  firstname: string;
  lastname: string;
  bio?: string | null;
  avatarUrl?: string | null;
  neighborhood: DtoNeighborhood;
}

export interface DtoUserUpdate {
  firstname?: string;
  lastname?: string;
  bio?: string;
  avatarUrl?: string;
  neighborhoodId?: number;
}

export interface DtoUserPassword {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const userApi = {
  /** GET /api/users/me – Giriş yapmış kullanıcının profili */
  getMyProfile: (): Promise<DtoUserProfile> =>
    apiClient
      .get<RootEntity<DtoUserProfile>>("/api/users/me")
      .then((res) => unwrap(res.data)),

  /** GET /api/users/{id} – Herhangi bir komşunun profili */
  getNeighbourProfile: (id: number): Promise<DtoNeighbour> =>
    apiClient
      .get<RootEntity<DtoNeighbour>>(`/api/users/${id}`)
      .then((res) => unwrap(res.data)),

  /** PATCH /api/users/me – Profil güncelleme */
  updateProfile: (payload: DtoUserUpdate): Promise<DtoUserProfile> =>
    apiClient
      .patch<RootEntity<DtoUserProfile>>("/api/users/me", payload)
      .then((res) => unwrap(res.data)),

  /** PATCH /api/users/me/update-password – Şifre güncelleme */
  updatePassword: (payload: DtoUserPassword): Promise<boolean> =>
    apiClient
      .patch<RootEntity<boolean>>("/api/users/me/update-password", payload)
      .then((res) => unwrap(res.data)),
};

