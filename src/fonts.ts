import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled in public/fonts, so a render needs no network.
const CYR = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116";
const LAT =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

const faces: Array<[string, string, string, string]> = [
  ["Inter Duo", "inter-cyrillic-opsz-normal.woff2", "100 900", CYR],
  ["Inter Duo", "inter-latin-opsz-normal.woff2", "100 900", LAT],
  ["Caveat Duo", "caveat-cyrillic-700-normal.woff2", "700", CYR],
  ["Caveat Duo", "caveat-latin-700-normal.woff2", "700", LAT],
  ["JetBrains Duo", "jetbrains-mono-cyrillic-wght-normal.woff2", "100 800", CYR],
  ["JetBrains Duo", "jetbrains-mono-latin-wght-normal.woff2", "100 800", LAT],
];

let started = false;

export const loadFonts = (): void => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading fonts");
  Promise.all(
    faces.map(([family, file, weight, unicodeRange]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
        weight,
        unicodeRange,
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error("Font loading failed", err);
      continueRender(handle);
    });
};
