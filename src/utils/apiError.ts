/**
 * Backend Hata Formatları
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Format 1 — ApiError<String>  (BaseException, BadCredentialsException)
 *   { status: 401, exception: { message: "string mesaj" } }
 *
 * Format 2 — ApiError<Map>  (MethodArgumentNotValidException – validation)
 *   { status: 400, exception: { message: { fieldName: ["hata1", "hata2"] } } }
 *
 * Format 3 — JWT / Token hatası  (Filtreden gelen RootEntity benzeri yapı)
 *   { result: false, errorMessage: { messageType: "TOKEN_EXPIRED", message: "..." } }
 *
 * Format 4 — RootEntity hatası  (unwrap() içinde fırlatılan Error)
 *   Axios hatası değil, bizim fırlattığımız → sadece err.message içerir
 */

type ApiErrorData = Record<string, unknown>;

/**
 * Herhangi bir Axios/fetch hatasından backend'in gönderdiği mesajı çıkarır.
 * Frontend'e özgü hardcoded mesaj YAZILMAZ; her şey backend'den gelir.
 * Sadece ağ hatası / sunucu erişilemiyor gibi durumlarda generic mesaj döner.
 */
export function extractErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Bir hata oluştu.";

  // Axios HTTP hatası → response.data'ya bak
  if ("response" in err) {
    const data = (err as { response?: { data?: ApiErrorData } }).response
      ?.data as ApiErrorData | undefined;

    if (data) {
      // ── Format 1: ApiError<String> ──────────────────────────────────────────
      // { exception: { message: "string" } }
      if (
        data.exception &&
        typeof data.exception === "object" &&
        "message" in (data.exception as object)
      ) {
        const exMsg = (data.exception as { message: unknown }).message;

        if (typeof exMsg === "string") {
          return exMsg;
        }

        // ── Format 2: ApiError<Map> (validation) ────────────────────────────
        // { exception: { message: { fieldName: ["hata1"] } } }
        if (exMsg && typeof exMsg === "object") {
          const fieldErrors = Object.values(
            exMsg as Record<string, string[]>
          ).flat();
          if (fieldErrors.length > 0) return fieldErrors.join("\n");
        }
      }

      // ── Format 3: JWT / Token hatası ────────────────────────────────────────
      // { result: false, errorMessage: { message: "..." } }
      if (
        data.errorMessage &&
        typeof data.errorMessage === "object" &&
        "message" in (data.errorMessage as object)
      ) {
        const tokenMsg = (data.errorMessage as { message: unknown }).message;
        if (typeof tokenMsg === "string") return tokenMsg;
      }

      // ── Format 4: RootEntity düz hata (errormessage string) ─────────────────
      if (typeof data.errormessage === "string" && data.errormessage) {
        return data.errormessage;
      }
    }
  }

  // Axios ağ / timeout hatası (response yok) veya kendi fırlattığımız Error
  if ("message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }

  return "Bir hata oluştu.";
}
