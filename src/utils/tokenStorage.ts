import * as SecureStore from "expo-secure-store";
import { AuthTokens } from "@/api/auth";

const KEYS = {
  ACCESS: "komsum_access_token",
  REFRESH: "komsum_refresh_token",
} as const;

/**
 * JWT token'larını cihazın güvenli deposuna kaydet / yükle / sil.
 * iOS → Keychain, Android → Keystore
 */
export const tokenStorage = {
  save: async (tokens: AuthTokens): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, tokens.access_token),
      SecureStore.setItemAsync(KEYS.REFRESH, tokens.refresh_token),
    ]);
  },

  load: async (): Promise<AuthTokens | null> => {
    const [access_token, refresh_token] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS),
      SecureStore.getItemAsync(KEYS.REFRESH),
    ]);
    if (access_token && refresh_token) return { access_token, refresh_token };
    return null;
  },

  clear: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
    ]);
  },
};
