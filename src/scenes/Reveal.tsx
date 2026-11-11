import React from "react";
import { AbsoluteFill } from "remotion";
import { LightBackground } from "../components/Background";
import { Bokeh } from "../components/Bokeh";
import { DuoIcon } from "../components/DuoIcon";
import { HandStroke, strokes } from "../components/HandStroke";
import { ease, lerp, rand, springAt, springs, tween, useTime } from "../motion";
import { color, display } from "../theme";
import { timeline } from "../timeline";

const C = timeline.reveal;
const DURATION = timeline.scenes.reveal.end - timeline.scenes.reveal.start;

const CX = 960;
const CY = 430;
const ICON = 340;

/** Soft rays of light turning slowly behind the icon. */
export const Rays: React.FC<{ t: number; x: number; y?: number; opacity: number }> = ({
  t,
  x,
  y = CY,
  opacity,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 1300,
      top: y - 1300,
      width: 2600,
      height: 2600,
      opacity,
      transform: `rotate(${t * 5}deg)`,
      background:
        "repeating-conic-gradient(from 0deg, rgba(110,150,255,0) 0deg, rgba(110,150,255,0.16) 5deg, rgba(110,150,255,0) 11deg, rgba(190,170,255,0.12) 17deg, rgba(110,150,255,0) 24deg)",
      WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 8%, rgba(0,0,0,0) 62%)",
      maskImage: "radial-gradient(circle, rgba(0,0,0,1) 8%, rgba(0,0,0,0) 62%)",
      filter: "blur(10px)",
    }}
  />
);

/** Sparks thrown out at the moment of birth. */
const Sparks: React.FC<{ t: number }> = ({ t }) => {
  if (t > 1.8) return null;
  return (
    <>
      {Array.from({ length: 34 }, (_, i) => {
        const a = rand(i + 1) * Math.PI * 2;
        const speed = 320 + rand(i + 50) * 620;
        const life = 0.9 + rand(i + 90) * 0.8;
        const p = Math.min(1, t / life);
        const dist = ICON * 0.4 + speed * (1 - Math.pow(1 - p, 3));
        const size = 4 + rand(i + 130) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * dist - size / 2,
              top: CY + Math.sin(a) * dist * 0.8 - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#ffffff" : "rgba(120,165,255,0.95)",
              boxShadow: "0 0 16px 4px rgba(120,165,255,0.6)",
              opacity: (1 - p) * 0.95,
              filter: `blur(${rand(i + 170) * 2.5}px)`,
            }}
          />
        );
      })}
    </>
  );
};

