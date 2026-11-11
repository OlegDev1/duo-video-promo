import React from "react";
import { AbsoluteFill } from "remotion";
import { LightBackground } from "../components/Background";
import { Beat } from "../components/Beat";
import { Bokeh } from "../components/Bokeh";
import { Glass } from "../components/Glass";
import { HandStroke, strokes } from "../components/HandStroke";
import { clamp01, ease, lerp, rand, springAt, springs, tween, useTime } from "../motion";
import { body, color, display, font } from "../theme";
import { timeline } from "../timeline";

const C = timeline.features;
const DURATION = timeline.scenes.features.end - timeline.scenes.features.start;

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

type Topic = { title: string; preview: string; unread: number; from: string; to: string; letter: string };

const TOPICS: Topic[] = [
  { title: "Отпуск в июле", preview: "Билеты уже купила!", unread: 2, from: "#ffb86b", to: "#ff7a59", letter: "О" },
  { title: "Ремонт кухни", preview: "Плитку привезут в среду", unread: 0, from: "#7fdcae", to: "#2fb37a", letter: "Р" },
  { title: "Счета и документы", preview: "Отправил договор", unread: 1, from: "#b9a6ff", to: "#7a5cff", letter: "С" },
  { title: "Идеи подарков", preview: "Может, велосипед?", unread: 0, from: "#ffa3c6", to: "#ff5c93", letter: "И" },
  { title: "Код проекта", preview: "Посмотри новую сборку", unread: 3, from: "#86c8ff", to: "#2d68fa", letter: "К" },
];

