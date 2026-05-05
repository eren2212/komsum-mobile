import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { userApi, DtoUserPassword } from "@/api/user";
import { colors } from "@/theme/color";
import { BackButton, CustomButton, CustomInput } from "@/components";

// ─── Şifre gücü ──────────────────────────────────────────────────────────────

type Strength = { label: string; color: string; ratio: number };

function calcStrength(password: string): Strength {
  if (!password) return { label: "", color: "", ratio: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "ZAYIF", color: colors.error.DEFAULT, ratio: 0.25 };
  if (score === 2) return { label: "ORTA", color: colors.warning.DEFAULT, ratio: 0.5 };
  if (score === 3) return { label: "İYİ", color: colors.info.DEFAULT, ratio: 0.75 };
  return { label: "GÜÇLÜ", color: colors.success.DEFAULT, ratio: 1 };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfilePasswordScreen() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [clientError, setClientError] = useState("");

  const { mutate: changePassword, isPending, error } = useMutation({
    mutationFn: (payload: DtoUserPassword) => userApi.updatePassword(payload),
    onSuccess: () => router.back(),
  });

  const onSubmit = () => {
    setClientError("");

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setClientError("Lütfen tüm alanları doldurun.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setClientError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setClientError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    changePassword({ oldPassword, newPassword, confirmNewPassword });
  };

  const strength = calcStrength(newPassword);
  const serverError = error ? (error as Error).message : "";
  const displayError = clientError || serverError;

  const isChanged =
    newPassword.trim() !== "" &&
    confirmNewPassword.trim() !== "" &&
    newPassword !== oldPassword;

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Koyu header ── */}
        <View className="px-6 pt-4 pb-10">
          {/* Nav row */}
          <View className="flex-row items-center justify-between mb-8">
            <BackButton variant="ghost" />

            <Text className="text-white text-[17px] font-bold">Şifre Değiştir</Text>

            <View className="w-[45px]" />
          </View>

          {/* Ikon */}
          <View className="items-center mb-5">
            {/* Dış parlak halka */}
            <View className="w-[80px] h-[80px] rounded-[40px] bg-[rgba(255,107,74,0.2)] items-center justify-center">
              <View
                className="w-[64px] h-[64px] rounded-[32px] items-center justify-center"
                style={{ backgroundColor: colors.primary.DEFAULT }}
              >
                <Ionicons name="lock-open" size={28} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Açıklama */}
          <Text className="text-white/80 text-center text-sm leading-5 px-6">
            Hesabınızı güvende tutmak için güçlü bir şifre belirleyin.
          </Text>
        </View>

        {/* ── Beyaz kart ── */}
        <View className="flex-1 bg-white rounded-t-[32px]">
          <ScrollView
            contentContainerClassName="px-5 pt-[28px] pb-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mevcut şifre */}
            <View className="mb-4">
              <CustomInput
                label="Mevcut Şifre"
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                isPassword
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={18} color="#A0A5BA" />
                }
              />
            </View>

            {/* Yeni şifre + güç göstergesi */}
            <View className="mb-4">
              <CustomInput
                label="Yeni Şifre"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                isPassword
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={18} color="#A0A5BA" />
                }
              />

              {/* Şifre gücü */}
              {newPassword.length > 0 && (
                <View className="mt-2 ml-1">
                  <Text
                    className="text-[11px] font-bold tracking-widest mb-1.5"
                    style={{ color: strength.color }}
                  >
                    ŞİFRE GÜCÜ: {strength.label}
                  </Text>
                  <View className="h-[4px] bg-neutral-100 rounded-full overflow-hidden">
                    <View
                      className="h-[4px] rounded-[2px]"
                      style={{
                        width: `${strength.ratio * 100}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Yeni şifre tekrar */}
            <View className="mb-2">
              <CustomInput
                label="Yeni Şifre Tekrar"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                placeholder="••••••••"
                isPassword
                leftIcon={
                  <Ionicons name="shield-checkmark-outline" size={18} color="#A0A5BA" />
                }
              />
            </View>

            {/* Hata */}
            {displayError ? (
              <Text className="text-red-500 text-xs mt-1 ml-1">{displayError}</Text>
            ) : null}
          </ScrollView>

          {/* ── Buton alanı ── */}
          <View className="px-5 pb-8 pt-2">
            <CustomButton
              label="Şifreyi Güncelle"
              onPress={onSubmit}
              loading={isPending}
              activeOpacity={0.8}
              disabled={isPending || !isChanged}
              fullWidth
              leftIcon={
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              }
            />

            <Text className="text-neutral-400 text-xs text-center mt-3 leading-4">
              Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}