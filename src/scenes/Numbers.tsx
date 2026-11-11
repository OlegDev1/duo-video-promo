import React from "react";
import { AbsoluteFill } from "remotion";
import { LightBackground } from "../components/Background";
import { Beat } from "../components/Beat";
import { Bokeh } from "../components/Bokeh";
import { DuoIcon } from "../components/DuoIcon";
import { Glass } from "../components/Glass";
import { HandStroke, strokes } from "../components/HandStroke";
import { clamp01, ease, lerp, springAt, springs, tween, useTime } from "../motion";
import { body, color, display, font } from "../theme";
import { timeline } from "../timeline";
import { Rays } from "./Reveal";

const C = timeline.numbers;
const DURATION = timeline.scenes.numbers.end - timeline.scenes.numbers.start;

// Verified figures for the first build of Duo. Sources are listed in CHECKPOINT.md.
const LINES_OF_CODE = 15207;
const HOURS = 3.5;
const AGENTS = 9;
const BY_HAND = "130–150";
const BY_HAND_MID = 140;

const NNBSP = " ";
const groupThousands = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);

const gradientText: React.CSSProperties = {
  background: "linear-gradient(170deg, #6a9dff 0%, #2452e6 85%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const Stat: React.FC<{
  t: number;
  at: number;
  index: number;
  value: string;
  unit?: string;
  label: string;
  caption: string;
}> = ({ t, at, index, value, unit, label, caption }) => {
  const p = springAt(t, at, springs.pop);
  const tilt = (1 - index) * 9;
  return (
    <div style={{ width: 560, height: 330, perspective: 2000 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: clamp01(p * 2),
          transform: `translateY(${lerp(110, index === 1 ? -12 : 0, p)}px) rotateY(${tilt}deg) rotateX(${lerp(16, 2, p)}deg) scale(${lerp(0.9, 1, p)})`,
        }}
      >
        <Glass blur={0} radius={46} style={{ width: "100%", height: "100%", padding: "30px 40px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap" }}>
            <span style={{ ...display(138, 700), ...gradientText, fontVariantNumeric: "tabular-nums", paddingRight: 6 }}>
              {value}
            </span>
            {unit ? <span style={{ ...display(60, 660), color: color.blue }}>{unit}</span> : null}
          </div>
          <div style={{ ...body(40, 640), color: color.ink, marginTop: 8 }}>{label}</div>
          <div style={{ ...body(27, 480), color: color.inkMute, marginTop: 8, whiteSpace: "nowrap" }}>{caption}</div>
        </Glass>
      </div>
    </div>
  );
};

