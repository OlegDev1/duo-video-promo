import data from "./timeline.json";

// Single source of truth for the edit. Every value is in seconds, so the frame
// rate can change without touching the scenes. The audio script reads the same
// JSON file, which keeps sound and picture in sync.
export const timeline = data;
export const FPS = data.fps;
export const WIDTH = data.width;
export const HEIGHT = data.height;
export const TOTAL_SECONDS = data.scenes.numbers.end;

/** Seconds to a whole number of frames at the given frame rate. */
export const toFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);
