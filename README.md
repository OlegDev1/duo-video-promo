# Duo promo video

A 44-second promo for [Duo](https://github.com/OlegDev1/duo-app), a private
messenger where you keep many separate chats with the same person. Built with
[Remotion](https://www.remotion.dev): 1920×1080, 60 fps, with synthesized music
and sound design. All on-screen text is in Russian.

## Render

You need Node.js 20 or newer. ffmpeg comes with Remotion.

```bash
npm ci
npx remotion render DuoPromo out/duo-promo.mp4
```

That is the exact command for the final file. Remotion downloads its own
headless Chrome on the first run. If the machine has no access to that download
but has Chrome installed, point to it:

```bash
npx remotion render DuoPromo out/duo-promo.mp4 --browser-executable=/usr/bin/google-chrome
```

The render takes about 20 minutes on 2 CPU cores. Everything it needs (fonts,
grain texture, soundtrack) is committed in `public/`, so a clean clone renders
without the network apart from `npm ci`.

Other commands:

| Command | What it does |
| --- | --- |
| `npx remotion studio` | Open the project in the Remotion preview |
| `python3 audio/synth.py` | Regenerate `public/audio/soundtrack.wav` (needs numpy and scipy) |
| `scripts/look.sh 3 0.5 1.0 7.5 16.4` | Render stills at the given seconds into `out/sheet.jpg` (3 columns, half size) |
| `npm run typecheck` | Type-check the project |

## How it is built

| Path | What's inside |
| --- | --- |
| `src/timeline.json` | The edit: scene boundaries and every cue, **in seconds**. The video and the audio script both read it. |
| `src/motion.ts` | The motion system: the easing curves and springs every animation uses, all time-based. |
| `src/theme.ts`, `src/fonts.ts` | Colours, type styles, bundled fonts (Inter, Caveat, JetBrains Mono). |
| `src/components/` | Backgrounds, bokeh, liquid glass, the Duo icon, handwritten strokes, the shared scene beat. |
| `src/scenes/` | `Hook`, `Birth`, `Reveal`, `Features`, `Numbers`: one file per scene. |
| `audio/synth.py` | Synthesizes the music and all sound effects with numpy. No samples are used. |
| `CHECKPOINT.md` | The brief, the facts and numbers with their sources, and the status of each step. |

### Changing the frame rate or the timing

All timing is in seconds, so the frame rate is one number: set `fps` in
`src/timeline.json` (for example to 30) and render again. To move a cue, change
it in `src/timeline.json`, then run `python3 audio/synth.py` so the sound
follows the picture.

### Changing a number

The figures shown in the last scene are constants at the top of
`src/scenes/Numbers.tsx`. Where each one comes from is written in
[CHECKPOINT.md](CHECKPOINT.md).

## Scenes

| # | Scene | Time |
| --- | --- | --- |
| 1 | Hook: one person, dozens of topics, only one chat | 0–6 s |
| 2 | The birth of Duo: AI agents carve one form together | 6–16 s |
| 3 | Duo appears | 16–22 s |
| 4 | Features: many chats, data in each chat, encryption on the device | 22–34 s |
| 5 | Numbers and ending | 34–44 s |

## Licences

Fonts in `public/fonts` are under the SIL Open Font License (licence files are
next to them). Remotion has its own
[licence](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md): free
for individuals and small teams, paid for larger companies.
