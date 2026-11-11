import React from "react";

// The white glyph of the Duo icon, copied from client/public/icons/favicon.svg
// in the app's repository (512-unit grid).
const GLYPH =
  "M232 196h88c52 0 94 42 94 94v6c0 40-25 74-60 88l5 38c1 10-10 16-18 10l-55-42h-54c-52 0-94-42-94-94v-6c0-52 42-94 94-94z";

/**
 * The Duo app icon with gloss: gradient body, top highlight, a moving specular
 * sweep (`sweep` 0–1, outside that range it is off) and a soft coloured shadow.
 */
export const DuoIcon: React.FC<{
  size: number;
  sweep?: number;
  shadow?: number;
  glyph?: number;
  style?: React.CSSProperties;
}> = ({ size, sweep = -1, shadow = 1, glyph = 1, style }) => {
  const r = (size * 116) / 512;
  const id = React.useId().replace(/:/g, "");
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: r,
        boxShadow: `0 ${size * 0.22}px ${size * 0.4}px -${size * 0.1}px rgba(42,92,240,${0.5 * shadow}), 0 ${
          size * 0.06
        }px ${size * 0.12}px -${size * 0.02}px rgba(20,50,150,${0.35 * shadow})`,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: r, overflow: "hidden" }}>
        <svg width={size} height={size} viewBox="0 0 512 512" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5b93ff" />
              <stop offset="1" stopColor="#2a5cf0" />
            </linearGradient>
            <radialGradient id={`hl${id}`} cx="0.3" cy="0.05" r="0.9">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`gl${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e9f0ff" />
            </linearGradient>
            <filter id={`ds${id}`} x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#123a9e" floodOpacity="0.35" />
            </filter>
          </defs>
          <rect width="512" height="512" fill={`url(#bg${id})`} />
          <rect width="512" height="512" fill={`url(#hl${id})`} />
          <g
            transform={`translate(256 256) scale(${glyph}) translate(-256 -256) translate(4 -18)`}
            opacity={Math.min(1, glyph * 1.4)}
          >
            <rect x="98" y="122" width="286" height="196" rx="98" fill="#fff" fillOpacity="0.5" />
            <path d={GLYPH} fill={`url(#gl${id})`} filter={`url(#ds${id})`} />
          </g>
        </svg>
        {sweep >= 0 && sweep <= 1 ? (
          <div
            style={{
              position: "absolute",
              top: -size * 0.3,
              left: -size * 0.9 + sweep * size * 2.4,
              width: size * 0.5,
              height: size * 1.6,
              transform: "rotate(20deg)",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
              filter: `blur(${size * 0.03}px)`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r,
            boxShadow: `inset 0 ${size * 0.012}px 0 rgba(255,255,255,0.55), inset 0 -${size * 0.02}px ${
              size * 0.05
            }px rgba(10,40,140,0.35), inset 0 0 0 ${Math.max(1, size * 0.004)}px rgba(255,255,255,0.14)`,
          }}
        />
      </div>
    </div>
  );
};
