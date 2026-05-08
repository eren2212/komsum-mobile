import { useAuthStore } from "@/store/authStore";
import { Redirect, Stack } from "expo-router";

export default function ProtectedLayout() {

    const { tokens } = useAuthStore();

    if (!tokens) {
        return <Redirect href="/auth/signin" />;
    }
    return (
        <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }}>
            <Stack.Screen name="(tabs)"      options={{ animation: 'fade' }} />
            <Stack.Screen name="profile"     options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="post"        options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="marketplace" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="chat"        options={{ animation: 'slide_from_right' }} />
        </Stack>
    );
}   