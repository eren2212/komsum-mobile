/**
 * KOMSUM Design System – Renk Paleti
 *
 * Figma'dan türetilen marka renkleri:
 *   • komsum-turuncu: #FF6B4A  (primary)
 *   • Koyu arka plan: #121223  (secondary / dark bg)
 *
 * Kullanım:
 *   import { colors, lightTheme, darkTheme } from '@/theme/color';
 */

/** Sabit marka renkleri (tema bağımsız) */
export const palette = {
  /** Ana turuncu – marka rengi */
  orange: {
    50:  "#FFF1EE",
    100: "#FFD9D0",
    200: "#FFB5A5",
    300: "#FF8F74",
    400: "#FF6B4A",   // ← komsum-turuncu (DEFAULT)
    500: "#E55A39",
    600: "#C44A2C",
    700: "#9E3820",
    800: "#772616",
    900: "#51160C",
  },

  /** Koyu lacivert – secondary */
  navy: {
    50:  "#EEEEF5",
    100: "#CCCDE0",
    200: "#9A9BBF",
    300: "#6D6E9E",
    400: "#4A4B7C",
    500: "#2D2D57",
    600: "#1E1E3A",
    700: "#1C1C35",
    800: "#161628",
    900: "#121223",   // ← dark background (DEFAULT)
  },

  /** Nötr tonlar */
  neutral: {
    0:   "#FFFFFF",
    50:  "#F5F6FA",
    100: "#E8EAF0",
    200: "#D1D5E0",
    300: "#A0A5BA",   // ← placeholder text
    400: "#646982",   // ← secondary text
    500: "#4A4E5A",
    600: "#32343E",   // ← primary text (light mode)
    700: "#23252D",
    800: "#14151A",
    900: "#000000",
  },

  /** Durum renkleri */
  success: {
    DEFAULT: "#22C55E",
    light:   "#DCFCE7",
    dark:    "#15803D",
  },
  warning: {
    DEFAULT: "#F59E0B",
    light:   "#FEF3C7",
    dark:    "#B45309",
  },
  error: {
    DEFAULT: "#EF4444",
    light:   "#FEE2E2",
    dark:    "#B91C1C",
  },
  info: {
    DEFAULT: "#3B82F6",
    light:   "#DBEAFE",
    dark:    "#1D4ED8",
  },
};

/** ─── LIGHT TEMA ─────────────────────────────────────── */
export const lightTheme = {
  primary:          palette.orange[400],
  primaryHover:     palette.orange[500],
  primaryLight:     palette.orange[100],
  primaryForeground: palette.neutral[0],

  secondary:        palette.navy[900],
  secondaryHover:   palette.navy[800],
  secondaryLight:   palette.navy[50],
  secondaryForeground: palette.neutral[0],

  background:       palette.neutral[0],
  surface:          palette.neutral[50],
  surfaceElevated:  palette.neutral[0],

  border:           palette.neutral[100],
  borderFocus:      palette.orange[400],

  text:             palette.neutral[600],
  textSecondary:    palette.neutral[400],
  textDisabled:     palette.neutral[300],
  textInverse:      palette.neutral[0],
  placeholder:      palette.neutral[300],

  success:          palette.success.DEFAULT,
  successBg:        palette.success.light,
  warning:          palette.warning.DEFAULT,
  warningBg:        palette.warning.light,
  error:            palette.error.DEFAULT,
  errorBg:          palette.error.light,
  info:             palette.info.DEFAULT,
  infoBg:           palette.info.light,

  overlay:          "rgba(18,18,35,0.5)",
  shadow:           "rgba(18,18,35,0.08)",
};

/** ─── DARK TEMA ──────────────────────────────────────── */
export const darkTheme = {
  primary:          palette.orange[400],
  primaryHover:     palette.orange[300],
  primaryLight:     palette.navy[700],
  primaryForeground: palette.neutral[0],

  secondary:        palette.navy[200],
  secondaryHover:   palette.navy[100],
  secondaryLight:   palette.navy[800],
  secondaryForeground: palette.neutral[0],

  background:       palette.navy[900],
  surface:          palette.navy[800],
  surfaceElevated:  palette.navy[700],

  border:           palette.navy[600],
  borderFocus:      palette.orange[400],

  text:             palette.neutral[0],
  textSecondary:    palette.neutral[300],
  textDisabled:     palette.neutral[400],
  textInverse:      palette.neutral[600],
  placeholder:      palette.neutral[400],

  success:          palette.success.DEFAULT,
  successBg:        "rgba(34,197,94,0.15)",
  warning:          palette.warning.DEFAULT,
  warningBg:        "rgba(245,158,11,0.15)",
  error:            palette.error.DEFAULT,
  errorBg:          "rgba(239,68,68,0.15)",
  info:             palette.info.DEFAULT,
  infoBg:           "rgba(59,130,246,0.15)",

  overlay:          "rgba(0,0,0,0.65)",
  shadow:           "rgba(0,0,0,0.3)",
};

/** Tailwind config için düzleştirilmiş renk haritası */
export const colors = {
  primary: {
    DEFAULT:    palette.orange[400],
    hover:      palette.orange[500],
    light:      palette.orange[100],
    foreground: palette.neutral[0],
    ...palette.orange,
  },
  secondary: {
    DEFAULT:    palette.navy[900],
    hover:      palette.navy[800],
    light:      palette.navy[50],
    foreground: palette.neutral[0],
    ...palette.navy,
  },
  neutral:   palette.neutral,
  success:   palette.success,
  warning:   palette.warning,
  error:     palette.error,
  info:      palette.info,
};
