import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack>
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
            <Stack.Screen name="profile-password" options={{ headerShown: false }} />
        </Stack>
    );
}