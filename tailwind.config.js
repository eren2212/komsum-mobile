const { colors } = require("./src/theme/color");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],

  /**
   * NativeWind v4 dark mode: "class" kullanılır.
   * useColorScheme() hook'u ile "dark" class'ı root view'e eklenir.
   */
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        /** ─── Marka renkleri ───────────────────────── */
        primary: colors.primary,
        secondary: colors.secondary,

        /** ─── Nötr / gri skalası ──────────────────── */
        neutral: colors.neutral,

        /** ─── Durum renkleri ──────────────────────── */
        success: colors.success,
        warning: colors.warning,
        error:   colors.error,
        info:    colors.info,

        /** ─── Kısa alias'lar ───────────────────────
         *  bg-surface, text-muted gibi semantik sınıflar
         *  light/dark modda CSS variable olarak çözülür.
         */
        surface:     {
          DEFAULT: colors.neutral[50],
          dark:    colors.secondary[800],
        },
        muted:       {
          DEFAULT: colors.neutral[400],
          dark:    colors.neutral[300],
        },
        placeholder: {
          DEFAULT: colors.neutral[300],
          dark:    colors.neutral[400],
        },
      },

      /** ─── Tipografi ──────────────────────────────── */
      fontFamily: {
        sen:       ["Sen_400Regular", "sans-serif"],
        "sen-bold": ["Sen_700Bold", "sans-serif"],
      },

      /** ─── Border radius ─────────────────────────── */
      borderRadius: {
        xl2: "16px",
        xl3: "24px",
      },

      /** ─── Box shadow (Web / iOS) ─────────────────── */
      boxShadow: {
        card:   "0 2px 12px rgba(18,18,35,0.08)",
        "card-dark": "0 2px 12px rgba(0,0,0,0.30)",
        button: "0 4px 16px rgba(255,107,74,0.35)",
      },
    },
  },

  plugins: [],
};
