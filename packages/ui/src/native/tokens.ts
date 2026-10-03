// Design tokens for React Native. Values mirror src/styles/globals.css and the
// mobile column of the type scale in aura-design.md.

// The brand palette: the same in both themes.
export const palette = {
  blue: "#0096de",
  slate: "#353d4d",
  yellow: "#efdf00",
  green: "#00c389",
  magenta: "#da1884",
  orange: "#fc4c02",
  white: "#ffffff",
  // Blue dark enough for white text on it, and for links on white.
  blueText: "#0077b3",
  // Camera and other always-dark screens.
  night: "#1e232c",
} as const

const light = {
  ...palette,
  background: "#ffffff",
  // Behind grouped cards (settings-style screens).
  canvas: "#f2f3f5",
  card: "#ffffff",
  foreground: "#353d4d",
  // Filled controls: primary button, selected chip, checked box.
  primary: "#353d4d",
  primaryForeground: "#ffffff",
  muted: "#eef0f3",
  mutedForeground: "#5e6677",
  accent: "#e0f2fb",
  border: "#d8dadf",
  input: "#8a91a0",
  link: "#0077b3",
  destructive: "#c73a00",
  success: "#006b4a",
  successMuted: "#ddf5ec",
}

export type Colors = { [Key in keyof typeof light]: string }

export const lightColors: Colors = light

// Slate backgrounds and white text, as in the charter's reversed logo.
export const darkColors: Colors = {
  ...palette,
  background: "#262c38",
  canvas: "#1f242e",
  card: "#353d4d",
  foreground: "#ffffff",
  primary: "#ffffff",
  primaryForeground: "#353d4d",
  muted: "#353d4d",
  mutedForeground: "#b9bec8",
  accent: "#414a5c",
  border: "rgba(255, 255, 255, 0.15)",
  input: "rgba(255, 255, 255, 0.45)",
  link: "#7cc8f2",
  destructive: "#ff7a45",
  success: "#7fe0bd",
  successMuted: "rgba(0, 195, 137, 0.2)",
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const

export const space = {
  gutter: 20,
} as const

export const shadow = {
  card: {
    shadowColor: palette.slate,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
} as const
