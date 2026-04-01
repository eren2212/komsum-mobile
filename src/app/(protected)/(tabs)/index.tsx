import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
export default function HomeScreen() {
    const { logout } = useAuthStore();
    return (
        <SafeAreaView className="flex-1 items-center justify-center">
            <Text>HomeScreen</Text>
            <Button title="Çıkış Yap" onPress={() => logout()} />
        </SafeAreaView>
    );
}