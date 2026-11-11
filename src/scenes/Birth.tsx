import React from "react";
import { AbsoluteFill } from "remotion";
import { DarkBackground } from "../components/Background";
import { Bokeh } from "../components/Bokeh";
import { Glass } from "../components/Glass";
import { strokes } from "../components/HandStroke";
import { clamp01, ease, lerp, rand, springAt, springs, tween, useTime } from "../motion";
import { body, color, display, font } from "../theme";
import { timeline } from "../timeline";

const C = timeline.birth;
const DURATION = timeline.scenes.birth.end - timeline.scenes.birth.start;

// The stage: every agent sits on an ellipse around the thing being built.
const CX = 960;
const CY = 480;
const RX = 560;
const RY = 330;
const FORM_R = 150;

const onEllipse = (deg: number): { x: number; y: number } => ({
  x: CX + RX * Math.cos((deg * Math.PI) / 180),
  y: CY + RY * Math.sin((deg * Math.PI) / 180),
});

type Agent = {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Seconds: when the agent appears, and when its work is confirmed. */
  at: number;
  done: number;
  rgb: string;
  side: "right" | "left" | "below";
  radius: number;
  /** Does the coordinator hand work to this agent with a visible line? */
  dispatched: boolean;
};

const BLUE = "96,150,255";
const VIOLET = "168,140,255";
const CYAN = "92,214,255";
const MINT = "88,226,170";

// Who tested what comes from docs/progress.md in the Duo repository.
const TESTER_LABELS = [
  "Бэкенд: функции",
  "Бэкенд: безопасность",
  "Фронтенд: безопасность",
  "Файлы и фото",
  "Уведомления",
  "Интерфейс",
  "Чаты и сообщения",
];
const TESTER_ANGLES = [-66, -44, -22, 0, 22, 44, 66];

const COORDINATOR: Agent = {
  id: "coordinator",
  label: "Координатор",
  x: CX,
  y: 150,
  at: C.coordinator,
  done: -1,
  rgb: VIOLET,
  side: "left",
  radius: 40,
  dispatched: false,
};

const DEVELOPER: Agent = {
  id: "developer",
  label: "Разработчик",
  ...onEllipse(180),
  at: C.developer,
  done: -1,
  rgb: BLUE,
  side: "below",
  radius: 44,
  dispatched: true,
};

const TESTERS: Agent[] = TESTER_LABELS.map((label, i) => ({
  id: `tester${i}`,
  label,
  ...onEllipse(TESTER_ANGLES[i]),
  at: C.testers[i],
  done: C.testers[i] + 0.85,
  rgb: CYAN,
  side: "right" as const,
  radius: 30,
  dispatched: true,
}));

const DEPLOY: Agent = {
  id: "deploy",
  label: "Скрипт деплоя",
  ...onEllipse(142),
  at: C.deploy,
  done: C.deployOk,
  rgb: VIOLET,
  side: "below",
  radius: 34,
  dispatched: true,
};

const FINAL: Agent = {
  id: "final",
  label: "Финальный тест",
  ...onEllipse(218),
  at: C.finalTest,
  done: C.finalOk,
  rgb: MINT,
  side: "left",
  radius: 34,
  dispatched: true,
};

const AGENTS: Agent[] = [COORDINATOR, DEVELOPER, ...TESTERS, DEPLOY, FINAL];

// ---------------------------------------------------------------------------
// The form: a rough crystal that every agent helps to carve into the smooth
// rounded square of the future icon.
// ---------------------------------------------------------------------------

const ROUGH_N = 13;
const ROUGH: Array<{ a: number; r: number }> = Array.from({ length: ROUGH_N }, (_, k) => ({
  a: ((k + (rand(k + 3) - 0.5) * 0.7) / ROUGH_N) * Math.PI * 2,
  r: 0.62 + rand(k + 11) * 0.62,
}));

