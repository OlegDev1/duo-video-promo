import React from "react";
import { AbsoluteFill } from "remotion";
import { rand } from "../motion";

/**
 * Out-of-focus lights at several depths. `push` (0–1) is the camera push-in:
 * near lights move and grow more than far ones, which gives parallax.
 */
export const Bokeh: React.FC<{
  t: number;
  count?: number;
  seed?: number;
  /** "light" = glassy pearls on a bright background, "dark" = glowing dust. */
  mode: "light" | "dark";
  push?: number;
  opacity?: number;
}> = ({ t, count = 16, seed = 1, mode, push = 0, opacity = 1 }) => {
  const items = [];
  for (let i = 0; i < count; i++) {
    const s = seed * 100 + i;
    const depth = rand(s + 1); // 0 = far, 1 = near
    const size = (mode === "light" ? 26 : 8) + depth * depth * (mode === "light" ? 190 : 70);
    const baseX = rand(s + 2);
    const baseY = rand(s + 3);
    const speed = 0.012 + depth * 0.03;
    const x = baseX * 2000 - 40 + Math.sin(t * speed * 6 + i) * 30 * (0.4 + depth);
    const y = baseY * 1160 - 40 - t * speed * 400 * 0.25 + Math.cos(t * speed * 5 + i * 2) * 20;
    const scale = 1 + push * depth * 0.5;
    const dx = (baseX - 0.5) * push * depth * 420;
    const dy = (baseY - 0.5) * push * depth * 260;
    const blur = 2 + Math.abs(depth - 0.35) * (mode === "light" ? 22 : 12);
    const alpha = mode === "light" ? 0.35 + (1 - depth) * 0.35 : 0.1 + rand(s + 4) * 0.25;
    const hue = rand(s + 5);
    const tint =
      mode === "light"
        ? hue < 0.4
          ? "190,212,255"
          : hue < 0.7
            ? "226,214,255"
            : "255,226,214"
        : hue < 0.6
          ? "120,165,255"
          : "170,150,255";
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: "50%",
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          opacity: alpha * opacity,
          background:
            mode === "light"
              ? `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(${tint},0.75) 38%, rgba(${tint},0.25) 72%, rgba(${tint},0) 100%)`
              : `radial-gradient(circle, rgba(${tint},0.9) 0%, rgba(${tint},0.25) 55%, rgba(${tint},0) 100%)`,
          boxShadow:
            mode === "light" ? `0 ${size * 0.25}px ${size * 0.5}px rgba(80,110,190,0.12)` : undefined,
        }}
      />,
    );
  }
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{items}</AbsoluteFill>;
};
