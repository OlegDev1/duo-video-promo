# CHECKPOINT

Resume rule: read this file, find the first step that is not `done`, continue
from there. Do not redo finished steps and do not re-read the Duo source repo:
every fact needed is in "Facts" below.

## Task

Promo video for the Duo app (source: `OlegDev1/duo-app`), made with Remotion.

- 40–45 s, 1920×1080, 60 fps (drop to 30 only if the render is too slow).
- Music and sound design, synthesized here. No voiceover, no spoken voice.
- All on-screen text in Russian. Code, comments, commits, docs in English.
- Style: Apple-Keynote feel as a reference only. Light, airy, expensive: depth
  from light, highlights, soft shadows, gloss, liquid glass, blur, parallax.
  No flat template 2D, no cheap 3D. One consistent motion system.
- All timing defined in seconds (`src/timeline.json`), never in frames.
- Project lives in `/home/claude/video-project/`, pushed to
  `OlegDev1/duo-video-promo` after every scene. Final render in `out/`.
- Do not draw other apps' interfaces. Never invent numbers.

Story: 1) Hook ~6 s, 2) Birth of Duo (AI agents) ~10 s, 3) Duo appears ~6 s,
4) Features ~12 s, 5) Numbers and ending ~9 s.

## Facts (collected from README, docs/, git history; verified)

Product (README, docs/decisions.md):
- Private chat for two people on your own server. Several named chats with the
  same person: create, rename, delete, each with its own unread badge; pinned chats.
- Markdown messages with code blocks; photos and files up to 50 MB.
- End-to-end encrypted in the browser: messages, chat titles, file names and
  files. AES-256-GCM, key from a shared secret phrase (PBKDF2, 600,000 rounds).
  The server stores only ciphertext.
- Live updates, typing indicator, read receipts, PWA, push without message text.
- Icon: blue gradient `#5b93ff → #2a5cf0` rounded square (rx 116/512), white
  message bubble glyph plus a 50 % white pill behind it
  (`client/public/icons/favicon.svg`, path copied into `src/components/DuoIcon.tsx`).
- UI colours: accent `#2d68fa`, outgoing bubble `#4d86ff → #2d68fa`,
  incoming bubble `#ececf1`, text `#111114`, sidebar `#f5f5f7`.

Numbers:
- **Lines of code: 15,207** for the first build (TypeScript 13,958 + CSS 159 +
  JS 61 + HTML 45 + shell 805 + deploy configs 179). Counted with `wc -l` on the
  tree of merge `32b6ffc` plus `deploy/` at `55fba22`, i.e. exactly the code
  written on 14 Oct. Markdown, JSON, lock file and images excluded.
  (Today's `main` with later features: 18,029 lines by the same rule.)
- **Development time: about 3.5 hours.** First commit 2026-10-14 21:59 UTC,
  last code commit of the build 23:20 UTC (1 h 21 min), all threads stopped and
  last notes at 2026-10-15 01:25 UTC (docs/progress.md) = 3 h 26 min.
  The owner's estimate was "2–3 hours"; the repo supports 3 h 26 min end to end.
- **Agents: 9** distinct Claude sessions in the commit trailers of the first
  build, matching the thread table in docs/progress.md:
  1 builder (contract, backend, frontend, merging) + 7 testers + 1 deploy.
  A separate coordinator or final tester that made no commits cannot be
  counted from the repo. (14 sessions across the whole history to 20 Oct.)
- **Who tested what** (docs/progress.md): backend functional (6 fixes, 61 tests),
  backend security (5 fixes, 21 tests), frontend security, files and photos,
  push notifications, UI on phone and desktop (12 fixes), chats and messaging
  (6 fixes); VPS setup script tested end to end in clean Ubuntu 24.04
  containers; a two-user run in Chromium with desktop and phone viewports.
- **Tests: 134, all passing** (22 shared + 107 server + 5 client).
- **By hand: 130–150 hours** (owner's estimate, shown as an estimate).
  130/3.5 = 37, 150/3.5 = 43, shown as "≈ 40× faster".
- Pull requests: the repo has none; work was merged from 15 branches.

## Timeline (seconds, 120 BPM, 1 bar = 2 s)

| Scene | Start | End |
| --- | --- | --- |
| 1 Hook | 0 | 6 |
| 2 Birth | 6 | 16 |
| 3 Reveal | 16 | 22 |
| 4 Features | 22 | 34 |
| 5 Numbers + ending | 34 | 44 |

## Steps

| # | Step | Status |
| --- | --- | --- |
| 1 | Facts + CHECKPOINT.md | done |
| 2 | Setup: Remotion, fonts, timeline, motion system, shared components | done |
| 3 | Scene 1: Hook | done |
| 4 | Scene 2: Birth of Duo | done |
| 5 | Scene 3: Duo appears | done |
| 6 | Scene 4: Features | done |
| 7 | Scene 5: Numbers and ending | done |
| 8 | Audio: music + SFX synthesized and synced | todo |
| 9 | Full render to `out/`, checks, README, final push | todo |

## Notes for resuming

- Preview frames: `scripts/look.sh <cols> <scale> <seconds...>` renders stills and
  tiles them into `out/sheet.jpg` (bundles once, about 0.5 s per frame).
- Chrome is at `/usr/bin/google-chrome`; renders need `--browser-executable` (see README).
- Scenes are registered in `src/Video.tsx` (`SCENES` array). Cue times for every
  scene are in `src/timeline.json`, in seconds, local to the scene.
- The dark look (scenes 1–2) and light look (scenes 3–5) are `DarkBackground` and
  `LightBackground` in `src/components/Background.tsx`.
