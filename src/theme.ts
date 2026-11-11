export const color = {
  // Duo brand colours, taken from the app's icon and stylesheet.
  blue: "#2d68fa",
  blueLight: "#5b93ff",
  blueDeep: "#2a5cf0",
  ink: "#0b0c10",
  inkSoft: "#4a4f5c",
  inkMute: "#8a90a0",
  paper: "#f5f6fa",
  white: "#ffffff",
  // Accent used by handwritten strokes.
  coral: "#ff6a4d",
  mint: "#35c98f",
  bubbleIn: "#ececf1",
};

export const font = {
  sans: "'Inter Duo', system-ui, sans-serif",
  hand: "'Caveat Duo', cursive",
  mono: "'JetBrains Duo', ui-monospace, monospace",
};

/** Display type: tight tracking, optical size at maximum. */
export const display = (size: number, weight = 650): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: size >= 80 ? "-0.045em" : "-0.03em",
  lineHeight: 1.02,
  fontVariationSettings: "'opsz' 32",
});

export const body = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: "-0.015em",
  lineHeight: 1.25,
  fontVariationSettings: `'opsz' ${Math.min(32, Math.max(14, size))}`,
});
