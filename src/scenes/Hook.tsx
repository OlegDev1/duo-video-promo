import React from "react";
import { AbsoluteFill } from "remotion";
import { DarkBackground } from "../components/Background";
import { Bokeh } from "../components/Bokeh";
import { Glass } from "../components/Glass";
import { HandStroke, strokes } from "../components/HandStroke";
import { clamp01, ease, lerp, rand, springAt, springs, tween, useTime } from "../motion";
import { color, display, font } from "../theme";
import { timeline } from "../timeline";

const C = timeline.hook;
const DURATION = timeline.scenes.hook.end - timeline.scenes.hook.start;

/** One word of a headline: rises, sharpens and settles. */
const W: React.FC<{
  t: number;
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ t, at, children, style }) => {
  const p = tween(t, at, 0.6, ease.out);
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        opacity: tween(t, at, 0.3, ease.linear),
        transform: `translateY(${lerp(0.45, 0, p)}em) scale(${lerp(0.92, 1, p)})`,
        filter: p < 0.999 ? `blur(${lerp(16, 0, p)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * A typographic beat. It arrives from slightly behind the screen, drifts
 * towards the viewer while it is read, and leaves by flying past the camera.
 */
const Beat: React.FC<{
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

const headline: React.CSSProperties = {
  color: "#f5f7ff",
  textAlign: "center",
  whiteSpace: "nowrap",
  textShadow: "0 0 80px rgba(110,150,255,0.35)",
};

// Topics two people talk about. Scattered in beat 2, crammed together in beat 3.
const TOPICS: Array<{ text: string; x: number; y: number; size: number; rot: number; hue: number }> = [
  { text: "работа", x: -640, y: -300, size: 104, rot: -7, hue: 0 },
  { text: "отпуск", x: 560, y: -330, size: 120, rot: 6, hue: 1 },
  { text: "дом", x: -790, y: 30, size: 92, rot: 5, hue: 2 },
  { text: "счета", x: 760, y: -40, size: 96, rot: -5, hue: 0 },
  { text: "идеи", x: -520, y: 300, size: 116, rot: -4, hue: 1 },
  { text: "документы", x: 520, y: 290, size: 100, rot: 4, hue: 2 },
  { text: "фото", x: 60, y: -400, size: 88, rot: -3, hue: 2 },
  { text: "код", x: -60, y: 390, size: 92, rot: 7, hue: 0 },
];
const TOPIC_COLORS = ["#ffb39f", "#a9c4ff", "#d6c8ff"];

const Topics: React.FC<{ t: number }> = ({ t }) => {
  if (t < C.line2 || t > C.line4 + 0.1) return null;
  const jam = tween(t, C.line3 - 0.12, 0.5, ease.inOut);
  const out = tween(t, C.line4 - 0.2, 0.2, ease.in);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - out,
        transform: `scale(${lerp(1, 1.5, out)})`,
        filter: out > 0.001 ? `blur(${out * 26}px)` : undefined,
      }}
    >
      {TOPICS.map((w, i) => {
        const at = C.line2 + 0.18 + i * 0.075;
        const pop = springAt(t, at, springs.pop);
        const float = Math.sin(t * 1.6 + i * 1.7) * 8 * (1 - jam);
        // Crammed position: all words pile up inside one narrow bar.
        const jx = ((((i * 3) % TOPICS.length) + 0.5) / TOPICS.length - 0.5) * 700;
        const jy = 150 + (rand(i + 40) - 0.5) * 20;
        const shake = jam > 0.95 ? Math.sin(t * 38 + i * 2.1) * 2.5 : 0;
        const x = lerp(w.x, jx, jam) + shake;
        const y = lerp(w.y + float, jy, jam);
        const depth = 0.95 + rand(i + 9) * 0.55;
        const scale = lerp(pop * depth, 0.74, jam);
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              fontFamily: font.hand,
              fontSize: w.size,
              lineHeight: 1,
              color: TOPIC_COLORS[w.hue],
              opacity: Math.min(1, pop * 1.4) * lerp(depth > 1.15 ? 1 : 0.8, 0.95, jam),
              transform: `translate(${x}px, ${y}px) rotate(${lerp(w.rot, (rand(i + 60) - 0.5) * 26, jam)}deg) scale(${scale})`,
              filter: `blur(${lerp(depth < 1.1 ? 2 : 0, 0, jam)}px)`,
              textShadow: "0 0 30px rgba(120,150,255,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const t = useTime();
  const push = tween(t, 0, DURATION, ease.linear);
  const leave = tween(t, C.out, DURATION - C.out, ease.in);

  return (
    <AbsoluteFill>
      <DarkBackground t={t} energy={0.1 + push * 0.15} />
      <Bokeh t={t} mode="dark" count={26} seed={3} push={push * 0.8 + leave * 2} />

      {/* A slow streak of light behind the type gives the dark some air. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 16% at 50% 50%, rgba(140,170,255,0.2) 0%, rgba(140,170,255,0) 70%)",
          transform: `translateX(${Math.sin(t * 0.9) * 120}px) rotate(-8deg) scale(${1.1 + push * 0.3})`,
          opacity: 1 - leave,
        }}
      />

      <AbsoluteFill style={{ transform: `scale(${1 + push * 0.04})` }}>
        {/* 1. One person. */}
        <Beat t={t} start={C.line1} end={C.line2}>
          <div style={{ ...display(210, 680), ...headline }}>
            <W t={t} at={C.line1}>
              Один
            </W>{" "}
            <W t={t} at={C.line1 + 0.1}>
              человек.
              <HandStroke
                d={strokes.underline}
                viewBox="0 0 600 60"
                width={720}
                height={72}
                progress={tween(t, C.line1 + 0.5, 0.5, ease.inOut)}
                color={color.coral}
                strokeWidth={9}
                glow
                style={{ left: 10, bottom: -62 }}
              />
            </W>
          </div>
        </Beat>

        {/* 2. Dozens of topics, scattered in depth around the line. */}
        <Beat t={t} start={C.line2} end={C.line3}>
          <div style={{ ...display(170, 680), ...headline }}>
            <W t={t} at={C.line2}>
              Десятки
            </W>{" "}
            <W t={t} at={C.line2 + 0.1}>
              тем.
            </W>
          </div>
        </Beat>
        {/* 3. And only one chat: the topics are crammed into a single bar. */}
        <Beat t={t} start={C.line3} end={C.line4}>
          <div style={{ ...display(160, 680), ...headline, transform: "translateY(-120px)" }}>
            <W t={t} at={C.line3}>
              И всего
            </W>{" "}
            <W t={t} at={C.line3 + 0.1}>
              один
              <HandStroke
                d={strokes.ring}
                viewBox="0 0 600 240"
                width={470}
                height={236}
                progress={tween(t, C.line3 + 0.4, 0.5, ease.inOut)}
                color={color.coral}
                strokeWidth={8}
                glow
                style={{ left: -34, top: -26 }}
              />
            </W>{" "}
            <W t={t} at={C.line3 + 0.2}>
              чат.
            </W>
          </div>
          <div
            style={{
              position: "absolute",
              top: 540 + 150 - 62,
              left: 960 - 470,
              transform: `scale(${lerp(0.8, 1, springAt(t, C.line3 - 0.05, springs.pop))})`,
              opacity: tween(t, C.line3 - 0.05, 0.25, ease.linear),
            }}
          >
            <Glass tone="dark" radius={62} blur={18} style={{ width: 940, height: 124 }} />
          </div>
        </Beat>

        <Topics t={t} />

        {/* 4. The point: other messengers and email give you no second chat. */}
        <Beat t={t} start={C.line4} end={DURATION + 0.02} exit={DURATION - C.out}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                ...display(76, 560),
                color: "rgba(226,232,255,0.62)",
                marginBottom: 26,
                whiteSpace: "nowrap",
              }}
            >
              <W t={t} at={C.line4}>
                В WhatsApp
              </W>{" "}
              <W t={t} at={C.line4 + 0.07}>
                и почте
              </W>
            </div>
            <div style={{ ...display(118, 680), ...headline }}>
              <W t={t} at={C.line4 + 0.16}>
                второй чат
              </W>{" "}
              <W t={t} at={C.line4 + 0.24}>
                с ним
              </W>{" "}
              <W t={t} at={C.line4 + 0.32}>
                не создать.
                <HandStroke
                  d={strokes.underline}
                  viewBox="0 0 600 60"
                  width={620}
                  height={62}
                  progress={tween(t, C.line4 + 0.6, 0.4, ease.inOut)}
                  color={color.coral}
                  strokeWidth={9}
                  glow
                  style={{ left: 6, bottom: -54 }}
                />
              </W>
            </div>
          </div>
        </Beat>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};
