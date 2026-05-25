import { create } from "zustand";
import {
  authApi,
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/api/auth";
import { extractErrorMessage } from "@/utils/apiError";
import { tokenStorage } from "@/utils/tokenStorage";
import {
  registerForPushNotificationsAsync,
  unregisterPushNotifications,
} from "@/lib/notifications";

// ─── State tipi ───────────────────────────────────────────────────────────────

interface AuthState {
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Uygulama açılışında SecureStore'dan token yükleniyor mu?
   * true iken navigation guard bekler — signin flash'ı önler.
   */
  isHydrating: boolean;

  /** Uygulama açılışında token'ları SecureStore'dan yükler */
  hydrateTokens: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  login: (payload: LoginPayload) => Promise<boolean>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<string | null>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string | null>;
  logout: () => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  tokens: null,
  isLoading: false,
  error: null,
  isHydrating: true, // başlangıçta true → hydration tamamlanana kadar guard bekler

  hydrateTokens: async () => {
    try {
      const tokens = await tokenStorage.load();
      set({ tokens, isHydrating: false });
    } catch {
      set({ isHydrating: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.register(payload);
      await tokenStorage.save(tokens);
      set({ tokens, isLoading: false });
      // Push token kaydını ana akışı bloklamadan tetikle
      registerForPushNotificationsAsync().catch(() => {});
      return true;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err), isLoading: false });
      return false;
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.login(payload);
      await tokenStorage.save(tokens);
      set({ tokens, isLoading: false });
      // Push token kaydını ana akışı bloklamadan tetikle
      registerForPushNotificationsAsync().catch(() => {});
      return true;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err), isLoading: false });
      return false;
    }
  },

  forgotPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await authApi.forgotPassword(payload);
      set({ isLoading: false });
      return message;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err), isLoading: false });
      return null;
    }
  },

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const message = await authApi.resetPassword(payload);
      set({ isLoading: false });
      return message;
    } catch (err: unknown) {
      set({ error: extractErrorMessage(err), isLoading: false });
      return null;
    }
  },

  logout: () => {
    // Token henüz geçerli iken backend'e FCM token sil isteğini gönder
    unregisterPushNotifications().finally(() => {
      tokenStorage.clear();
      set({ tokens: null, error: null });
    });
  },

  clearError: () => set({ error: null }),
}));
