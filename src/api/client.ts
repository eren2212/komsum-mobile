import axios from "axios";

/**
 * Axios instance – tüm API istekleri buradan geçer.
 *
 * BASE_URL:
 *   Android Emulator  → http://10.0.2.2:8080
 *   iOS Simulator     → http://localhost:8080
 *   Gerçek cihaz      → http://<bilgisayar-IP>:8080
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (__DEV__) {
  console.log("[KOMSUM] baked API URL:", BASE_URL);
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});
