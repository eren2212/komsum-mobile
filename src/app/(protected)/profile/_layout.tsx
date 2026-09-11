import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack>
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
            <Stack.Screen name="profile-password" options={{ headerShown: false }} />
            <Stack.Screen name="my-posts" options={{ headerShown: false }} />
            <Stack.Screen name="my-listings" options={{ headerShown: false }} />
            <Stack.Screen name="my-events" options={{ headerShown: false }} />
            <Stack.Screen name="my-tasks" options={{ headerShown: false }} />
        </Stack>
    );
}