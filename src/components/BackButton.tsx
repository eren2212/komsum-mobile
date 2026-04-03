import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/color";

export interface BackButtonProps {
  /** Varsayılan davranış: router.back() */
  onPress?: () => void;
  /** Koyu arka plan üzerinde mi (beyaz bg)? Varsayılan: true */
  light?: boolean;
}

/**
 * Projenin genelinde kullanılan geri dönme butonu.
 *
 * @example
 * // Varsayılan (router.back)
 * <BackButton />
 *
 * @example
 * // Özel davranış
 * <BackButton onPress={() => router.replace("/auth/signin")} />
 *
 * @example
 * // Açık arka plan üzerinde (koyu ikon)
 * <BackButton light={false} />
 */
export default function BackButton({ onPress, light = true }: BackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.8}
      className={[
        "w-[45px] h-[45px] rounded-full items-center justify-center flex-row",
        light ? "bg-white" : "bg-neutral-100",
      ].join(" ")}
    >

      <Ionicons name="chevron-back" size={22} color={colors.primary} />
    </TouchableOpacity>
  );
}
