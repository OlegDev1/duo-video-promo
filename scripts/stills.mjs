// Render still frames for a visual check, bundling the project only once.
// Usage: node scripts/stills.mjs <seconds> [<seconds> ...] [--scale=0.5]
// Writes out/stills/t-<seconds>.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const scaleArg = args.find((a) => a.startsWith("--scale="));
const scale = scaleArg ? Number(scaleArg.split("=")[1]) : 1;
const times = args.filter((a) => !a.startsWith("--")).map(Number);
const browserExecutable = process.env.CHROME ?? "/usr/bin/google-chrome";
const chromiumOptions = { gl: "swangle" };

mkdirSync("out/stills", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "DuoPromo", puppeteerInstance: browser });
for (const s of times) {
  const started = Date.now();
  const output = `out/stills/t-${s.toFixed(2)}.jpg`;
  await renderStill({
    composition,
    serveUrl,
    output,
    frame: Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps)),
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale,
    puppeteerInstance: browser,
  });
  console.log(`${output}  ${Date.now() - started} ms`);
}
await browser.close({ silent: true });
