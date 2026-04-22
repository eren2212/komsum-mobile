import { Stack } from "expo-router";

export default function ProfileLayout() {
    return (
        <Stack>
            <Stack.Screen name="[id]" options={{ headerShown: false }} />
        </Stack>
    );
}