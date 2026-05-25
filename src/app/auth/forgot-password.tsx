import React, { useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { create } from "zustand";

import { BackButton, CustomButton, CustomInput } from "@/components";
import { useAuthStore } from "@/store/authStore";
import BgAsset from "../../../assets/images/signup-bg-asset.svg";
import Feather from '@expo/vector-icons/Feather';

// ─── Local form state (Zustand) ───────────────────────────────────────────────

interface ForgotFormState {
  email: string;
  emailError: string;
  setEmail: (v: string) => void;
  validate: () => boolean;
  reset: () => void;
}

const useForgotForm = create<ForgotFormState>((set, get) => ({
  email: "",
  emailError: "",

  setEmail: (v) => set({ email: v, emailError: "" }),

  validate: () => {
    const { email } = get();
    if (!email) {
      set({ emailError: "E-posta zorunlu." });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      set({ emailError: "Geçerli bir e-posta girin." });
      return false;
    }
    return true;
  },

  reset: () => set({ email: "", emailError: "" }),
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const { email, emailError, setEmail, validate, reset } = useForgotForm();
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert("Hata", error, [{ text: "Tamam", onPress: clearError }]);
    }
  }, [error]);

  const handleSend = async () => {
    if (!validate()) return;

    const message = await forgotPassword({ email });

    if (message) {
      // Backend'in başarı mesajını göster, reset sayfasına geç
      Alert.alert("E-posta Gönderildi", message, [
        {
          text: "Devam Et",
          onPress: () => {
            reset();
            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary-900" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Dark header ── */}
        <View className="px-6 pt-3 pb-10 overflow-hidden">
          <BgAsset
            width="140%"
            height="100%"
            style={{ position: "absolute", top: -10, left: -70 }}
            preserveAspectRatio="xMidYMid slice"
          />

          <BackButton />

          <Text className="text-white text-[30px] font-bold text-center mt-5">
            Şifremi Unuttum
          </Text>

          <Text className="text-white text-base text-center mt-2 opacity-85">
            E-postanı gir, sana doğrulama kodu gönderelim.
          </Text>
        </View>

        {/* ── Beyaz kart ── */}
        <ScrollView
          className="flex-1 bg-white rounded-tl-xl3 rounded-tr-xl3"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <CustomInput
            label="EMAIL"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />

          {/* Bilgi notu */}
          <View className="mt-4 bg-primary/10 rounded-2xl px-4 py-3 flex-row items-center gap-2">
            <Feather name="mail" size={24} color="gray" />
            <Text className="text-primary text-sm leading-5">
              Kayıtlı e-posta adresine 6 haneli bir doğrulama kodu
              göndereceğiz. Kodun geçerlilik süresi 3 dakikadır.
            </Text>
          </View>

          <View className="mt-8">
            <CustomButton
              label="KOD GÖNDER"
              fullWidth
              loading={isLoading}
              onPress={handleSend}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