const TopicIcon: React.FC<{ topic: Topic; size: number }> = ({ topic, size }) => (
  <div
    style={{
      flex: "none",
      width: size,
      height: size,
      borderRadius: size * 0.3,
      background: `linear-gradient(140deg, ${topic.from}, ${topic.to})`,
      boxShadow: `0 ${size * 0.14}px ${size * 0.3}px -${size * 0.08}px ${topic.to}99, inset 0 1.5px 0 rgba(255,255,255,0.55)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...body(size * 0.48, 700),
      color: "#fff",
    }}
  >
    {topic.letter}
  </div>
);

const Avatar: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      flex: "none",
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(140deg, #ffc48a 0%, #ff7fa3 55%, #a57bff 100%)",
      boxShadow: "0 10px 24px -8px rgba(255,120,150,0.7), inset 0 2px 0 rgba(255,255,255,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...body(size * 0.46, 700),
      color: "#fff",
    }}
  >
    А
  </div>
);

const Headline: React.FC<{
  t: number;
  at: number;
  title: React.ReactNode;
  sub: string;
  align?: "center" | "left";
  size?: number;
}> = ({ t, at, title, sub, align = "center", size = 92 }) => {
  const a = tween(t, at, 0.7, ease.out);
  const b = tween(t, at + 0.15, 0.7, ease.out);
  return (
    <div style={{ textAlign: align }}>
      <div
        style={{
          ...display(size, 680),
          color: color.ink,
          opacity: tween(t, at, 0.35, ease.linear),
          transform: `translateY(${lerp(44, 0, a)}px)`,
          filter: a < 0.999 ? `blur(${lerp(12, 0, a)}px)` : undefined,
        }}
      >
        {title}
      </div>
      <div
        style={{
          ...body(40, 500),
          color: color.inkSoft,
          marginTop: 22,
          opacity: tween(t, at + 0.15, 0.35, ease.linear),
          transform: `translateY(${lerp(30, 0, b)}px)`,
          filter: b < 0.999 ? `blur(${lerp(8, 0, b)}px)` : undefined,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

const bubble = (mine: boolean): React.CSSProperties => ({
  display: "inline-block",
  padding: "14px 22px",
  borderRadius: 26,
  ...(mine
    ? {
        background: "linear-gradient(180deg, #4d86ff 0%, #2d68fa 100%)",
        color: "#fff",
        borderBottomRightRadius: 8,
        boxShadow: "0 14px 28px -12px rgba(45,104,250,0.65), inset 0 1.5px 0 rgba(255,255,255,0.35)",
      }
    : {
        background: color.bubbleIn,
        color: color.ink,
        borderBottomLeftRadius: 8,
        boxShadow: "0 10px 22px -14px rgba(40,50,90,0.4), inset 0 1.5px 0 rgba(255,255,255,0.8)",
      }),
  ...body(30, 500),
});

/** A message that pops in from its corner. */
const Pop: React.FC<{ t: number; at: number; mine?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t,
  at,
  mine = false,
  children,
  style,
}) => {
  const p = springAt(t, at, springs.pop);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        opacity: clamp01(p * 2),
        transform: `translateY(${lerp(26, 0, p)}px) scale(${lerp(0.7, 1, p)})`,
        transformOrigin: mine ? "100% 100%" : "0% 100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Many chats with one person
// ---------------------------------------------------------------------------

const Chats: React.FC<{ t: number }> = ({ t }) => {
  const panel = springAt(t, C.chats + 0.1, springs.smooth);
  const note = tween(t, C.note, 0.5, ease.inOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, top: 318, width: 960 }}>
        <Headline
          t={t}
          at={C.chats + 0.05}
          align="left"
          size={104}
          title={
            <>
              Много чатов
              <br />
              <span style={{ color: color.blue }}>с одним человеком</span>
            </>
          }
          sub="У каждой темы — свой чат. Ничего не теряется."
        />
      </div>

      {/* The chat list, tilted in depth */}
      <div style={{ position: "absolute", left: 1150, top: 120, width: 640, height: 840, perspective: 2200 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: `rotateY(${lerp(-34, -13, panel)}deg) rotateX(${lerp(10, 4, panel)}deg) translateY(${lerp(80, 0, panel)}px)`,
            opacity: clamp01(panel * 2),
          }}
        >
          <Glass blur={0} radius={48} style={{ width: "100%", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "34px 36px 26px" }}>
              <Avatar size={88} />
              <div>
                <div style={{ ...body(46, 680), color: color.ink }}>Аня</div>
                <div style={{ ...body(26, 520), color: "#2f9e66", marginTop: 2 }}>в сети</div>
              </div>
            </div>
            <div style={{ height: 1.5, margin: "0 36px", background: "rgba(20,30,70,0.08)" }} />
          </Glass>
          {TOPICS.map((topic, i) => {
            const p = springAt(t, C.chatItems[i], springs.pop);
            const float = Math.sin(t * 1.4 + i * 1.1) * 3;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: -34,
                  top: 172 + i * 128,
                  width: 708,
                  opacity: clamp01(p * 2.2),
                  transform: `translateZ(${lerp(240, 46 + i * 5, p)}px) translateX(${lerp(160, 0, p)}px) translateY(${float}px)`,
                }}
              >
                <Glass blur={0} radius={30} style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: 22 }}>
                  <TopicIcon topic={topic} size={72} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...body(34, 640), color: color.ink, whiteSpace: "nowrap" }}>{topic.title}</div>
                    <div style={{ ...body(26, 480), color: color.inkMute, whiteSpace: "nowrap", marginTop: 2 }}>
                      {topic.preview}
                    </div>
                  </div>
                  {topic.unread > 0 ? (
                    <div
                      style={{
                        flex: "none",
                        minWidth: 44,
                        height: 44,
                        borderRadius: 22,
                        background: "linear-gradient(180deg, #4d86ff, #2d68fa)",
                        boxShadow: "0 8px 18px -6px rgba(45,104,250,0.7)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...body(25, 680),
                        transform: `scale(${springAt(t, C.chatItems[i] + 0.2, springs.pop)})`,
                      }}
                    >
                      {topic.unread}
                    </div>
                  ) : null}
                </Glass>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handwritten note pointing at the person */}
      <div
        style={{
          position: "absolute",
          left: 830,
          top: 150,
          fontFamily: font.hand,
          fontSize: 64,
          lineHeight: 1,
          color: color.blue,
          transform: "rotate(-5deg)",
          opacity: tween(t, C.note, 0.25, ease.linear),
          clipPath: `inset(-20% ${lerp(100, -10, note)}% -20% -5%)`,
          whiteSpace: "nowrap",
        }}
      >
        один человек
      </div>
      <HandStroke
        d="M10 20 C 60 70, 120 78, 176 52 M 150 34 L 180 50 L 158 78"
        viewBox="0 0 200 100"
        width={150}
        height={75}
        progress={tween(t, C.note + 0.35, 0.4, ease.inOut)}
        color={color.blue}
        strokeWidth={6}
        style={{ left: 1020, top: 214 }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 2. Different data in each chat
// ---------------------------------------------------------------------------

const Pane: React.FC<{
  t: number;
  index: number;
  topic: Topic;
  children: React.ReactNode;
}> = ({ t, index, topic, children }) => {
  const p = springAt(t, C.data + 0.15 + index * 0.1, springs.smooth);
  const tilt = (1 - index) * 13;
  return (
    <div style={{ width: 530, height: 500, perspective: 2000 }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: clamp01(p * 2),
          transform: `translateY(${lerp(120, index === 1 ? -14 : 0, p)}px) rotateY(${tilt}deg) rotateX(${lerp(14, 2, p)}deg) translateZ(${index === 1 ? 30 : 0}px)`,
        }}
      >
        <Glass blur={0} radius={44} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 30px 22px" }}>
            <TopicIcon topic={topic} size={58} />
            <div style={{ ...body(32, 650), color: color.ink, whiteSpace: "nowrap" }}>{topic.title}</div>
          </div>
          <div style={{ height: 1.5, margin: "0 30px", background: "rgba(20,30,70,0.08)" }} />
          <div style={{ padding: "26px 28px", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        </Glass>
      </div>
    </div>
  );
};

/** A stand-in holiday photo painted with gradients: sky, sun and sea. */
const Photo: React.FC = () => (
  <div
    style={{
      position: "relative",
      width: 430,
      height: 262,
      borderRadius: 24,
      borderBottomRightRadius: 8,
      overflow: "hidden",
      background: "linear-gradient(180deg, #5f7bff 0%, #a98bff 32%, #ff9d8a 58%, #ffcf8a 70%)",
      boxShadow: "0 18px 34px -14px rgba(60,70,160,0.6), inset 0 0 0 3px rgba(255,255,255,0.7)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 236,
        top: 96,
        width: 86,
        height: 86,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fffbe6 0%, #ffe9a8 55%, rgba(255,220,150,0) 72%)",
        boxShadow: "0 0 60px 26px rgba(255,236,180,0.55)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 82,
        background: "linear-gradient(180deg, #3f6fe0 0%, #2a4fb6 100%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 214,
        bottom: 0,
        width: 130,
        height: 82,
        background: "linear-gradient(180deg, rgba(255,230,170,0.85), rgba(255,230,170,0))",
        filter: "blur(7px)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -40,
        bottom: 60,
        width: 260,
        height: 70,
        borderRadius: "50%",
        background: "#28407f",
      }}
    />
  </div>
);

const Data: React.FC<{ t: number }> = ({ t }) => {
  const [a, b, c] = C.dataItems;
  const upload = tween(t, c + 0.25, 0.9, ease.inOut);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84 }}>
        <Headline
          t={t}
          at={C.data + 0.05}
          title={
            <>
              В каждом чате — <span style={{ color: color.blue }}>свои данные</span>
            </>
          }
          sub="Текст, код, фото и файлы до 50 МБ"
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 356,
          display: "flex",
          justifyContent: "center",
          gap: 44,
          transform: "scale(1.07)",
          transformOrigin: "50% 0%",
        }}
      >
        <Pane t={t} index={0} topic={TOPICS[0]}>
          <Pop t={t} at={a} mine>
            <Photo />
          </Pop>
          <Pop t={t} at={a + 0.7}>
            <div style={bubble(false)}>Вот это вид!</div>
          </Pop>
        </Pane>
        <Pane t={t} index={1} topic={TOPICS[4]}>
          <Pop t={t} at={C.data + 0.5}>
            <div style={bubble(false)}>Как получаем ключ?</div>
          </Pop>
          <Pop t={t} at={b} mine>
            <div
              style={{
                width: 450,
                borderRadius: 24,
                borderBottomRightRadius: 8,
                background: "linear-gradient(180deg, #4d86ff 0%, #2d68fa 100%)",
                padding: 12,
                boxShadow: "0 18px 34px -14px rgba(45,104,250,0.7), inset 0 1.5px 0 rgba(255,255,255,0.35)",
              }}
            >
              <div
                style={{
                  borderRadius: 16,
                  background: "rgba(8,16,60,0.42)",
                  padding: "16px 18px 18px",
                  fontFamily: font.mono,
                  fontSize: 25,
                  lineHeight: 1.5,
                  color: "#eaf0ff",
                  whiteSpace: "pre",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, ...body(20, 560) }}>
                  <span style={{ opacity: 0.7 }}>ts</span>
                  <span
                    style={{
                      padding: "2px 12px",
                      borderRadius: 10,
                      background: `rgba(255,255,255,${0.16 + Math.sin(clamp01((t - b - 0.9) / 0.4) * Math.PI) * 0.3})`,
                    }}
                  >
                    {t > b + 1.1 ? "Скопировано" : "Копировать"}
                  </span>
                </div>
                <span style={{ color: "#ffd08a" }}>const</span> key = <span style={{ color: "#ffd08a" }}>await</span>
                {"\n"}
                {"  "}
                <span style={{ color: "#a8f0d0" }}>deriveKey</span>(phrase);
              </div>
            </div>
          </Pop>
        </Pane>
        <Pane t={t} index={2} topic={TOPICS[2]}>
          <Pop t={t} at={c} mine>
            <div
              style={{
                width: 450,
                borderRadius: 24,
                borderBottomRightRadius: 8,
                background: "linear-gradient(180deg, #4d86ff 0%, #2d68fa 100%)",
                padding: "18px 20px",
                color: "#fff",
                boxShadow: "0 18px 34px -14px rgba(45,104,250,0.7), inset 0 1.5px 0 rgba(255,255,255,0.35)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    flex: "none",
                    width: 62,
                    height: 62,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width={34} height={38} viewBox="0 0 34 38">
                    <path
                      d="M5 2 H21 L31 12 V34 A2 2 0 0 1 29 36 H5 A2 2 0 0 1 3 34 V4 A2 2 0 0 1 5 2 Z M21 2 V12 H31"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={3}
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div style={{ ...body(29, 640) }}>Договор.pdf</div>
                  <div style={{ ...body(23, 480), opacity: 0.82, marginTop: 2 }}>
                    {upload < 1 ? `${(upload * 18.4).toFixed(1).replace(".", ",")} из 18,4 МБ` : "18,4 МБ · отправлено"}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                <div style={{ width: `${upload * 100}%`, height: "100%", borderRadius: 4, background: "#fff" }} />
              </div>
            </div>
          </Pop>
          <Pop t={t} at={c + 1.35}>
            <div style={bubble(false)}>Получил, спасибо</div>
          </Pop>
        </Pane>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 3. Encryption on the device
// ---------------------------------------------------------------------------

const PLAIN = "Встретимся в 19:00";
const HEX = "0123456789abcdef";

/** Text that turns into ciphertext, left to right, as `amount` goes 0 → 1. */
const scrambled = (amount: number, t: number, seed: number): string =>
  PLAIN.split("")
    .map((ch, i) => {
      const edge = amount * (PLAIN.length + 3) - i;
      if (edge <= 0) return ch;
      const flicker = edge < 3 ? Math.floor(t * 30) : 0;
      return HEX[Math.floor(rand(seed + i * 7 + flicker * 13) * 16)];
    })
    .join("");

const cipherLine = (seed: number, length: number): string =>
  Array.from({ length }, (_, i) => HEX[Math.floor(rand(seed * 31 + i * 3) * 16)]).join("");

const Lock: React.FC<{ closed: number; size: number }> = ({ closed, size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
    <g transform={`translate(0 ${lerp(-13, 0, closed)})`}>
      <path
        d="M31 46 V33 A19 19 0 0 1 69 33 V46"
        fill="none"
        stroke="#fff"
        strokeWidth={10}
        strokeLinecap="round"
        transform={`rotate(${lerp(-24, 0, closed)} 69 46)`}
      />
    </g>
    <rect x={20} y={44} width={60} height={46} rx={13} fill="#fff" />
    <circle cx={50} cy={64} r={6.5} fill={color.blue} />
    <rect x={47} y={64} width={6} height={13} rx={3} fill={color.blue} />
  </svg>
);

const Crypto: React.FC<{ t: number }> = ({ t }) => {
  const device = springAt(t, C.crypto + 0.15, springs.smooth);
  const server = springAt(t, C.crypto + 0.3, springs.smooth);
  const scramble = tween(t, C.scramble, 0.55, ease.linear);
  const lockPop = springAt(t, C.lock - 0.12, springs.pop);
  const lockClosed = tween(t, C.lock, 0.14, ease.out);
  const travel = tween(t, C.send, C.arrive - C.send, ease.inOut);
  const arrived = springAt(t, C.arrive - 0.05, springs.pop);
  const note = tween(t, C.arrive + 0.15, 0.45, ease.inOut);
  const keyNote = tween(t, C.lock + 0.2, 0.45, ease.inOut);
  const lineY = 668;
  const rowY = 792;
  const x0 = 736;
  const x1 = 1218;
  const packetX = lerp(x0 - 20, x1 + 150, travel);
  const packetY = lerp(lineY, rowY, tween(travel, 0.55, 0.45, ease.inOut));

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 84 }}>
        <Headline
          t={t}
          at={C.crypto + 0.05}
          title={
            <>
              Шифрование — <span style={{ color: color.blue }}>на устройстве</span>
            </>
          }
          sub="Сервер хранит только то, что уже зашифровано"
        />
      </div>

      {/* The wire between device and server */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line
          x1={x0}
          y1={lineY}
          x2={lerp(x0, x1, tween(t, C.crypto + 0.5, 0.6, ease.inOut))}
          y2={lineY}
          stroke="rgba(45,104,250,0.35)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="2 16"
          strokeDashoffset={-t * 60}
        />
      </svg>

      {/* The device */}
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 322,
          width: 400,
          opacity: clamp01(device * 2),
          transform: `translateY(${lerp(100, 0, device)}px) scale(1.16)`,
          transformOrigin: "0% 0%",
        }}
      >
        <Glass radius={54} blur={20} style={{ width: 400, height: 520, padding: "30px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26 }}>
            <Avatar size={62} />
            <div style={{ ...body(34, 660), color: color.ink }}>Аня</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Pop t={t} at={C.crypto + 0.45}>
              <div style={bubble(false)}>Во сколько?</div>
            </Pop>
            <Pop t={t} at={C.message} mine>
              <div style={{ ...bubble(true), fontFamily: scramble > 0.02 ? font.mono : font.sans, fontSize: scramble > 0.02 ? 25 : 28, whiteSpace: "nowrap" }}>
                {scrambled(scramble, t, 11)}
              </div>
            </Pop>
          </div>
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: 24,
              height: 62,
              borderRadius: 31,
              background: "rgba(20,30,70,0.06)",
              boxShadow: "inset 0 0 0 1.5px rgba(20,30,70,0.06)",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              ...body(26, 480),
              color: color.inkMute,
            }}
          >
            Сообщение
          </div>
          {/* The lock closes on the device: nothing leaves it unencrypted. */}
          <div
            style={{
              position: "absolute",
              right: -34,
              bottom: 176,
              width: 92,
              height: 92,
              borderRadius: 30,
              background: "linear-gradient(140deg, #5b93ff, #2a5cf0)",
              boxShadow: `0 18px 34px -10px rgba(42,92,240,0.75), inset 0 2px 0 rgba(255,255,255,0.5), 0 0 0 ${
                lockClosed * (1 - tween(t, C.lock, 0.7)) * 26
              }px rgba(45,104,250,${0.3 * (1 - tween(t, C.lock, 0.7))})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${lockPop * (1 + Math.sin(clamp01((t - C.lock) / 0.3) * Math.PI) * 0.12)})`,
            }}
          >
            <Lock closed={lockClosed} size={58} />
          </div>
        </Glass>
        <div style={{ ...body(30, 580), color: color.inkSoft, textAlign: "center", marginTop: 22 }}>Ваше устройство</div>
      </div>

      {/* The server */}
      <div
        style={{
          position: "absolute",
          left: 1280,
          top: 350,
          width: 440,
          opacity: clamp01(server * 2),
          transform: `translateY(${lerp(100, 0, server)}px) scale(1.14)`,
          transformOrigin: "100% 0%",
        }}
      >
        <Glass radius={44} blur={20} style={{ width: 440, height: 460, padding: "30px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: i === 0 ? color.mint : "rgba(20,30,70,0.16)",
                  boxShadow: i === 0 ? `0 0 ${10 + Math.sin(t * 6) * 5}px ${color.mint}` : undefined,
                }}
              />
            ))}
            <div style={{ ...body(24, 560), color: color.inkMute, marginLeft: "auto", fontFamily: font.mono }}>SQLite</div>
          </div>
          {[0, 1, 2, 3, 4].map((row) => {
            const isNew = row === 4;
            const show = isNew ? arrived : 1;
            return (
              <div
                key={row}
                style={{
                  height: 58,
                  marginBottom: 12,
                  borderRadius: 16,
                  padding: "0 18px",
                  display: "flex",
                  alignItems: "center",
                  background: isNew ? "rgba(45,104,250,0.12)" : "rgba(20,30,70,0.05)",
                  boxShadow: isNew ? "inset 0 0 0 2px rgba(45,104,250,0.5)" : "inset 0 0 0 1.5px rgba(20,30,70,0.05)",
                  fontFamily: font.mono,
                  fontSize: 24,
                  fontWeight: 520,
                  color: isNew ? color.blue : "rgba(40,50,90,0.5)",
                  opacity: clamp01(show * 2),
                  transform: `scale(${lerp(0.8, 1, show)})`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {cipherLine(isNew ? 5 : row + 40, 26)}
              </div>
            );
          })}
        </Glass>
        <div style={{ ...body(30, 580), color: color.inkSoft, textAlign: "center", marginTop: 22 }}>Сервер</div>
      </div>

      {/* The encrypted packet on its way */}
      {travel > 0 && travel < 1 ? (
        <div
          style={{
            position: "absolute",
            left: packetX - 150,
            top: packetY - 32,
            width: 300,
            height: 64,
            borderRadius: 32,
            background: "linear-gradient(180deg, #4d86ff 0%, #2d68fa 100%)",
            boxShadow: "0 18px 36px -10px rgba(45,104,250,0.75), inset 0 1.5px 0 rgba(255,255,255,0.4), 0 0 40px rgba(90,140,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: font.mono,
            fontSize: 24,
            fontWeight: 560,
            color: "#fff",
            opacity: Math.min(1, travel * 8, (1 - travel) * 8),
            transform: `scale(${0.9 + Math.sin(travel * Math.PI) * 0.1})`,
          }}
        >
          {cipherLine(5, 16)}
        </div>
      ) : null}

      {/* Handwritten note: what the server can read */}
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 846,
          fontFamily: font.hand,
          fontSize: 58,
          lineHeight: 1,
          color: color.blue,
          transform: "rotate(-4deg)",
          whiteSpace: "nowrap",
          opacity: tween(t, C.arrive + 0.15, 0.25, ease.linear),
          clipPath: `inset(-20% ${lerp(100, -10, note)}% -20% -5%)`,
        }}
      >
        прочитать не может
      </div>
      <HandStroke
        d="M10 80 C 60 84, 120 66, 170 26 M 138 28 L 172 24 L 168 60"
        viewBox="0 0 200 100"
        width={100}
        height={50}
        progress={tween(t, C.arrive + 0.5, 0.35, ease.inOut)}
        color={color.blue}
        strokeWidth={7}
        style={{ left: 1112, top: 798 }}
      />

      {/* Handwritten note: the key never leaves the two devices */}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 500,
          fontFamily: font.hand,
          fontSize: 62,
          lineHeight: 1,
          color: color.blue,
          transform: "rotate(-4deg)",
          whiteSpace: "nowrap",
          opacity: tween(t, C.lock + 0.2, 0.25, ease.linear),
          clipPath: `inset(-20% ${lerp(100, -10, keyNote)}% -20% -5%)`,
        }}
      >
        ключ только у вас
      </div>
      <HandStroke
        d="M190 10 C 150 60, 90 84, 26 80 M 56 58 L 22 80 L 54 98"
        viewBox="0 0 200 100"
        width={110}
        height={55}
        progress={tween(t, C.lock + 0.55, 0.35, ease.inOut)}
        color={color.blue}
        strokeWidth={7}
        style={{ left: 742, top: 572 }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------

const Dots: React.FC<{ t: number }> = ({ t }) => {
  const active = t < C.data ? 0 : t < C.crypto ? 1 : 2;
  const show = tween(t, 0.4, 0.5) * (1 - tween(t, C.out, 0.3, ease.in));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 44,
        display: "flex",
        justifyContent: "center",
        gap: 12,
        opacity: show,
      }}
    >
      {[0, 1, 2].map((i) => {
        const starts = [C.chats, C.data, C.crypto];
        const on = i === active ? tween(t, starts[i], 0.4, ease.out) : i < active ? 1 - tween(t, starts[i + 1], 0.4, ease.out) : 0;
        return (
          <div
            key={i}
            style={{
              width: lerp(12, 44, on),
              height: 12,
              borderRadius: 6,
              background: on > 0.5 ? color.blue : "rgba(20,30,70,0.16)",
            }}
          />
        );
      })}
    </div>
  );
};

export const Features: React.FC = () => {
  const t = useTime();
  const push = tween(t, 0, DURATION, ease.linear);
  return (
    <AbsoluteFill>
      <LightBackground t={t + 6} />
      <Bokeh t={t + 6} mode="light" count={18} seed={8} push={0.2 + push * 0.8} />
      <Beat t={t} start={C.chats} end={C.data} exit={0.22}>
        <Chats t={t} />
      </Beat>
      <Beat t={t} start={C.data} end={C.crypto} exit={0.22}>
        <Data t={t} />
      </Beat>
      <Beat t={t} start={C.crypto} end={DURATION + 0.02} exit={DURATION - C.out}>
        <Crypto t={t} />
      </Beat>
      <Dots t={t} />
    </AbsoluteFill>
  );
};
