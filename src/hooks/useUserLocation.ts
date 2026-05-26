import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

// ─── Tipler ─────────────────────────────────────────────────────────────────

export type LocationStatus =
  | "idle" // henüz istenmedi
  | "loading" // izin/konum alınıyor
  | "granted" // konum elde edildi
  | "denied" // kullanıcı izni reddetti
  | "error"; // konum alınamadı (GPS kapalı, timeout vb.)

export interface UserCoords {
  latitude: number;
  longitude: number;
}

// ─── Oturum-düzeyi cache ──────────────────────────────────────────────────────
// Sekmeler arası geçişte (Esnaf <-> Etkinlik) tekrar tekrar GPS sorgusu atmamak
// için son alınan konumu modül seviyesinde tutuyoruz.
let _cachedCoords: UserCoords | null = null;

/**
 * Kullanıcının ön plan (foreground) konumunu izin akışıyla birlikte yöneten hook.
 *
 * - `request()` izin ister ve konumu alır; reddedilirse `status = "denied"` olur,
 *   `coords` null kalır (çağıran taraf mahalle/ilçe fallback'ine düşebilir).
 * - Alınan konum oturum boyunca cache'lenir; tekrar `request()` anında döner.
 *
 * @param autoRequest true ise mount olunca otomatik konum ister.
 */
export function useUserLocation(autoRequest = false) {
  const [coords, setCoords] = useState<UserCoords | null>(_cachedCoords);
  const [status, setStatus] = useState<LocationStatus>(
    _cachedCoords ? "granted" : "idle",
  );
  const inFlight = useRef(false);

  const request = useCallback(async () => {
    if (inFlight.current) return;
    // Cache varsa GPS'i tekrar yorma
    if (_cachedCoords) {
      setCoords(_cachedCoords);
      setStatus("granted");
      return;
    }

    inFlight.current = true;
    setStatus("loading");
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setCoords(null);
        setStatus("denied");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next: UserCoords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      _cachedCoords = next;
      setCoords(next);
      setStatus("granted");
    } catch {
      setCoords(null);
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) request();
  }, [autoRequest, request]);

  return {
    coords,
    status,
    loading: status === "loading",
    /** İzin/konum nihai bir sonuca ulaştı mı (sorguyu tetiklemek için) */
    settled: status === "granted" || status === "denied" || status === "error",
    request,
  };
}
