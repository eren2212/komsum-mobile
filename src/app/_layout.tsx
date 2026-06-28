import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "../../global.css";

import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { setupInterceptors } from "@/api/interceptors";
import SplashScreen from "@/components/SplashScreen";
import {
  setupNotifications,
  setupNotificationListeners,
} from "@/lib/notifications";
import { realtimeChat } from "@/lib/realtimeChat";

const queryClient = new QueryClient();

// Interceptor'lar uygulama başladığında bir kez kurulur
setupInterceptors();

// Foreground bildirim suppression: uygulama açıkken görsel uyarı çıkmasın
setupNotifications();

export default function RootLayout() {
  const { tokens, isHydrating, hydrateTokens } = useAuthStore();
  const {
    hasSeenOnboarding,
    isChecked: isOnboardingChecked,
    check,
  } = useOnboardingStore();
  const router = useRouter();
  const segments = useSegments();

  // Uygulama açılışında hem Token'ları hem de Onboarding durumunu yükle
  useEffect(() => {
    hydrateTokens();
    check();
  }, []);

  // Bildirim tap'lerini yakala — kullanıcıyı ilgili ekrana götür
  useEffect(() => {
    const cleanup = setupNotificationListeners(router);
    return cleanup;
  }, [router]);

  // Canlı mesaj akışı (SSE): giriş yapınca bağlan, çıkışta kopar.
  // access_token değişimi (refresh dahil) bu effect'i tetikler → taze token ile
  // yeniden bağlanır.
  const accessToken = tokens?.access_token ?? null;
  useEffect(() => {
    if (accessToken) {
      realtimeChat.connect(accessToken);
    } else {
      realtimeChat.disconnect();
    }
  }, [accessToken]);

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
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </KeyboardProvider>
  );
}
