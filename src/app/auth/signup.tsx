import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { create } from "zustand";

import { BackButton, CustomButton, CustomInput } from "@/components";
import { useSignupStore } from "@/store/signupStore";
import BgAsset from "../../../assets/images/signup-bg-asset.svg";

// ─── Local form state (Zustand) ───────────────────────────────────────────────

interface SignupFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nameError: string;
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;
  setField: (
    field: "name" | "email" | "password" | "confirmPassword",
    value: string,
  ) => void;
  validate: () => boolean;
  reset: () => void;
}

const useSignupForm = create<SignupFormState>((set, get) => ({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  nameError: "",
  emailError: "",
  passwordError: "",
  confirmPasswordError: "",

  setField: (field, value) =>
    set((s) => ({ ...s, [field]: value, [`${field}Error`]: "" })),

  validate: () => {
    const { name, email, password, confirmPassword } = get();
    const updates: Partial<SignupFormState> = {};
    let valid = true;

    const trimmed = name.trim();
    const parts = trimmed.split(" ").filter(Boolean);
    if (!trimmed) {
      updates.nameError = "İsim zorunlu.";
      valid = false;
    } else if (parts.length < 2) {
      updates.nameError = 'Ad ve soyad girin (örn: "Ali Yılmaz").';
      valid = false;
    } else if (parts[0].length > 15 || parts.slice(1).join(" ").length > 15) {
      updates.nameError = "Ad veya soyad 15 karakterden uzun olamaz.";
      valid = false;
    }

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

    if (!confirmPassword) {
      updates.confirmPasswordError = "Şifre tekrarı zorunlu.";
      valid = false;
    } else if (password !== confirmPassword) {
      updates.confirmPasswordError = "Şifreler eşleşmiyor.";
      valid = false;
    }

    if (!valid) set((s) => ({ ...s, ...updates }));
    return valid;
  },

  reset: () =>
    set({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      nameError: "",
      emailError: "",
      passwordError: "",
      confirmPasswordError: "",
    }),
}));

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const {
    name,
    email,
    password,
    confirmPassword,
    nameError,
    emailError,
    passwordError,
    confirmPasswordError,
    setField,
    validate,
  } = useSignupForm();

  const { setPending } = useSignupStore();

  const handleContinue = () => {
    if (!validate()) return;

    const parts = name.trim().split(" ").filter(Boolean);
    const firstname = parts[0];
    const lastname = parts.slice(1).join(" ");

    // Form verisini Zustand'da sakla, kayıt 2. adımda tamamlanacak
    setPending({ firstname, lastname, email, password });

    router.push("/auth/neighborhood-select");
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary-900" edges={["top"]}>
      {/* ── Dark header bölümü ── */}
      <View className="px-6 pt-3 pb-10 ">
        {/* Dekoratif arka plan (fan + turuncu çizgi) */}
        <BgAsset
          width="140%"
          height="100%"
          style={{
            position: "absolute",
            top: -10,
            left: -70,
            opacity: 1,
          }}
          preserveAspectRatio="xMidYMid slice"
        />

        <BackButton />

        <Text className="text-white text-[30px] font-bold text-center mt-5">
          Kayıt Ol
        </Text>

        <Text className="text-white text-base text-center mt-2 opacity-85">
          Başlamak için lütfen kaydolun.
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
            label="İSİM"
            placeholder="John Doe"
            value={name}
            onChangeText={(v) => setField("name", v)}
            error={nameError}
            autoCapitalize="words"
            returnKeyType="next"
          />

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
            returnKeyType="next"
          />

          <CustomInput
            label="ŞİFRE TEKRAR"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            error={confirmPasswordError}
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        <View className="mt-8">
          <CustomButton label="DEVAM ET" fullWidth onPress={handleContinue} />
        </View>

        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-neutral-400 text-sm">
            Zaten hesabın var mı?
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/signin")}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-sm font-bold"> Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
