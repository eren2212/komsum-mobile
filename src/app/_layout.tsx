import { useEffect, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";

import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { setupInterceptors } from "@/api/interceptors";
import SplashScreen from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  setupNotifications,
  setupNotificationListeners,
  handleColdStartNotification,
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

  // Cold-start: uygulama kapalıyken bir bildirime basılarak açıldıysa, auth
  // hazır olduktan sonra bir kez ilgili ekrana yönlendir. Guard'ın ilk
  // redirect'i tamamlandıktan sonra push en üste oturur.
  const coldStartHandled = useRef(false);
  useEffect(() => {
    if (isHydrating || !isOnboardingChecked || !tokens || !hasSeenOnboarding) {
      return;
    }
    if (coldStartHandled.current) return;
    coldStartHandled.current = true;
    handleColdStartNotification(router);
  }, [isHydrating, isOnboardingChecked, tokens, hasSeenOnboarding, router]);

  // Token veya Onboarding yüklenirken splash ekranı göster
  if (isHydrating || !isOnboardingChecked) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <Slot />
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
