import React from "react";

/**
 * Liquid-glass surface: blurred backdrop, a bright rim on top, a soft drop
 * shadow below. Used for every card and panel in the film.
 */
export const Glass: React.FC<{
  tone?: "light" | "dark";
  radius?: number;
  blur?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ tone = "light", radius = 36, blur = 28, style, children }) => {
  const light = tone === "light";
  return (
    <div
      style={{
        position: "relative",
        borderRadius: radius,
        background: light
          ? "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.58) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)",
        // blur = 0 gives a frosted look without a backdrop filter, for use
        // inside 3D-transformed groups where backdrop filters misbehave.
        backdropFilter: blur > 0 ? `blur(${blur}px) saturate(170%)` : undefined,
        WebkitBackdropFilter: blur > 0 ? `blur(${blur}px) saturate(170%)` : undefined,
        boxShadow: light
          ? "0 50px 100px -30px rgba(40,70,150,0.28), 0 18px 36px -18px rgba(40,70,150,0.2), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(120,140,190,0.14), inset 0 0 0 1px rgba(255,255,255,0.55)"
          : "0 40px 90px -30px rgba(0,0,0,0.7), inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
