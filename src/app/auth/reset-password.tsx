import React, { useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { create } from "zustand";

import { BackButton, CustomButton, CustomInput } from "@/components";
import { useAuthStore } from "@/store/authStore";
import BgAsset from "../../../assets/images/signup-bg-asset.svg";

// ─── Local form state (Zustand) ───────────────────────────────────────────────

interface ResetFormState {
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
  otpError: string;
  newPasswordError: string;
  confirmNewPasswordError: string;
  setField: (
    field: "otp" | "newPassword" | "confirmNewPassword",
    value: string
  ) => void;
  validate: () => boolean;
  reset: () => void;
}

const useResetForm = create<ResetFormState>((set, get) => ({
  otp: "",
  newPassword: "",
  confirmNewPassword: "",
  otpError: "",
  newPasswordError: "",
  confirmNewPasswordError: "",

  setField: (field, value) =>
    set((s) => ({ ...s, [field]: value, [`${field}Error`]: "" })),

  validate: () => {
    const { otp, newPassword, confirmNewPassword } = get();
    const updates: Partial<ResetFormState> = {};
    let valid = true;

    if (!otp.trim()) {
      updates.otpError = "Doğrulama kodu zorunlu.";
      valid = false;
    } else if (otp.trim().length !== 6) {
      updates.otpError = "Doğrulama kodu 6 haneli olmalı.";
      valid = false;
    }

    if (!newPassword) {
      updates.newPasswordError = "Yeni şifre zorunlu.";
      valid = false;
    } else if (newPassword.length < 6) {
      updates.newPasswordError = "Şifre en az 6 karakter olmalı.";
      valid = false;
    }

    if (!confirmNewPassword) {
      updates.confirmNewPasswordError = "Şifre tekrarı zorunlu.";
      valid = false;
    } else if (newPassword !== confirmNewPassword) {
      updates.confirmNewPasswordError = "Şifreler eşleşmiyor.";
      valid = false;
    }

    if (!valid) set((s) => ({ ...s, ...updates }));
    return valid;
  },

  reset: () =>
    set({
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
      otpError: "",
      newPasswordError: "",
      confirmNewPasswordError: "",
    }),
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen() {
  // Email, forgot-password sayfasından route param olarak gelir
  const { email } = useLocalSearchParams<{ email: string }>();

  const {
    otp,
    newPassword,
    confirmNewPassword,
    otpError,
    newPasswordError,
    confirmNewPasswordError,
    setField,
    validate,
    reset,
  } = useResetForm();

  const { resetPassword, forgotPassword, isLoading, error, clearError } =
    useAuthStore();

  useEffect(() => {
    if (error) {
      Alert.alert("Hata", error, [{ text: "Tamam", onPress: clearError }]);
    }
  }, [error]);

  const handleReset = async () => {
    if (!validate()) return;
    if (!email) return;

    const message = await resetPassword({
      email,
      otp: otp.trim(),
      newPassword,
      confirmNewPassword,
    });

    if (message) {
      reset();
      // Backend'in başarı mesajını göster, signin'e yönlendir
      Alert.alert("Başarılı!", message, [
        { text: "Giriş Yap", onPress: () => router.replace("/auth/signin") },
      ]);
    }
  };

  // Yeni kod iste
  const handleResend = async () => {
    if (!email) return;
    const message = await forgotPassword({ email });
    if (message) {
      Alert.alert("Kod Gönderildi", message);
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
            Şifre Sıfırla
          </Text>

          <Text className="text-white text-base text-center mt-2 opacity-85">
            {email
              ? `${email} adresine gönderilen kodu gir.`
              : "E-postana gelen kodu ve yeni şifreni gir."}
          </Text>
        </View>

        {/* ── Beyaz kart ── */}
        <ScrollView
          className="flex-1 bg-white rounded-tl-xl3 rounded-tr-xl3"
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-4">
            {/* Doğrulama kodu */}
            <CustomInput
              label="DOĞRULAMA KODU"
              placeholder="123456"
              value={otp}
              onChangeText={(v) => setField("otp", v)}
              error={otpError}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
            />

            {/* Yeni şifre */}
            <CustomInput
              label="YENİ ŞİFRE"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={(v) => setField("newPassword", v)}
              error={newPasswordError}
              isPassword
              returnKeyType="next"
            />

            {/* Yeni şifre tekrar */}
            <CustomInput
              label="YENİ ŞİFRE TEKRAR"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChangeText={(v) => setField("confirmNewPassword", v)}
              error={confirmNewPasswordError}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />
          </View>

          {/* Kodu tekrar gönder */}
          <View className="flex-row justify-end mt-3">
            <TouchableOpacity
              onPress={handleResend}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text className="text-primary text-sm font-bold">
                Kodu Tekrar Gönder
              </Text>
            </TouchableOpacity>
          </View>

          {/* Şifreyi Güncelle butonu */}
          <View className="mt-6">
            <CustomButton
              label="ŞİFREYİ GÜNCELLE"
              fullWidth
              loading={isLoading}
              onPress={handleReset}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
