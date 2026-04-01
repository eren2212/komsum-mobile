import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function AuthLayout() {
    const { tokens } = useAuthStore();

    // Kullanıcı zaten giriş yapmışsa auth ekranlarına erişemez
    if (tokens) {
        return <Redirect href="/(protected)" />;
    }

    return (
        <Stack>
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="neighborhood-select" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        </Stack>
    );
}