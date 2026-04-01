import { useAuthStore } from "@/store/authStore";
import { Redirect, Stack } from "expo-router";

export default function ProtectedLayout() {

    const { tokens } = useAuthStore();

    if (!tokens) {
        return <Redirect href="/auth/signin" />;
    }
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}   