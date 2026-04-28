import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'has_seen_onboarding';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isChecked: boolean;
  check: () => Promise<void>;
  markAsSeen: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  isChecked: false,

  check: async () => {
    try {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      set({ hasSeenOnboarding: value === 'true', isChecked: true });
    } catch {
      set({ isChecked: true });
    }
  },

  markAsSeen: async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },
}));
