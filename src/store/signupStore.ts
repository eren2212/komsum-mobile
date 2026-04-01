import { create } from "zustand";
import { DtoNeighborhood, neighborhoodApi } from "@/api/neighborhood";
import { extractErrorMessage } from "@/utils/apiError";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface PendingForm {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

/** Modal içinde hangi adımdayız */
export type PickerStep = "district" | "neighborhood" | null;

interface SignupState {
  // ── Adım 1: Form verisi ─────────────────────────────────────────────────────
  pending: PendingForm | null;
  setPending: (form: PendingForm) => void;

  // ── Adım 2: Mahalle seçimi (Zustand local state) ────────────────────────────
  districts: string[];
  neighborhoods: DtoNeighborhood[];
  selectedDistrict: string | null;
  selectedNeighborhood: DtoNeighborhood | null;
  pickerStep: PickerStep;
  districtsLoading: boolean;
  neighborhoodsLoading: boolean;
  neighborhoodsError: string | null;
  districtsError: string | null;

  fetchDistricts: (city?: string) => Promise<void>;
  fetchNeighborhoods: (district: string) => Promise<void>;
  setPickerStep: (step: PickerStep) => void;
  selectDistrict: (district: string) => void;
  selectNeighborhood: (neighborhood: DtoNeighborhood) => void;

  /** Tüm kayıt akışını sıfırla (başarılı kayıt veya çıkış sonrası) */
  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSignupStore = create<SignupState>((set, get) => ({
  // Adım 1
  pending: null,
  setPending: (form) => set({ pending: form }),

  // Adım 2
  districts: [],
  neighborhoods: [],
  selectedDistrict: null,
  selectedNeighborhood: null,
  pickerStep: null,
  districtsLoading: false,
  neighborhoodsLoading: false,
  neighborhoodsError: null,
  districtsError: null,

  fetchDistricts: async (city = "Konya") => {
    set({ districtsLoading: true, districtsError: null });
    try {
      const districts = await neighborhoodApi.getDistricts(city);
      set({ districts, districtsLoading: false });
    } catch (err: unknown) {
      set({ districtsError: extractErrorMessage(err), districtsLoading: false });
    }
  },

  fetchNeighborhoods: async (district) => {
    set({ neighborhoodsLoading: true, neighborhoodsError: null, neighborhoods: [] });
    try {
      const neighborhoods = await neighborhoodApi.getNeighborhoods(district);
      set({ neighborhoods, neighborhoodsLoading: false });
    } catch (err: unknown) {
      set({ neighborhoodsError: extractErrorMessage(err), neighborhoodsLoading: false });
    }
  },

  setPickerStep: (step) => set({ pickerStep: step }),

  selectDistrict: (district) => {
    set({ selectedDistrict: district, selectedNeighborhood: null });
    // İlçe seçilince mahalleleri çek ve adımı mahalle seçimine geç
    get().fetchNeighborhoods(district);
    set({ pickerStep: "neighborhood" });
  },

  selectNeighborhood: (neighborhood) => {
    set({ selectedNeighborhood: neighborhood, pickerStep: null });
  },

  clearAll: () =>
    set({
      pending: null,
      districts: [],
      neighborhoods: [],
      selectedDistrict: null,
      selectedNeighborhood: null,
      pickerStep: null,
      districtsLoading: false,
      neighborhoodsLoading: false,
      neighborhoodsError: null,
      districtsError: null,
    }),
}));
