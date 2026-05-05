import React from "react";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/color";

export interface BackButtonProps {
  /** Varsayılan davranış: router.back() */
  onPress?: () => void;
  /**
   * Görsel varyant:
   * - "light"   → beyaz arka plan, primary renk ikon (varsayılan)
   * - "overlay" → yarı-saydam siyah arka plan, beyaz ikon (görsel üzerinde yüzer buton)
   * - "ghost"   → yarı-saydam beyaz arka plan, beyaz ikon (koyu header üzerinde)
   */
  variant?: "light" | "overlay" | "ghost";
  /** Ekstra container stilleri (örn. absolute konumlandırma) */
  style?: StyleProp<ViewStyle>;
}

export default function BackButton({ onPress, variant = "light", style }: BackButtonProps) {
  const backgroundColor =
    variant === "overlay"
      ? "rgba(0,0,0,0.38)"
      : variant === "ghost"
      ? "rgba(255,255,255,0.12)"
      : "#ffffff";

  const iconColor = variant === "light" ? colors.primary.DEFAULT : "#ffffff";

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.8}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
        },
        style,
      ]}
    >
      <Ionicons name="chevron-back" size={22} color={iconColor} />
    </TouchableOpacity>
  );
}
