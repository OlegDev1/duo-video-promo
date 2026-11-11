import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { lerp } from "../motion";

type Blob = {
  /** Centre, as a fraction of the frame. */
  x: number;
  y: number;
  /** Diameter in pixels. */
  size: number;
  rgb: string;
  alpha: number;
  /** Drift radius in pixels and speed in turns per second. */
  drift: number;
  speed: number;
  phase: number;
};

const blobStyle = (b: Blob, t: number, strength: number): React.CSSProperties => {
  const a = (t * b.speed + b.phase) * Math.PI * 2;
  const dx = Math.cos(a) * b.drift;
  const dy = Math.sin(a * 0.8) * b.drift * 0.6;
  return {
    position: "absolute",
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: b.size,
    height: b.size,
    marginLeft: -b.size / 2,
    marginTop: -b.size / 2,
    transform: `translate(${dx}px, ${dy}px)`,
    background: `radial-gradient(closest-side, rgba(${b.rgb}, ${b.alpha * strength}) 0%, rgba(${b.rgb}, ${
      b.alpha * strength * 0.45
    }) 40%, rgba(${b.rgb}, 0) 100%)`,
  };
};

const DARK_BLOBS: Blob[] = [
  { x: 0.16, y: 0.86, size: 1500, rgb: "45,104,250", alpha: 0.42, drift: 90, speed: 0.035, phase: 0 },
  { x: 0.9, y: 0.1, size: 1300, rgb: "122,92,255", alpha: 0.3, drift: 110, speed: 0.03, phase: 0.3 },
  { x: 0.62, y: 0.62, size: 900, rgb: "20,180,220", alpha: 0.12, drift: 140, speed: 0.045, phase: 0.6 },
];

const LIGHT_BLOBS: Blob[] = [
  { x: 0.12, y: 0.2, size: 1500, rgb: "150,190,255", alpha: 0.75, drift: 120, speed: 0.03, phase: 0.1 },
  { x: 0.9, y: 0.16, size: 1300, rgb: "214,196,255", alpha: 0.7, drift: 100, speed: 0.035, phase: 0.45 },
  { x: 0.82, y: 0.92, size: 1400, rgb: "255,214,196", alpha: 0.6, drift: 130, speed: 0.028, phase: 0.7 },
  { x: 0.2, y: 0.95, size: 1200, rgb: "190,240,236", alpha: 0.55, drift: 110, speed: 0.04, phase: 0.9 },
];

/**
 * The dark space of the first two scenes: deep blue-graphite, never flat black.
 * `energy` (0–1) raises the light as the build goes on.
 */
export const DarkBackground: React.FC<{ t: number; energy?: number }> = ({ t, energy = 0 }) => (
  <AbsoluteFill style={{ background: "linear-gradient(155deg, #05060b 0%, #0a0d18 48%, #0d1226 100%)" }}>
    {DARK_BLOBS.map((b, i) => (
      <div key={i} style={blobStyle(b, t, lerp(0.75, 1.5, energy))} />
    ))}
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 55% at 50% 50%, rgba(120,160,255,${
          0.05 + energy * 0.2
        }) 0%, rgba(120,160,255,0) 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)",
      }}
    />
  </AbsoluteFill>
);

/** The light, airy space the film lives in after the icon is born. */
export const LightBackground: React.FC<{ t: number; warmth?: number }> = ({ t, warmth = 1 }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #ffffff 0%, #f4f7fd 50%, #e8eefa 100%)" }}>
    {LIGHT_BLOBS.map((b, i) => (
      <div key={i} style={blobStyle(b, t, warmth)} />
    ))}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 55% 50% at 50% 46%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 75%)",
      }}
    />
  </AbsoluteFill>
);

/** Film grain over everything. Shifts every frame so it reads as texture. */
export const Grain: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 0.05 }) => {
  const step = Math.floor(t * 30);
  const ox = (step * 173) % 512;
  const oy = (step * 311) % 512;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("grain.png")})`,
        backgroundPosition: `${ox}px ${oy}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};
