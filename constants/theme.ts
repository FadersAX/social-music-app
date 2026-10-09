// constants/theme.ts
// Shared look & feel for the app: a dark "Ocean" palette.
// Change the accent colours here to re-theme the whole app.

export const palette = {
  bg: "#060A12",
  surface: "#0E1521",
  surfaceAlt: "#16202F",
  border: "rgba(165,243,252,0.09)",
  text: "#F4FAFF",
  textDim: "#93A4BC",
  textMuted: "#5B6A80",

  accent: "#22D3EE", // cyan - main accent (buttons, active tab, highlights)
  accentSoft: "rgba(34,211,238,0.15)",
  accent2: "#3B82F6", // blue
  accent3: "#2DD4BF", // teal
  accent4: "#A5F3FC", // ice
  accent5: "#0EA5E9", // sky
  danger: "#F43F5E",
};

// Colours used to tint charts, rank badges and avatars
export const accents = [
  palette.accent,
  palette.accent2,
  palette.accent3,
  palette.accent4,
  palette.accent5,
];

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  hero: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.8 },
  title: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "500" as const },
  caption: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 0.6 },
};
