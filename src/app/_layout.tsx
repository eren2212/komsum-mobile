import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../global.css";

import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { setupInterceptors } from "@/api/interceptors";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();

// Interceptor'lar uygulama başladığında bir kez kurulur
setupInterceptors();

export default function RootLayout() {
  const { tokens, isHydrating, hydrateTokens } = useAuthStore();
  const { hasSeenOnboarding, isChecked: isOnboardingChecked, check } = useOnboardingStore();
  const router = useRouter();
  const segments = useSegments();

  // Uygulama açılışında hem Token'ları hem de Onboarding durumunu yükle
  useEffect(() => {
    hydrateTokens();
    check();
  }, []);

  // Hydration veya Onboarding kontrolü bitmeden navigation guard çalışmasın
  useEffect(() => {
    if (isHydrating || !isOnboardingChecked) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    // 1. Kural: Kullanıcı onboarding'i görmediyse, zorla onboarding'e at.
    if (!hasSeenOnboarding) {
      if (!inOnboarding) {
        router.replace("/onboarding");
      }
      return; // Diğer kurallara bakma
    }

    // 2. Kural: Onboarding'i görmüş ama giriş yapmamışsa, signin'e at.
    if (!tokens) {
      if (!inAuthGroup) {
        router.replace("/auth/signin");
      }
    }
    // 3. Kural: Hem onboarding'i görmüş hem de giriş yapmışsa (ve yanlışlıkla auth/onboarding sayfalarındaysa) içeri al.
    else if (inAuthGroup || inOnboarding) {
      router.replace("/(tabs)");
    }

  }, [tokens, segments, isHydrating, isOnboardingChecked, hasSeenOnboarding]);

  // Token veya Onboarding yüklenirken splash ekranı göster
  if (isHydrating || !isOnboardingChecked) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}