const Stats: React.FC<{ t: number }> = ({ t }) => {
  const [a, b, c] = C.stats;
  const count = (at: number) => tween(t, at + 0.05, 0.9, ease.out);
  const head = tween(t, 0.05, 0.7, ease.out);
  const bar = tween(t, C.compare + 0.15, C.compareHit - C.compare - 0.15, ease.inOut);
  const rows = tween(t, C.compare, 0.5, ease.out);
  const hit = springAt(t, C.compareHit, springs.pop);
  const BAR_X = 470;
  const BAR_W = 900;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 74,
          textAlign: "center",
          ...display(76, 680),
          color: color.ink,
          opacity: tween(t, 0.05, 0.35, ease.linear),
          transform: `translateY(${lerp(40, 0, head)}px)`,
          filter: head < 0.999 ? `blur(${lerp(12, 0, head)}px)` : undefined,
        }}
      >
        Duo целиком написали <span style={{ color: color.blue }}>ИИ-агенты</span>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 232, display: "flex", justifyContent: "center", gap: 40 }}>
        <Stat
          t={t}
          at={a}
          index={0}
          value={groupThousands(Math.round(count(a) * LINES_OF_CODE))}
          label="строк кода"
          caption="приложение, тесты и деплой"
        />
        <Stat
          t={t}
          at={b}
          index={1}
          value={(count(b) * HOURS).toFixed(1).replace(".", ",")}
          unit="часа"
          label="разработки"
          caption="от первого коммита до готовой версии"
        />
        <Stat
          t={t}
          at={c}
          index={2}
          value={String(Math.round(count(c) * AGENTS))}
          label="ИИ-агентов"
          caption="1 строит, 7 тестируют, 1 готовит деплой"
        />
      </div>

      {/* The same project by hand: an estimate, drawn to scale. */}
      <div style={{ position: "absolute", inset: 0, opacity: rows, transform: `translateY(${lerp(40, 0, rows)}px)` }}>
        <div style={{ position: "absolute", left: 0, width: BAR_X - 30, top: 694, textAlign: "right", ...body(38, 600), color: color.ink }}>
          Вручную
          <div style={{ ...body(24, 480), color: color.inkMute }}>оценка</div>
        </div>
        <div
          style={{
            position: "absolute",
            left: BAR_X,
            top: 696,
            width: Math.max(64, BAR_W * bar),
            height: 64,
            borderRadius: 32,
            background: "linear-gradient(180deg, rgba(120,132,165,0.5), rgba(120,132,165,0.34))",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.7), 0 16px 30px -16px rgba(40,50,100,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: BAR_X + Math.max(64, BAR_W * bar) + 24,
            top: 700,
            ...display(50, 660),
            color: color.ink,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {bar < 1 ? `${Math.round(bar * BY_HAND_MID)} ч` : `${BY_HAND} часов`}
        </div>

        <div style={{ position: "absolute", left: 0, width: BAR_X - 30, top: 814, textAlign: "right", ...body(38, 600), color: color.blue }}>
          С агентами
        </div>
        <div
          style={{
            position: "absolute",
            left: BAR_X,
            top: 804,
            width: (BAR_W * HOURS) / BY_HAND_MID,
            height: 64,
            borderRadius: 13,
            background: "linear-gradient(180deg, #5b93ff, #2a5cf0)",
            boxShadow: `0 14px 26px -8px rgba(45,104,250,0.75), inset 0 1.5px 0 rgba(255,255,255,0.5), 0 0 0 ${
              (1 - tween(t, C.compareHit, 0.8)) * hit * 22
            }px rgba(45,104,250,${0.3 * (1 - tween(t, C.compareHit, 0.8))})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: BAR_X + (BAR_W * HOURS) / BY_HAND_MID + 24,
            top: 808,
            ...display(50, 660),
            color: color.blue,
            whiteSpace: "nowrap",
          }}
        >
          3,5 часа
        </div>
      </div>

      {/* Handwritten verdict */}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 846,
          transform: `rotate(-4deg) scale(${lerp(0.7, 1, hit)})`,
          transformOrigin: "0% 50%",
          opacity: clamp01(hit * 2.5),
          fontFamily: font.hand,
          fontSize: 96,
          lineHeight: 1,
          color: color.coral,
          whiteSpace: "nowrap",
        }}
      >
        примерно в 40 раз быстрее
        <HandStroke
          d={strokes.underline}
          viewBox="0 0 600 60"
          width={900}
          height={60}
          progress={tween(t, C.compareHit + 0.3, 0.5, ease.inOut)}
          color={color.coral}
          strokeWidth={7}
          style={{ left: 10, bottom: -52 }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Ending: React.FC<{ t: number }> = ({ t }) => {
  const land = springAt(t, C.logo, springs.hero);
  const glyph = springAt(t, C.logo + 0.15, springs.pop);
  const sweep = tween(t, C.logo + 0.7, 0.9, ease.inOut);
  const word = tween(t, C.logo + 0.35, 0.8, ease.out);
  const tag = tween(t, C.tagline, 0.8, ease.out);
  const sub = tween(t, C.tagline + 0.35, 0.8, ease.out);
  const drift = tween(t, C.logo, DURATION - C.logo, ease.linear);
  const SIZE = 250;
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + drift * 0.035})`, transformOrigin: "960px 500px" }}>
      <Rays t={t} x={960} y={330} opacity={tween(t, C.logo, 1.2, ease.out) * 0.8} />
      <div
        style={{
          position: "absolute",
          left: 960 - SIZE / 2,
          top: 330 - SIZE / 2 + Math.sin(t * 1.5) * 5,
          transform: `scale(${lerp(0.5, 1, land)})`,
          opacity: clamp01(land * 3),
        }}
      >
        <DuoIcon size={SIZE} glyph={glyph} sweep={t >= C.logo + 0.7 ? sweep : -1} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 492,
          textAlign: "center",
          ...display(170, 700),
          color: color.ink,
          opacity: tween(t, C.logo + 0.35, 0.35, ease.linear),
          transform: `translateY(${lerp(50, 0, word)}px)`,
          filter: word < 0.999 ? `blur(${lerp(12, 0, word)}px)` : undefined,
        }}
      >
        Duo
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 712,
          textAlign: "center",
          ...display(66, 620),
          color: color.ink,
          opacity: tween(t, C.tagline, 0.35, ease.linear),
          transform: `translateY(${lerp(40, 0, tag)}px)`,
          filter: tag < 0.999 ? `blur(${lerp(10, 0, tag)}px)` : undefined,
        }}
      >
        Много чатов с одним человеком
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 812,
          textAlign: "center",
          ...body(40, 500),
          color: color.inkSoft,
          opacity: tween(t, C.tagline + 0.35, 0.35, ease.linear),
          transform: `translateY(${lerp(30, 0, sub)}px)`,
          filter: sub < 0.999 ? `blur(${lerp(8, 0, sub)}px)` : undefined,
        }}
      >
        Всё зашифровано на ваших устройствах
      </div>
    </AbsoluteFill>
  );
};

export const Numbers: React.FC = () => {
  const t = useTime();
  const push = tween(t, 0, DURATION, ease.linear);
  return (
    <AbsoluteFill>
      <LightBackground t={t + 18} />
      <Bokeh t={t + 18} mode="light" count={18} seed={12} push={0.2 + push * 0.8} />
      <Beat t={t} start={0} end={C.logo} exit={0.25}>
        <Stats t={t} />
      </Beat>
      {t >= C.logo - 0.05 ? <Ending t={t} /> : null}
      {/* The film ends by dissolving into light. */}
      <AbsoluteFill style={{ background: "#ffffff", opacity: tween(t, C.fade, DURATION - C.fade - 0.05, ease.inOut) }} />
    </AbsoluteFill>
  );
};
