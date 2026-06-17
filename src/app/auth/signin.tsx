import React, { useEffect } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { create } from "zustand";

import { BackButton, CustomButton, CustomInput } from "@/components";
import { useAuthStore } from "@/store/authStore";
import BgAsset from "../../../assets/images/signup-bg-asset.svg";

// ─── Local form state (Zustand) ───────────────────────────────────────────────

interface SigninFormState {
  email: string;
  password: string;
  emailError: string;
  passwordError: string;
  setField: (field: "email" | "password", value: string) => void;
  validate: () => boolean;
  reset: () => void;
}

const useSigninForm = create<SigninFormState>((set, get) => ({
  email: "",
  password: "",
  emailError: "",
  passwordError: "",

  setField: (field, value) =>
    set((s) => ({ ...s, [field]: value, [`${field}Error`]: "" })),

  validate: () => {
    const { email, password } = get();
    const updates: Partial<SigninFormState> = {};
    let valid = true;

    if (!email) {
      updates.emailError = "E-posta zorunlu.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      updates.emailError = "Geçerli bir e-posta girin.";
      valid = false;
    }

    if (!password) {
      updates.passwordError = "Şifre zorunlu.";
      valid = false;
    } else if (password.length < 8 || password.length > 15) {
      updates.passwordError = "Şifre 8–15 karakter arasında olmalı.";
      valid = false;
    }

    if (!valid) set((s) => ({ ...s, ...updates }));
    return valid;
  },

  reset: () =>
    set({ email: "", password: "", emailError: "", passwordError: "" }),
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const {
    email,
    password,
    emailError,
    passwordError,
    setField,
    validate,
    reset,
  } = useSigninForm();

  const { login, isLoading, error, clearError } = useAuthStore();

  // Sunucu hatalarını Alert ile göster
  useEffect(() => {
    if (error) {
      Alert.alert("Giriş Hatası", error, [
        { text: "Tamam", onPress: clearError },
      ]);
    }
  }, [error]);

  const handleLogin = async () => {
    if (!validate()) return;

    const success = await login({ email, password });

    if (success) {
      reset();
      router.replace("/");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary-900" edges={["top"]}>
      {/* ── Dark header bölümü ── */}
      <View className="px-6 pt-3 pb-10 overflow-hidden">
        {/* Dekoratif arka plan (fan + turuncu çizgi) */}
        <BgAsset
          width="140%"
          height="100%"
          style={{
            position: "absolute",
            top: -10,
            left: -70,
          }}
          preserveAspectRatio="xMidYMid slice"
        />

        <Text className="text-white text-[30px] font-bold text-center mt-20">
          Giriş Yap
        </Text>

        <Text className="text-white text-base text-center mt-2 opacity-85">
          Lütfen mevcut hesabınıza giriş yapın.
        </Text>
      </View>

      {/* ── Beyaz kart – form alanı ── */}
      <KeyboardAwareScrollView
        className="flex-1 bg-white rounded-tl-xl3 rounded-tr-xl3"
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <View className="gap-4">
          <CustomInput
            label="EMAIL"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={(v) => setField("email", v)}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <CustomInput
            label="ŞİFRE"
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => setField("password", v)}
            error={passwordError}
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* Şifremi Unuttum */}
        <TouchableOpacity
          className="self-end mt-3"
          activeOpacity={0.7}
          onPress={() => router.push("/auth/forgot-password")}
        >
          <Text className="text-primary text-sm font-bold">
            Şifremi Unuttum
          </Text>
        </TouchableOpacity>

        {/* Giriş Yap butonu */}
        <View className="mt-6">
          <CustomButton
            label="GİRİŞ YAP"
            fullWidth
            loading={isLoading}
            onPress={handleLogin}
          />
        </View>

        {/* Kayıt ol linki */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-neutral-400 text-sm">Hesabın yok mu?</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/signup")}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-sm font-bold"> Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