/** Radius of the rough polygon along the ray at angle `a` (0..2π). */
const roughRadius = (a: number): number => {
  for (let k = 0; k < ROUGH_N; k++) {
    const p = ROUGH[k];
    const q = ROUGH[(k + 1) % ROUGH_N];
    const a0 = p.a;
    let a1 = q.a;
    let aa = a;
    if (a1 < a0) a1 += Math.PI * 2;
    if (aa < a0) aa += Math.PI * 2;
    if (aa >= a0 && aa <= a1) {
      const px = Math.cos(p.a) * p.r;
      const py = Math.sin(p.a) * p.r;
      const ex = Math.cos(q.a) * q.r - px;
      const ey = Math.sin(q.a) * q.r - py;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      return (px * ey - py * ex) / (dx * ey - dy * ex);
    }
  }
  return 1;
};

/** Radius of the icon's rounded square (a superellipse) along the same ray. */
const squircleRadius = (a: number): number => {
  const n = 5;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
};

const formPath = (refine: number, radius: number): string => {
  const steps = 144;
  let d = "";
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = lerp(roughRadius(a), squircleRadius(a), refine) * radius;
    d += `${i === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  }
  return `${d}Z`;
};

// Every confirmed piece of work smooths the form a little more.
const REFINE_STEPS: Array<{ at: number; amount: number }> = [
  ...C.testers.map((at) => ({ at: at + 0.15, amount: 0.095 })),
  { at: C.wholeApp, amount: 0.16 },
  { at: C.deploy + 0.15, amount: 0.07 },
  { at: C.finalTest + 0.3, amount: 0.105 },
];

const refineAt = (t: number): number =>
  clamp01(REFINE_STEPS.reduce((sum, s) => sum + s.amount * tween(t, s.at, 0.35, ease.out), 0));

// Moments when a beam lands on the form and chips fly off.
const HITS: Array<{ at: number; from: { x: number; y: number }; rgb: string }> = [
  ...TESTERS.map((a) => ({ at: a.at + 0.15, from: a, rgb: a.rgb })),
  ...TESTERS.map((a) => ({ at: C.wholeApp, from: a, rgb: MINT })),
  { at: C.deploy + 0.15, from: DEPLOY, rgb: DEPLOY.rgb },
  { at: C.finalTest + 0.3, from: FINAL, rgb: FINAL.rgb },
];

const Chips: React.FC<{ t: number }> = ({ t }) => (
  <>
    {HITS.map((hit, h) => {
      const age = t - hit.at;
      if (age < 0 || age > 0.8) return null;
      const base = Math.atan2(hit.from.y - CY, hit.from.x - CX);
      return Array.from({ length: 6 }, (_, k) => {
        const seed = h * 10 + k;
        const a = base + (rand(seed) - 0.5) * 1.5;
        const speed = 160 + rand(seed + 1) * 260;
        const dist = FORM_R * 0.95 + speed * (1 - Math.pow(1 - age / 0.8, 3)) * 0.8;
        const size = 5 + rand(seed + 2) * 9;
        return (
          <div
            key={`${h}-${k}`}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * dist - size / 2,
              top: CY + Math.sin(a) * dist - size / 2 + age * age * 120,
              width: size,
              height: size,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 70%)",
              background: `rgba(${hit.rgb}, 1)`,
              opacity: (1 - age / 0.8) * 0.95,
              transform: `rotate(${age * 600 * (rand(seed + 3) - 0.5)}deg)`,
              boxShadow: `0 0 12px rgba(${hit.rgb}, 0.9)`,
            }}
          />
        );
      });
    })}
  </>
);

const Form: React.FC<{ t: number; converge: number }> = ({ t, converge }) => {
  const grow = springAt(t, C.developer + 0.1, springs.smooth);
  if (grow <= 0) return null;
  const refine = refineAt(t);
  // A hit makes the form flinch, like stone under a chisel.
  const flinch = HITS.reduce((m, h) => {
    const age = t - h.at;
    return age >= 0 && age < 0.3 ? Math.max(m, (1 - age / 0.3) * 0.035) : m;
  }, 0);
  const pulse = 1 + flinch + converge * 0.25;
  const radius = FORM_R * lerp(0.2, 1, grow) * pulse;
  const rot = (1 - ease.out(refine)) * 64 + Math.sin(t * 1.3) * 5 * (1 - refine) + (1 - grow) * -90;
  const d = formPath(refine, radius);
  const glow = 0.45 + refine * 0.4 + converge * 0.6;
  return (
    <svg
      width={800}
      height={800}
      viewBox="-400 -400 800 800"
      style={{
        position: "absolute",
        left: CX - 400,
        top: CY - 400,
        overflow: "visible",
        filter: `drop-shadow(0 0 ${30 + refine * 30}px rgba(70,120,255,${glow})) drop-shadow(0 0 ${
          90 + converge * 120
        }px rgba(90,140,255,${glow * 0.6}))`,
      }}
    >
      <defs>
        <linearGradient id="formFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fa0ff" />
          <stop offset="1" stopColor="#2452e6" />
        </linearGradient>
        <radialGradient id="formShine" cx="0.3" cy="0.12" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="formClip">
          <path d={d} />
        </clipPath>
      </defs>
      <g transform={`rotate(${rot})`}>
        <path d={d} fill="url(#formFill)" fillOpacity={lerp(0.22, 1, refine)} />
        {/* Facets of the uncut crystal. They fade as the form gets smooth. */}
        <g clipPath="url(#formClip)" opacity={(1 - refine) * 0.9}>
          {ROUGH.map((p, k) => {
            const q = ROUGH[(k + 4) % ROUGH_N];
            return (
              <g key={k}>
                <line
                  x1={0}
                  y1={0}
                  x2={Math.cos(p.a) * radius * 1.4}
                  y2={Math.sin(p.a) * radius * 1.4}
                  stroke="rgba(190,214,255,0.5)"
                  strokeWidth={1.2}
                />
                <polygon
                  points={`0,0 ${Math.cos(p.a) * radius * 1.4},${Math.sin(p.a) * radius * 1.4} ${
                    Math.cos(q.a) * radius * 1.4
                  },${Math.sin(q.a) * radius * 1.4}`}
                  fill={`rgba(120,170,255,${0.05 + rand(k) * 0.1})`}
                />
              </g>
            );
          })}
        </g>
        <path d={d} fill="url(#formShine)" opacity={0.25 + refine * 0.75} />
        <path
          d={d}
          fill="none"
          stroke="rgba(214,228,255,0.95)"
          strokeWidth={lerp(2.6, 1.4, refine)}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Agents, the lines between them and the beams they fire at the form.
// ---------------------------------------------------------------------------

const agentPos = (a: Agent, t: number, converge: number): { x: number; y: number } => {
  const i = AGENTS.indexOf(a);
  const fx = Math.sin(t * 0.9 + i * 1.9) * 7;
  const fy = Math.cos(t * 0.75 + i * 1.3) * 7;
  return { x: lerp(a.x + fx, CX, converge), y: lerp(a.y + fy, CY, converge) };
};

const Wires: React.FC<{ t: number; converge: number }> = ({ t, converge }) => {
  const fade = 1 - converge;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {AGENTS.filter((a) => a.dispatched).map((a) => {
        // The coordinator hands the work over: a line draws just before the agent appears.
        const draw = tween(t, a.at - 0.25, 0.25, ease.inOut);
        if (draw <= 0) return null;
        const from = agentPos(COORDINATOR, t, converge);
        const to = agentPos(a, t, converge);
        const mx = (from.x + to.x) / 2;
        const my = Math.min(from.y, to.y) - 30;
        const d = `M${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
        const settle = lerp(0.9, 0.22, tween(t, a.at, 0.8, ease.out));
        return (
          <path
            key={a.id}
            d={d}
            fill="none"
            stroke={`rgba(${COORDINATOR.rgb}, ${settle * fade})`}
            strokeWidth={1.6}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - draw}
          />
        );
      })}
      {AGENTS.filter((a) => a.id !== "coordinator").map((a, i) => {
        // Beam from the agent to the form, with light travelling along it.
        const on = tween(t, a.at + 0.05, 0.12, ease.out);
        if (on <= 0) return null;
        const isTester = a.id.startsWith("tester");
        // Testers rest after their part and fire again for the whole-app check.
        const active = isTester
          ? Math.max(
              1 - tween(t, a.done, 0.4, ease.inOut),
              tween(t, C.wholeApp - 0.05, 0.1) * (1 - tween(t, C.wholeApp + 0.6, 0.4, ease.inOut)),
            )
          : a.done > 0
            ? 1 - tween(t, a.done + 0.3, 0.4, ease.inOut) * 0.7
            : 1;
        const p = agentPos(a, t, converge);
        const ang = Math.atan2(CY - p.y, CX - p.x);
        const len = Math.hypot(CX - p.x, CY - p.y);
        const x1 = p.x + Math.cos(ang) * (a.radius + 8);
        const y1 = p.y + Math.sin(ang) * (a.radius + 8);
        const reach = Math.max(0, len - FORM_R * 0.98 - a.radius - 8) * on;
        const x2 = x1 + Math.cos(ang) * reach;
        const y2 = y1 + Math.sin(ang) * reach;
        const dots = a.id === "developer" ? 7 : 3;
        const strength = lerp(0.12, 1, active) * fade;
        return (
          <g key={a.id} opacity={strength}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(${a.rgb},0.5)`} strokeWidth={5} filter="url(#wireGlow)" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`rgba(${a.rgb},0.85)`} strokeWidth={1.6} />
            {Array.from({ length: dots }, (_, k) => {
              const ph = (t * (a.id === "developer" ? 0.9 : 1.5) + k / dots + i * 0.37) % 1;
              return (
                <circle
                  key={k}
                  cx={lerp(x1, x2, ph)}
                  cy={lerp(y1, y2, ph)}
                  r={a.id === "developer" ? 4.5 : 3.6}
                  fill="#ffffff"
                  opacity={Math.sin(ph * Math.PI) * on}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const CheckBadge: React.FC<{ progress: number; size: number }> = ({ progress, size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <circle cx={50} cy={50} r={48} fill={`rgba(${MINT},1)`} opacity={clamp01(progress * 3)} />
    <path
      d={strokes.check}
      fill="none"
      stroke="#04261a"
      strokeWidth={13}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp01(progress * 1.4 - 0.2)}
    />
  </svg>
);

const Orb: React.FC<{ agent: Agent; t: number; converge: number }> = ({ agent, t, converge }) => {
  const pop = springAt(t, agent.at, springs.pop);
  if (pop <= 0) return null;
  const { x, y } = agentPos(agent, t, converge);
  const r = agent.radius;
  const ripple = tween(t, agent.at, 0.7, ease.out);
  const checked = agent.done > 0 ? springAt(t, agent.done, springs.pop) : 0;
  const working = agent.done > 0 ? 1 - tween(t, agent.done, 0.2) : 1;
  const scale = pop * lerp(1, 0.25, converge);
  const labelOpacity = tween(t, agent.at + 0.08, 0.3) * (1 - tween(converge, 0, 0.3, ease.linear));
  const labelStyle: React.CSSProperties =
    agent.side === "right"
      ? { left: x + r + 20, top: y - 18, textAlign: "left" }
      : agent.side === "left"
        ? { right: 1920 - (x - r - 20), top: y - 18, textAlign: "right" }
        : { left: x - 200, width: 400, top: y + r + 16, textAlign: "center" };
  return (
    <>
      {/* Arrival ripple */}
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          border: `2px solid rgba(${agent.rgb}, ${(1 - ripple) * 0.9})`,
          transform: `scale(${1 + ripple * 2.2})`,
        }}
      />
      {/* Spinning arc while the agent works */}
      <svg
        width={r * 2 + 28}
        height={r * 2 + 28}
        viewBox="-50 -50 100 100"
        style={{
          position: "absolute",
          left: x - r - 14,
          top: y - r - 14,
          transform: `rotate(${t * 300}deg) scale(${scale})`,
          opacity: working * 0.9,
        }}
      >
        <circle
          r={47}
          fill="none"
          stroke={`rgba(${agent.rgb},0.95)`}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray="70 225"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          transform: `scale(${scale})`,
          opacity: 1 - tween(converge, 0.55, 0.45, ease.linear),
          background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.98) 0%, rgba(${agent.rgb},0.95) 26%, rgba(${agent.rgb},0.42) 62%, rgba(${agent.rgb},0.12) 100%)`,
          boxShadow: `0 0 ${r}px rgba(${agent.rgb},0.75), 0 0 ${r * 2.6}px rgba(${agent.rgb},0.35), inset 0 -${
            r * 0.2
          }px ${r * 0.4}px rgba(4,8,40,0.45), inset 0 2px 3px rgba(255,255,255,0.75)`,
        }}
      />
      {checked > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x + r * 0.35,
            top: y + r * 0.3,
            transform: `scale(${checked * (1 - converge)})`,
            transformOrigin: "50% 50%",
          }}
        >
          <CheckBadge progress={tween(t, agent.done, 0.35)} size={r * 0.9} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          ...body(27, 560),
          color: "rgba(236,241,255,0.92)",
          whiteSpace: "nowrap",
          opacity: labelOpacity,
          transform: `translateY(${lerp(8, 0, tween(t, agent.at + 0.08, 0.4))}px)`,
          textShadow: "0 2px 18px rgba(0,0,10,0.8)",
          ...labelStyle,
        }}
      >
        {agent.label}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Small pieces: the task card, chips, the virtual devices and the captions.
