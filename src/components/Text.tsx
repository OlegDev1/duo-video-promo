import React from "react";
import { ease, lerp, tween } from "../motion";

/**
 * Text that arrives word by word: each word rises, sharpens and settles.
 * The same entrance is used for every headline, which keeps the motion
 * language consistent.
 */
export const Words: React.FC<{
  text: string;
  t: number;
  start: number;
  stagger?: number;
  duration?: number;
  rise?: number;
  style?: React.CSSProperties;
  wordStyle?: (index: number, word: string) => React.CSSProperties | undefined;
}> = ({ text, t, start, stagger = 0.07, duration = 0.7, rise = 0.5, style, wordStyle }) => {
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.26em", ...style }}>
      {words.map((w, i) => {
        const p = tween(t, start + i * stagger, duration, ease.out);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: tween(t, start + i * stagger, duration * 0.6, ease.linear),
              transform: `translateY(${lerp(rise, 0, p)}em) scale(${lerp(0.94, 1, p)})`,
              filter: p < 0.999 ? `blur(${lerp(14, 0, p)}px)` : undefined,
              whiteSpace: "pre",
              ...(wordStyle ? wordStyle(i, w) : undefined),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** A single block that fades, rises and sharpens in. */
export const Rise: React.FC<{
  t: number;
  start: number;
  duration?: number;
  distance?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ t, start, duration = 0.7, distance = 40, style, children }) => {
  const p = tween(t, start, duration, ease.out);
  return (
    <div
      style={{
        opacity: tween(t, start, duration * 0.6, ease.linear),
        transform: `translateY(${lerp(distance, 0, p)}px)`,
        filter: p < 0.999 ? `blur(${lerp(10, 0, p)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
