import { apiClient } from "./client";

// ─── Backend modeli: RootEntity<T> ───────────────────────────────────────────

interface RootEntity<T> {
  result: boolean;
  errormessage: string | null;
  data: T;
}

// ─── Tipler (DtoLegalDocument / LegalDocumentType) ───────────────────────────

export type LegalDocumentType = "KVKK" | "AYDINLATMA_METNI";

export interface DtoLegalDocument {
  id: number;
  type: LegalDocumentType;
  title: string;
  content: string;
  version: number;
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────

function unwrap<T>(entity: RootEntity<T>): T {
  if (!entity.result) {
    throw new Error(entity.errormessage ?? "Sunucu hatası.");
  }
  return entity.data;
}

// ─── Legal API (token gerektirmez) ───────────────────────────────────────────

export const legalApi = {
  /** GET /api/legal — yürürlükteki tüm yasal metinler (KVKK + Aydınlatma) */
  getAll: (): Promise<DtoLegalDocument[]> =>
    apiClient
      .get<RootEntity<DtoLegalDocument[]>>("/api/legal")
      .then((res) => unwrap(res.data)),

  /** GET /api/legal/{type} — tek bir metin */
  getByType: (type: LegalDocumentType): Promise<DtoLegalDocument> =>
    apiClient
      .get<RootEntity<DtoLegalDocument>>(`/api/legal/${type}`)
      .then((res) => unwrap(res.data)),
};
