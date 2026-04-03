import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../global.css";

import { useAuthStore } from "@/store/authStore";
import { setupInterceptors } from "@/api/interceptors";

const queryClient = new QueryClient();

// Interceptor'lar uygulama başladığında bir kez kurulur
setupInterceptors();

export default function RootLayout() {
  const { tokens, isHydrating, hydrateTokens } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Uygulama açılışında SecureStore'dan token yükle
  useEffect(() => {
    hydrateTokens();
  }, []);

  // Hydration bitmeden navigation guard çalışmasın (signin flash'ı önler)
  useEffect(() => {
    if (isHydrating) return;

    const inAuthGroup = segments[0] === "auth";

    if (!tokens && !inAuthGroup) {
      router.replace("/auth/signin");
    }
  }, [tokens, segments, isHydrating]);

  // Token yüklenirken marka renginde loading ekranı göster
  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121223",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B4A" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
