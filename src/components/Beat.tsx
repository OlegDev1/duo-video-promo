import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, ease, lerp, tween } from "../motion";

/**
 * A beat of the film. It arrives from slightly behind the screen, drifts
 * towards the viewer while it is read, and leaves by flying past the camera.
 */
export const Beat: React.FC<{
  t: number;
  start: number;
  end: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Length of the exit in seconds. */
  exit?: number;
}> = ({ t, start, end, children, style, exit = 0.2 }) => {
  if (t < start - 0.05 || t > end + 0.05) return null;
  const out = tween(t, end - exit, exit, ease.in);
  const drift = clamp01((t - start) / (end - start));
  const scale = lerp(1, 1.05, drift) * lerp(1, 1.6, out);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        opacity: 1 - out,
        filter: out > 0.001 ? `blur(${out * 26}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
