import React, { forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';

// ─── Tip tanımları ──────────────────────────────────────────────────────────

export interface CustomInputProps extends TextInputProps {
  /** Alan etiketi – input'un üstünde görünür */
  label?: string;
  /** Hata mesajı – kırmızı renkte gösterilir */
  error?: string;
  /** Yardımcı metin – gri renkte gösterilir */
  hint?: string;
  /** Sol ikon */
  leftIcon?: React.ReactNode;
  /** Sağ ikon (secureTextEntry ile çakışmaz) */
  rightIcon?: React.ReactNode;
  /** Alan devre dışı mı */
  disabled?: boolean;
  /** Şifre alanı: göz ikonunu otomatik ekler */
  isPassword?: boolean;
}

// ─── Sabit sınıflar ──────────────────────────────────────────────────────────

const LABEL_BASE = "text-[13px] font-normal uppercase text-neutral-600 dark:text-neutral-200 mb-2 tracking-wide";
const WRAPPER_BASE =
  "flex-row items-center h-[62px] rounded-2xl px-4 gap-3 " +
  "bg-neutral-50 dark:bg-secondary-800 " +
  "border border-neutral-100 dark:border-secondary-600";
const WRAPPER_FOCUS = "border-primary dark:border-primary";
const WRAPPER_ERROR = "border-error dark:border-error";
const WRAPPER_DISABLED = "opacity-50";
const INPUT_BASE =
  "flex-1 text-sm text-neutral-600 dark:text-white h-full " +
  "font-normal";
const HINT_BASE = "text-xs text-neutral-400 dark:text-neutral-300 mt-1.5 ml-1";
const ERROR_BASE = "text-xs text-error mt-1.5 ml-1";

// ─── Bileşen ─────────────────────────────────────────────────────────────────

/**
 * Global input bileşeni.
 *
 * @example
 * // E-posta alanı
 * <CustomInput
 *   label="Email"
 *   placeholder="example@gmail.com"
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 * />
 *
 * @example
 * // Şifre alanı (göz ikonu otomatik eklenir)
 * <CustomInput
 *   label="Şifre"
 *   isPassword
 *   placeholder="••••••••••"
 * />
 *
 * @example
 * // Hata durumu
 * <CustomInput
 *   label="Email"
 *   value={email}
 *   error="Geçerli bir e-posta girin."
 * />
 */
const CustomInput = forwardRef<TextInput, CustomInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      disabled = false,
      isPassword = false,
      secureTextEntry,
      onFocus,
      onBlur,
      placeholderTextColor,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [secure, setSecure] = useState(isPassword || secureTextEntry);
    const isDark = useColorScheme() === "dark";

    const handleFocus = (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
      setFocused(false);
      onBlur?.(e);
    };

    const wrapperClass = [
      WRAPPER_BASE,
      focused && !error ? WRAPPER_FOCUS : "",
      error ? WRAPPER_ERROR : "",
      disabled ? WRAPPER_DISABLED : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <View className="w-full">
        {label && <Text className={LABEL_BASE}>{label}</Text>}

        <View className={wrapperClass}>
          {leftIcon && <View className="shrink-0">{leftIcon}</View>}

          <TextInput
            ref={ref}
            editable={!disabled}
            secureTextEntry={secure}
            placeholderTextColor={placeholderTextColor ?? (isDark ? "#6B7280" : "#A0A5BA")}
            className={INPUT_BASE}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {/* Sağ taraf: şifre gözü VEYA özel sağ ikon */}
          {isPassword ? (
            <TouchableOpacity
              onPress={() => setSecure((prev) => !prev)}
              activeOpacity={0.7}
              className="shrink-0 p-1"
            >
              {secure ? (
                <EyeOffIcon dark={isDark} />
              ) : (
                <EyeIcon dark={isDark} />
              )}
            </TouchableOpacity>
          ) : (
            rightIcon && <View className="shrink-0">{rightIcon}</View>
          )}
        </View>

        {error && <Text className={ERROR_BASE}>{error}</Text>}
        {!error && hint && <Text className={HINT_BASE}>{hint}</Text>}
      </View>
    );
  }
);

CustomInput.displayName = "CustomInput";

export default CustomInput;

// ─── Dahili ikonlar (SVG – harici paket gerekmez) ────────────────────────────

function EyeIcon({ dark }: { dark?: boolean }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      <AntDesign name="eye" size={18} color={dark ? "#ffffff" : "#525252"} />
    </View>
  );
}

function EyeOffIcon({ dark }: { dark?: boolean }) {
  return (
    <View className="w-5 h-5 items-center justify-center">
      <AntDesign name="eye-invisible" size={18} color={dark ? "#ffffff" : "#525252"} />
    </View>
  );
}
