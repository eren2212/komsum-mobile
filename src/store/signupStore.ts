import { create } from "zustand";
import { DtoCity, DtoDistrict, DtoNeighborhood, neighborhoodApi } from "@/api/neighborhood";
import { extractErrorMessage } from "@/utils/apiError";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface PendingForm {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  acceptedLegalDocumentIds: number[]; // onaylanan KVKK + Aydınlatma metni ID'leri
}

/** Modal içinde hangi adımdayız */
export type PickerStep = "city" | "district" | "neighborhood" | null;

interface SignupState {
  // ── Adım 1: Form verisi ──────────────────────────────────────────────────────
  pending: PendingForm | null;
  setPending: (form: PendingForm) => void;

  // ── Adım 2: Konum seçimi ─────────────────────────────────────────────────────
  cities: DtoCity[];
  districts: DtoDistrict[];
  neighborhoods: DtoNeighborhood[];

  selectedCity: DtoCity | null;
  selectedDistrict: DtoDistrict | null;
  selectedNeighborhood: DtoNeighborhood | null;

  pickerStep: PickerStep;

  citiesLoading: boolean;
  districtsLoading: boolean;
  neighborhoodsLoading: boolean;

  citiesError: string | null;
  districtsError: string | null;
  neighborhoodsError: string | null;

  fetchCities: () => Promise<void>;
  fetchDistricts: (cityId: number) => Promise<void>;
  fetchNeighborhoods: (districtId: number) => Promise<void>;

  setPickerStep: (step: PickerStep) => void;
  selectCity: (city: DtoCity) => void;
  selectDistrict: (district: DtoDistrict) => void;
  selectNeighborhood: (neighborhood: DtoNeighborhood) => void;

  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSignupStore = create<SignupState>((set, get) => ({
  // Adım 1
  pending: null,
  setPending: (form) => set({ pending: form }),

  // Adım 2 — başlangıç state
  cities: [],
  districts: [],
  neighborhoods: [],
  selectedCity: null,
  selectedDistrict: null,
  selectedNeighborhood: null,
  pickerStep: null,
  citiesLoading: false,
  districtsLoading: false,
  neighborhoodsLoading: false,
  citiesError: null,
  districtsError: null,
  neighborhoodsError: null,

  // ── Veri çekme ────────────────────────────────────────────────────────────────

  fetchCities: async () => {
    if (get().cities.length > 0) return; // zaten yüklendi
    set({ citiesLoading: true, citiesError: null });
    try {
      const cities = await neighborhoodApi.getCities();
      set({ cities, citiesLoading: false });
    } catch (err: unknown) {
      set({ citiesError: extractErrorMessage(err), citiesLoading: false });
    }
  },

  fetchDistricts: async (cityId) => {
    set({ districtsLoading: true, districtsError: null, districts: [] });
    try {
      const districts = await neighborhoodApi.getDistricts(cityId);
      set({ districts, districtsLoading: false });
    } catch (err: unknown) {
      set({ districtsError: extractErrorMessage(err), districtsLoading: false });
    }
  },

  fetchNeighborhoods: async (districtId) => {
    set({ neighborhoodsLoading: true, neighborhoodsError: null, neighborhoods: [] });
    try {
      const neighborhoods = await neighborhoodApi.getNeighborhoods(districtId);
      set({ neighborhoods, neighborhoodsLoading: false });
    } catch (err: unknown) {
      set({ neighborhoodsError: extractErrorMessage(err), neighborhoodsLoading: false });
    }
  },

  // ── Seçim işlemleri ──────────────────────────────────────────────────────────

  setPickerStep: (step) => set({ pickerStep: step }),

  selectCity: (city) => {
    set({
      selectedCity: city,
      selectedDistrict: null,
      selectedNeighborhood: null,
      districts: [],
      neighborhoods: [],
    });
    get().fetchDistricts(city.id);
    set({ pickerStep: "district" });
  },

  selectDistrict: (district) => {
    set({
      selectedDistrict: district,
      selectedNeighborhood: null,
      neighborhoods: [],
    });
    get().fetchNeighborhoods(district.id);
    set({ pickerStep: "neighborhood" });
  },

  selectNeighborhood: (neighborhood) => {
    set({ selectedNeighborhood: neighborhood, pickerStep: null });
  },

  // ── Temizle ──────────────────────────────────────────────────────────────────

  clearAll: () =>
    set({
      pending: null,
      cities: [],
      districts: [],
      neighborhoods: [],
      selectedCity: null,
      selectedDistrict: null,
      selectedNeighborhood: null,
      pickerStep: null,
      citiesLoading: false,
      districtsLoading: false,
      neighborhoodsLoading: false,
      citiesError: null,
      districtsError: null,
      neighborhoodsError: null,
    }),
}));
