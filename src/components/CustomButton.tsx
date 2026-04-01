import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

// ─── Tip tanımları ──────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface CustomButtonProps extends Omit<TouchableOpacityProps, "style"> {
  /** Buton etiketi */
  label: string;
  /** Görsel varyant – varsayılan: "primary" */
  variant?: ButtonVariant;
  /** Boyut – varsayılan: "md" */
  size?: ButtonSize;
  /** Yüklenme durumunda spinner göster */
  loading?: boolean;
  /** Sol ikon (React element) */
  leftIcon?: React.ReactNode;
  /** Sağ ikon (React element) */
  rightIcon?: React.ReactNode;
  /** Butonu tam genişliğe yay */
  fullWidth?: boolean;
}

// ─── Stil haritaları ─────────────────────────────────────────────────────────

const containerBase =
  "flex-row items-center justify-center rounded-2xl overflow-hidden";

const variantContainer: Record<ButtonVariant, string> = {
  primary:   "bg-primary",
  secondary: "bg-secondary",
  outline:   "bg-transparent border-2 border-primary",
  ghost:     "bg-transparent",
  danger:    "bg-error",
};

const variantContainerDisabled: Record<ButtonVariant, string> = {
  primary:   "bg-primary/40",
  secondary: "bg-secondary/40",
  outline:   "bg-transparent border-2 border-neutral-300",
  ghost:     "bg-transparent",
  danger:    "bg-error/40",
};

const variantText: Record<ButtonVariant, string> = {
  primary:   "text-white",
  secondary: "text-white",
  outline:   "text-primary",
  ghost:     "text-primary",
  danger:    "text-white",
};

const variantTextDisabled: Record<ButtonVariant, string> = {
  primary:   "text-white/60",
  secondary: "text-white/60",
  outline:   "text-neutral-300",
  ghost:     "text-neutral-300",
  danger:    "text-white/60",
};

const sizeContainer: Record<ButtonSize, string> = {
  sm: "h-10 px-4 gap-1",
  md: "h-[62px] px-6 gap-2",
  lg: "h-16 px-8 gap-2",
};

const sizeText: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// ─── Bileşen ─────────────────────────────────────────────────────────────────

/**
 * Global buton bileşeni.
 *
 * @example
 * // Birincil buton
 * <CustomButton label="Giriş Yap" onPress={handleLogin} />
 *
 * @example
 * // Yüklenme durumu
 * <CustomButton label="Kaydediliyor..." loading variant="secondary" />
 *
 * @example
 * // Outline, küçük
 * <CustomButton label="İptal" variant="outline" size="sm" />
 */
export default function CustomButton({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  ...rest
}: CustomButtonProps) {
  const isDisabled = disabled || loading;

  const containerClass = [
    containerBase,
    isDisabled
      ? variantContainerDisabled[variant]
      : variantContainer[variant],
    sizeContainer[size],
    fullWidth ? "w-full" : "self-start",
  ].join(" ");

  const textClass = [
    "font-bold tracking-widest uppercase",
    sizeText[size],
    isDisabled ? variantTextDisabled[variant] : variantText[variant],
  ].join(" ");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      {...rest}
      className={containerClass}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost" ? "#FF6B4A" : "#FFFFFF"
          }
        />
      ) : (
        <>
          {leftIcon && <View className="mr-1">{leftIcon}</View>}
          <Text className={textClass}>{label}</Text>
          {rightIcon && <View className="ml-1">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