// ---------------------------------------------------------------------------

const TASK_TEXT = "Сделай мессенджер: много чатов с одним человеком";

const TaskCard: React.FC<{ t: number }> = ({ t }) => {
  if (t > C.coordinator + 0.25) return null;
  const enter = springAt(t, C.task, springs.smooth);
  const typed = Math.round(tween(t, C.typeStart, C.typeEnd - C.typeStart, ease.linear) * TASK_TEXT.length);
  const press = springAt(t, C.typeEnd + 0.03, springs.pop);
  // The card folds into a spark that flies up and becomes the coordinator.
  const fly = tween(t, C.coordinator - 0.22, 0.3, ease.inOut);
  const y = lerp(CY, COORDINATOR.y, fly);
  const caretOn = typed < TASK_TEXT.length || Math.floor(t * 4) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        left: CX - 600,
        top: y - 100,
        width: 1200,
        height: 200,
        transform: `scale(${lerp(0.9, 1, enter) * lerp(1, 0.06, fly)})`,
        opacity: Math.min(1, enter * 1.5) * (1 - tween(fly, 0.75, 0.25, ease.linear)),
        filter: fly > 0.01 ? `blur(${fly * 6}px) brightness(${1 + fly * 3})` : undefined,
      }}
    >
      <Glass tone="dark" radius={44} blur={24} style={{ width: "100%", height: "100%" }}>
        <div style={{ position: "absolute", left: 52, top: 34, ...body(26, 600), color: "rgba(176,196,255,0.75)", letterSpacing: "0.08em" }}>
          ЗАДАЧА
        </div>
        <div style={{ position: "absolute", left: 52, top: 92, ...body(44, 560), color: "#f4f6ff", whiteSpace: "nowrap" }}>
          {TASK_TEXT.slice(0, typed)}
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: 46,
              marginLeft: 4,
              verticalAlign: "-8px",
              borderRadius: 2,
              background: color.blueLight,
              opacity: caretOn ? 1 : 0,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 34,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #6a9dff 0%, #2d68fa 100%)",
            boxShadow: `0 8px 24px rgba(45,104,250,0.6), inset 0 1.5px 0 rgba(255,255,255,0.5), 0 0 ${press * 50}px rgba(110,160,255,${press})`,
            transform: `scale(${1 + Math.sin(clamp01(press) * Math.PI) * 0.18})`,
          }}
        >
          <svg width={60} height={60} viewBox="0 0 60 60">
            <path d="M30 42 V19 M20 28 L30 18 L40 28" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Glass>
    </div>
  );
};

