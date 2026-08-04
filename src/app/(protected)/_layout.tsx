import { useAuthStore } from "@/store/authStore";
import { Stack } from "expo-router";

/**
 * Korumalı rotaların Stack tanımı.
 *
 * Yönlendirme kararı BURADA verilmez — tek yetkili gate kök `app/_layout.tsx`.
 * Sebebi: onboarding durumunu ve SecureStore hydration'ını yalnızca orası
 * biliyor ve ancak ikisi de tamamlandıktan sonra doğru hedefe (onboarding /
 * signin / tabs) karar verebiliyor. Burada ayrıca bir <Redirect> bulunduğunda
 * iki gate farklı zamanlarda store'u okuyup birbiriyle yarışıyor, çift
 * yönlendirmeye ve yanlış ekranın bir an görünmesine yol açabiliyordu.
 *
 * Yine de token yokken güvenlik ağı olarak hiçbir şey render edilmez: kök
 * guard yönlendirmesini yapana kadar korumalı ekranlar (ve onların veri çeken
 * sorguları) hiç mount olmasın.
 */
export default function ProtectedLayout() {

    const { tokens } = useAuthStore();

    if (!tokens) {
        return null;
    }
    return (
        <Stack screenOptions={{ animation: 'slide_from_right', headerShown: false }}>
            <Stack.Screen name="(tabs)"      options={{ animation: 'fade' }} />
            <Stack.Screen name="profile"     options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="post"        options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="event"       options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="marketplace" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="chat"        options={{ animation: 'slide_from_right' }} />
        </Stack>
    );
}