export const Reveal: React.FC = () => {
  const t = useTime();
  const push = tween(t, 0, DURATION, ease.soft);
  const out = tween(t, C.out, DURATION - C.out, ease.in);

  // Birth: the white-hot form cools into the blue icon and the glyph appears.
  const land = springAt(t, C.icon, springs.hero);
  const whiteHot = 1 - tween(t, 0.15, 0.85, ease.out);
  const glyph = springAt(t, 0.45, springs.pop);
  const sweep = tween(t, C.sweep, 0.9, ease.inOut);

  // Lockup: the icon steps aside and the name comes out from behind it.
  const lock = springAt(t, C.wordmark, springs.smooth);
  const iconScale = lerp(1.45, 1, land) * lerp(1, 0.86, lock);
  const iconX = lerp(CX, 700, lock);
  const bob = Math.sin(t * 1.5) * 6;
  const size = ICON;
  const word = tween(t, C.wordmark + 0.12, 0.8, ease.out);
  const tag = tween(t, C.tagline, 0.7, ease.out);

  const ring = (delay: number) => {
    const p = tween(t, delay, 1.3, ease.out);
    return p > 0 && p < 1 ? (
      <div
        key={delay}
        style={{
          position: "absolute",
          left: CX - size / 2,
          top: CY - size / 2,
          width: size,
          height: size,
          borderRadius: size * 0.227,
          border: `3px solid rgba(90,140,255,${(1 - p) * 0.55})`,
          boxShadow: `0 0 50px rgba(120,165,255,${(1 - p) * 0.5})`,
          transform: `scale(${1 + p * 2.6})`,
        }}
      />
    ) : null;
  };

  return (
    <AbsoluteFill>
      <LightBackground t={t} />
      <Rays t={t} x={iconX} opacity={tween(t, 0.1, 1.2, ease.out) * 0.9} />
      <Bokeh t={t} mode="light" count={20} seed={5} push={push} />

      <AbsoluteFill
        style={{
          transform: `scale(${(1 + push * 0.06) * lerp(1, 1.5, out)})`,
          transformOrigin: `${CX}px ${CY + 60}px`,
          opacity: 1 - out,
          filter: out > 0.001 ? `blur(${out * 24}px)` : undefined,
        }}
      >
        {ring(0.02)}
        {ring(0.32)}
        <Sparks t={t} />

        {/* Soft pool of colour on the floor under the icon */}
        <div
          style={{
            position: "absolute",
            left: iconX - 300,
            top: CY + size * 0.5 * iconScale + 10,
            width: 600,
            height: 90,
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(42,92,240,0.3) 0%, rgba(42,92,240,0) 100%)",
            filter: "blur(8px)",
            opacity: tween(t, 0.2, 0.8),
          }}
        />
        {/* Reflection in the glossy floor */}
        <div
          style={{
            position: "absolute",
            left: iconX - size / 2,
            top: CY + size * 0.5 * iconScale + 26 - (size * (1 - iconScale)) / 2 - bob,
            width: size,
            height: size,
            transform: `scale(${iconScale})`,
            transformOrigin: "50% 0%",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 42%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 42%)",
            filter: "blur(3px)",
            opacity: tween(t, 0.3, 0.8),
          }}
        >
          <DuoIcon size={size} glyph={glyph} shadow={0} style={{ transform: "scaleY(-1)" }} />
        </div>

        {/* The name, revealed from behind the icon */}
        <div
          style={{
            position: "absolute",
            left: 900,
            top: CY - 150,
            height: 300,
            display: "flex",
            alignItems: "center",
            ...display(264, 700),
            color: color.ink,
            opacity: tween(t, C.wordmark + 0.12, 0.35, ease.linear),
            transform: `translateX(${lerp(-150, 0, word)}px)`,
            clipPath: `inset(-20% -10% -20% ${lerp(60, 0, word)}%)`,
            filter: word < 0.999 ? `blur(${lerp(12, 0, word)}px)` : undefined,
          }}
        >
          Duo
        </div>

        {/* The icon */}
        <div
          style={{
            position: "absolute",
            left: iconX - size / 2,
            top: CY - size / 2 + bob,
            transform: `scale(${iconScale})`,
          }}
        >
          <DuoIcon size={size} glyph={glyph} sweep={t >= C.sweep ? sweep : -1} shadow={tween(t, 0.2, 0.8)} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: (size * 116) / 512,
              background: "#ffffff",
              opacity: whiteHot,
              boxShadow: `0 0 ${120 * whiteHot}px ${60 * whiteHot}px rgba(255,255,255,${whiteHot})`,
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 770,
            textAlign: "center",
            ...display(76, 620),
            color: color.ink,
            opacity: tween(t, C.tagline, 0.4, ease.linear),
            transform: `translateY(${lerp(40, 0, tag)}px)`,
            filter: tag < 0.999 ? `blur(${lerp(10, 0, tag)}px)` : undefined,
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            Много чатов
            <HandStroke
              d={strokes.underline}
              viewBox="0 0 600 60"
              width={440}
              height={44}
              progress={tween(t, C.tagline + 0.5, 0.5, ease.inOut)}
              color={color.blue}
              strokeWidth={8}
              style={{ left: 4, bottom: -40 }}
            />
          </span>{" "}
          <span style={{ color: color.inkSoft }}>с одним человеком</span>
        </div>
      </AbsoluteFill>

      {/* Arriving out of the burst of light that ended the previous scene */}
      <AbsoluteFill style={{ background: "#ffffff", opacity: 1 - tween(t, 0, 0.7, ease.out) }} />
    </AbsoluteFill>
  );
};