const Chip: React.FC<{
  x: number;
  y: number;
  show: number;
  ok: number;
  children: React.ReactNode;
}> = ({ x, y, show, ok, children }) => (
  <div
    style={{
      position: "absolute",
      left: x - 300,
      width: 600,
      top: y,
      display: "flex",
      justifyContent: "center",
      opacity: show,
      transform: `translateY(${lerp(14, 0, show)}px) scale(${1 + Math.sin(clamp01(ok) * Math.PI) * 0.06})`,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 22px 9px 18px",
        borderRadius: 999,
        background: `rgba(${ok > 0.5 ? "30,70,60" : "20,28,60"},0.72)`,
        boxShadow: `inset 0 0 0 1.5px rgba(${ok > 0.5 ? MINT : "150,175,255"},${ok > 0.5 ? 0.75 : 0.35}), 0 10px 30px rgba(0,0,20,0.5)`,
        fontFamily: font.mono,
        fontSize: 27,
        fontWeight: 560,
        color: ok > 0.5 ? `rgb(${MINT})` : "rgba(226,234,255,0.92)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  </div>
);

const TinyCheck: React.FC<{ progress: number; size?: number }> = ({ progress, size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", flex: "none" }}>
    <path
      d={strokes.check}
      fill="none"
      stroke={`rgb(${MINT})`}
      strokeWidth={15}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp01(progress)}
    />
  </svg>
);

/** A virtual device for the final test: a glass frame with a scan line. */
const Device: React.FC<{
  t: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  label: string;
  converge: number;
}> = ({ t, at, x, y, w, h, radius, label, converge }) => {
  const pop = springAt(t, at, springs.pop);
  if (pop <= 0) return null;
  const scan = tween(t, at + 0.2, 0.55, ease.inOut);
  const ok = tween(t, C.finalOk, 0.3);
  const fade = 1 - tween(converge, 0, 0.5, ease.linear);
  return (
    <div
      style={{
        position: "absolute",
        left: lerp(x, CX, converge) - w / 2,
        top: lerp(y, CY, converge) - h / 2,
        width: w,
        height: h,
        transform: `scale(${pop * lerp(1, 0.2, converge)})`,
        opacity: fade,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
          boxShadow: `inset 0 0 0 2px rgba(${ok > 0.5 ? MINT : "190,208,255"},${0.5 + ok * 0.4}), inset 0 2px 0 rgba(255,255,255,0.3), 0 24px 50px rgba(0,0,20,0.55)`,
          overflow: "hidden",
        }}
      >
        {/* The app, small, on the device screen */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: Math.min(w, h) * 0.42,
            height: Math.min(w, h) * 0.42,
            marginLeft: -Math.min(w, h) * 0.21,
            marginTop: -Math.min(w, h) * 0.21,
            borderRadius: Math.min(w, h) * 0.1,
            background: "linear-gradient(135deg, #6fa0ff, #2452e6)",
            boxShadow: "0 0 24px rgba(80,130,255,0.8)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scan * 100}%`,
            height: 3,
            background: `rgba(${MINT},0.95)`,
            boxShadow: `0 0 18px 4px rgba(${MINT},0.7)`,
            opacity: scan > 0 && scan < 1 ? 1 : 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: `${scan * 100}%`,
            background: `linear-gradient(180deg, rgba(${MINT},0) 0%, rgba(${MINT},0.14) 100%)`,
            opacity: 1 - ok,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: -100,
          right: -100,
          top: h + 12,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          ...body(24, 560),
          color: "rgba(226,234,255,0.9)",
          textShadow: "0 2px 18px rgba(0,0,10,0.8)",
        }}
      >
        {label}
        <TinyCheck progress={tween(t, C.finalOk, 0.3)} size={22} />
      </div>
    </div>
  );
};

const CAPTIONS: Array<{ from: number; to: number; text: string }> = [
  { from: C.task, to: C.coordinator, text: "Я ставлю задачу" },
  { from: C.coordinator, to: C.developer, text: "Координатор составляет план" },
  { from: C.developer, to: C.testers[0], text: "Разработчик начинает строить" },
  { from: C.testers[0], to: C.wholeApp, text: "Тестировщики проверяют бэкенд и фронтенд по частям" },
  { from: C.wholeApp, to: C.deploy, text: "Затем — приложение целиком" },
  { from: C.deploy, to: C.finalTest, text: "Скрипт деплоя на сервер написан и проверен" },
  { from: C.finalTest, to: C.converge + 0.1, text: "Финальный тест на виртуальных устройствах" },
];

const Captions: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CAPTIONS.map((c, i) => {
      if (t < c.from - 0.05 || t > c.to + 0.2) return null;
      const enter = tween(t, c.from, 0.45, ease.out);
      const leave = tween(t, c.to - 0.12, 0.2, ease.in);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 936,
            textAlign: "center",
            ...display(50, 600),
            color: "#f4f6ff",
            opacity: tween(t, c.from, 0.2, ease.linear) * (1 - leave),
            transform: `translateY(${lerp(26, 0, enter) - leave * 18}px)`,
            filter: enter < 0.999 || leave > 0 ? `blur(${lerp(8, 0, enter) + leave * 8}px)` : undefined,
            textShadow: "0 4px 40px rgba(0,0,20,0.9)",
          }}
        >
          {c.text}
        </div>
      );
    })}
  </>
);

