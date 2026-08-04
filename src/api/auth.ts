import { apiClient } from "./client";

// ─── Backend modeli: RootEntity<T> ───────────────────────────────────────────
// { result: boolean, errormessage: string | null, data: T }

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

// ─── Request tipleri (DtoRegisterRequest / DtoLoginRequest) ──────────────────

export interface RegisterPayload {
  firstname: string;       // max 15 karakter
  lastname: string;        // max 15 karakter
  email: string;
  password: string;        // 8–15 karakter
  neighborhoodId: number;  // pozitif, zorunlu
  acceptedLegalDocumentIds: number[]; // onaylanan KVKK + Aydınlatma metni ID'leri
}

export interface LoginPayload {
  email: string;
  password: string; // 8–15 karakter
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ─── Response tipi (DtoAuthenticationResponse) ───────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// ─── Yardımcı: sunucu hatasını yakala ────────────────────────────────────────

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) {
    throw new Error(entity.errormessage ?? "Sunucu hatası.");
  }
  return entity.data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthTokens> =>
    apiClient
      .post<RootEntity<AuthTokens>>("/api/auth/register", payload)
      .then((res) => unwrap(res.data)),

  login: (payload: LoginPayload): Promise<AuthTokens> =>
    apiClient
      .post<RootEntity<AuthTokens>>("/api/auth/login", payload)
      .then((res) => unwrap(res.data)),

  refreshToken: (refreshToken: string): Promise<AuthTokens> =>
    apiClient
      .post<RootEntity<AuthTokens>>(
        "/api/auth/refresh-token",
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )
      .then((res) => unwrap(res.data)),

  /**
   * POST /api/auth/logout — refresh token'ı sunucu tarafında iptal eder.
   * İstemci token'ı zaten siliyor; bu çağrı çalınmış bir kopyanın kalan ömrü
   * boyunca kullanılmasını engeller. Başarısız olursa çıkış yine de tamamlanır.
   */
  logout: (refreshToken: string): Promise<string> =>
    apiClient
      .post<RootEntity<string>>(
        "/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      )
      .then((res) => unwrap(res.data)),

  /** POST /api/auth/forgot-password — OTP e-postaya gönderilir */
  forgotPassword: (payload: ForgotPasswordPayload): Promise<string> =>
    apiClient
      .post<RootEntity<string>>("/api/auth/forgot-password", payload)
      .then((res) => unwrap(res.data)),

  /** POST /api/auth/reset-password — Yeni şifre belirlenir */
  resetPassword: (payload: ResetPasswordPayload): Promise<string> =>
    apiClient
      .post<RootEntity<string>>("/api/auth/reset-password", payload)
      .then((res) => unwrap(res.data)),
};
