import React from "react";
import { clamp01 } from "../motion";

/**
 * A handwritten marker stroke that draws itself. `d` is an SVG path in the
 * given viewBox, `progress` runs 0 → 1.
 */
export const HandStroke: React.FC<{
  d: string;
  progress: number;
  width: number;
  height: number;
  viewBox: string;
  color: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  glow?: boolean;
}> = ({ d, progress, width, height, viewBox, color, strokeWidth = 10, style, glow = false }) => {
  const p = clamp01(progress);
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={{
        position: "absolute",
        overflow: "visible",
        filter: glow ? `drop-shadow(0 0 18px ${color}99)` : undefined,
        ...style,
      }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
        opacity={p <= 0 ? 0 : 1}
      />
    </svg>
  );
};

// Hand-drawn shapes used across the film. Each is drawn in one pen movement.
export const strokes = {
  /** A quick double underline, viewBox 0 0 600 60. */
  underline:
    "M8 26 C 120 10, 260 8, 420 16 S 580 22, 592 18 C 520 30, 300 34, 150 44 S 60 50, 110 52",
  /** A loose ring around a word, viewBox 0 0 600 240. */
  ring: "M330 22 C 150 4, 20 60, 22 128 C 24 200, 190 232, 330 222 C 480 212, 590 170, 578 104 C 566 40, 420 8, 250 30",
  /** A crossing-out zigzag, viewBox 0 0 600 120. */
  scratch: "M10 70 L 150 28 L 120 92 L 300 30 L 270 96 L 450 30 L 420 94 L 592 44",
  /** A curved arrow, viewBox 0 0 200 200. */
  arrow: "M20 30 C 60 120, 110 150, 170 150 M 140 120 L 172 150 L 136 176",
  /** A check mark, viewBox 0 0 100 100. */
  check: "M16 54 L 42 78 L 86 22",
};
