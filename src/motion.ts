import { Easing, spring, useCurrentFrame, useVideoConfig } from "remotion";

// The motion system. Every animation in the film is built from these few
// curves, and every function takes time in seconds.

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

export const ease = {
  /** Entrances: fast start, long soft landing. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Moves between two resting states. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Exits: slow start, fast leave. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** Gentle camera moves. */
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  linear: (v: number): number => v,
};

/** 0 → 1 between `start` and `start + duration` (seconds), eased. */
export const tween = (
  t: number,
  start: number,
  duration: number,
  easing: (v: number) => number = ease.out,
): number => easing(clamp01((t - start) / duration));

/** 0 → 1 → 0: in from `start`, out before `end`. */
export const inOut = (
  t: number,
  start: number,
  end: number,
  inDur = 0.5,
  outDur = 0.35,
): number => tween(t, start, inDur) * (1 - tween(t, end - outDur, outDur, ease.in));

const SPRING_FPS = 240;

export const springs = {
  /** No overshoot: for large objects and layout moves. */
  smooth: { damping: 200, stiffness: 120, mass: 1 },
  /** A small, quick overshoot: for pops. */
  pop: { damping: 13, stiffness: 170, mass: 0.7 },
  /** Heavier overshoot: for the hero object. */
  hero: { damping: 12, stiffness: 90, mass: 1 },
};

/** Spring that starts at `start` seconds. Independent of the frame rate. */
export const springAt = (
  t: number,
  start: number,
  config: { damping: number; stiffness: number; mass: number } = springs.pop,
): number =>
  t <= start
    ? 0
    : spring({ frame: (t - start) * SPRING_FPS, fps: SPRING_FPS, config });

/** Current time of the enclosing sequence, in seconds. */
export const useTime = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Deterministic pseudo-random number in [0, 1) from a seed. */
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