export const Birth: React.FC = () => {
  const t = useTime();
  const progress = t / DURATION;
  const converge = tween(t, C.converge, C.flash - C.converge + 0.05, ease.in);
  const bloom = tween(t, C.flash - 0.3, DURATION - C.flash + 0.28, ease.in);
  const tests = Math.round(tween(t, C.testers[0], C.wholeApp - C.testers[0] + 0.1, ease.linear) * 134);
  const testsShow = tween(t, C.testers[0], 0.3) * (1 - tween(converge, 0, 0.4, ease.linear));
  const testsOk = tween(t, C.wholeApp, 0.3);
  const deployShow = tween(t, C.deploy + 0.2, 0.3) * (1 - tween(converge, 0, 0.4, ease.linear));
  const deployOk = tween(t, C.deployOk, 0.3);
  // The whole-app check: a ring of light sweeps out from the form.
  const sweep = tween(t, C.wholeApp, 0.9, ease.out);

  return (
    <AbsoluteFill>
      <DarkBackground t={t + 6} energy={0.25 + progress * 0.75} />
      <Bokeh t={t + 6} mode="dark" count={26} seed={3} push={1.6 + progress * 0.6} />

      <AbsoluteFill style={{ transform: `scale(${1 + progress * 0.05 + converge * 0.08})`, transformOrigin: `${CX}px ${CY}px` }}>
        <Wires t={t} converge={converge} />

        {sweep > 0 && sweep < 1 ? (
          <div
            style={{
              position: "absolute",
              left: CX - FORM_R,
              top: CY - FORM_R,
              width: FORM_R * 2,
              height: FORM_R * 2,
              borderRadius: "50%",
              border: `3px solid rgba(${MINT},${(1 - sweep) * 0.9})`,
              boxShadow: `0 0 40px rgba(${MINT},${(1 - sweep) * 0.6})`,
              transform: `scale(${1 + sweep * 2.6})`,
            }}
          />
        ) : null}

        <Form t={t} converge={converge} />
        <Chips t={t} />

        <Device t={t} at={C.finalTest + 0.1} x={704} y={CY} w={118} h={228} radius={24} label="телефон" converge={converge} />
        <Device t={t} at={C.finalTest + 0.25} x={1262} y={CY} w={250} h={170} radius={18} label="компьютер" converge={converge} />

        {AGENTS.map((a) => (
          <Orb key={a.id} agent={a} t={t} converge={converge} />
        ))}

        <Chip x={CX} y={262} show={testsShow} ok={testsOk}>
          {testsOk > 0.5 ? <TinyCheck progress={tween(t, C.wholeApp, 0.3)} /> : null}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {testsOk > 0.5 ? "134 теста пройдено" : `тесты: ${tests}`}
          </span>
        </Chip>
        <Chip x={CX} y={672} show={deployShow} ok={deployOk}>
          {deployOk > 0.5 ? <TinyCheck progress={tween(t, C.deployOk, 0.3)} /> : null}
          <span>Ubuntu 24.04{deployOk > 0.5 ? " · проверено" : " · проверка…"}</span>
        </Chip>

        <TaskCard t={t} />
      </AbsoluteFill>

      <Captions t={t} />

      {/* Everything collapses into the form, and the form bursts into light. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,255,255,1) 0%, rgba(255,255,255,1) ${
            bloom * 75
          }%, rgba(214,228,255,${0.5 + bloom * 0.5}) ${6 + bloom * 95}%, rgba(170,200,255,0) ${18 + bloom * 150}%)`,
          opacity: clamp01(tween(t, C.flash - 0.3, 0.2, ease.linear)),
        }}
      />
      <AbsoluteFill style={{ background: "#ffffff", opacity: tween(t, C.flash + 0.05, DURATION - C.flash - 0.08, ease.inOut) }} />
    </AbsoluteFill>
  );
};
