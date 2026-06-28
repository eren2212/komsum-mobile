import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import {
  BackButton,
  CustomButton,
  CustomInput,
  LegalDocumentModal,
} from "@/components";
import { useSignupStore } from "@/store/signupStore";
import { DtoLegalDocument, legalApi } from "@/api/legal";
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

// ─── Onay kutucuğu satırı ──────────────────────────────────────────────────────

interface ConsentRowProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
  onOpen: () => void;
}

function ConsentRow({ checked, label, onToggle, onOpen }: ConsentRowProps) {
  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={8}
        className="w-6 h-6 rounded-md border-2 items-center justify-center mr-3"
        style={{
          borderColor: checked ? "#FF6B4A" : "#D0D0D0",
          backgroundColor: checked ? "#FF6B4A" : "transparent",
        }}
      >
        {checked && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpen} activeOpacity={0.7} className="flex-1">
        <Text className="text-sm text-neutral-600">
          <Text className="text-primary font-bold underline">{label}</Text>
          <Text>'ni okudum ve onaylıyorum.</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

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

  // ── Yasal metinler ──
  const {
    data: legalDocs = [],
    isLoading: legalLoading,
    isError: legalError,
    refetch: refetchLegal,
  } = useQuery({
    queryKey: ["legal-documents"],
    queryFn: legalApi.getAll,
    staleTime: 1000 * 60 * 60, // metinler sık değişmez
    retry: 1,
  });

  // Onaylanan metin ID'leri ve hangi metin popup'ı açık
  const [acceptedIds, setAcceptedIds] = useState<number[]>([]);
  const [openDoc, setOpenDoc] = useState<DtoLegalDocument | null>(null);

  const isAccepted = (id: number) => acceptedIds.includes(id);

  const toggleAccept = (doc: DtoLegalDocument) => {
    if (isAccepted(doc.id)) {
      // İşaretliyse kaldır
      setAcceptedIds((prev) => prev.filter((id) => id !== doc.id));
    } else {
      // Henüz onaylanmadıysa önce metni okutmak için popup aç
      setOpenDoc(doc);
    }
  };

  const approveDoc = (doc: DtoLegalDocument) => {
    setAcceptedIds((prev) => (prev.includes(doc.id) ? prev : [...prev, doc.id]));
    setOpenDoc(null);
  };

  // İki metin de onaylanmış mı?
  const allAccepted =
    legalDocs.length > 0 && legalDocs.every((d) => acceptedIds.includes(d.id));

  const handleContinue = () => {
    if (!validate()) return;
    if (!allAccepted) return;

    const parts = name.trim().split(" ").filter(Boolean);
    const firstname = parts[0];
    const lastname = parts.slice(1).join(" ");

    // Form verisini Zustand'da sakla, kayıt 2. adımda tamamlanacak
    setPending({
      firstname,
      lastname,
      email,
      password,
      acceptedLegalDocumentIds: acceptedIds,
    });

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

        {/* ── Yasal metin onayları ── */}
        <View className="mt-6 gap-3">
          {legalLoading ? (
            <ActivityIndicator size="small" color="#FF6B4A" />
          ) : legalError ? (
            <View className="items-center gap-2">
              <Text className="text-error text-sm text-center">
                Yasal metinler yüklenemedi. İnternetini kontrol edip tekrar dene.
              </Text>
              <TouchableOpacity onPress={() => refetchLegal()} activeOpacity={0.7}>
                <Text className="text-primary font-bold">Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            legalDocs.map((doc) => (
              <ConsentRow
                key={doc.id}
                checked={isAccepted(doc.id)}
                label={doc.title}
                onToggle={() => toggleAccept(doc)}
                onOpen={() => setOpenDoc(doc)}
              />
            ))
          )}
        </View>

        <View className="mt-8">
          <CustomButton
            label="DEVAM ET"
            fullWidth
            disabled={!allAccepted}
            onPress={handleContinue}
          />
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

      {/* ── Yasal metin popup'ı ── */}
      <LegalDocumentModal
        visible={openDoc !== null}
        title={openDoc?.title ?? ""}
        content={openDoc?.content ?? ""}
        onApprove={() => openDoc && approveDoc(openDoc)}
        onClose={() => setOpenDoc(null)}
      />
    </SafeAreaView>
  );
}
