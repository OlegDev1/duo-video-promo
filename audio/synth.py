"""Synthesize the soundtrack for the Duo promo: music and sound effects.

Everything is generated from code with numpy, so there are no samples and no
licences to track. Cue times come from src/timeline.json, the same file the
video reads, which keeps sound and picture in sync.

Usage:  python3 audio/synth.py
Output: public/audio/soundtrack.wav  (48 kHz, 16-bit stereo)
        audio/stems/music.wav, audio/stems/sfx.wav  (not committed)
"""

import json
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json"), encoding="utf-8"))

SR = 48000
TOTAL = TL["scenes"]["numbers"]["end"]
N = int(TOTAL * SR)
BEAT = 60.0 / TL["bpm"]
BAR = BEAT * 4
rng = np.random.default_rng(42)

S = {name: scene["start"] for name, scene in TL["scenes"].items()}
HOOK, BIRTH, REVEAL, FEAT, NUM = (TL[k] for k in ("hook", "birth", "reveal", "features", "numbers"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def bus():
    return np.zeros((N + SR * 6, 2))


def add(dst, sig, t0, gain=1.0, pan=0.0):
    """Mix a mono or stereo signal into a stereo bus at t0 seconds."""
    i = int(round(t0 * SR))
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), len(dst) - i)
    if n <= 0:
        return
    if sig.ndim == 1:
        left = np.cos((pan + 1) * np.pi / 4) * gain
        right = np.sin((pan + 1) * np.pi / 4) * gain
        dst[i:i + n, 0] += sig[:n] * left
        dst[i:i + n, 1] += sig[:n] * right
    else:
        dst[i:i + n] += sig[:n] * gain


def env_ad(dur, attack, decay_rate):
    t = tt(dur)
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t * decay_rate)


def fade(sig, fade_in=0.005, fade_out=0.02):
    n_in, n_out = int(fade_in * SR), int(fade_out * SR)
    out = sig.copy()
    if n_in:
        out[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        out[-n_out:] *= np.linspace(1, 0, n_out)
    return out


def lowpass(sig, hz, order=2):
    sos = signal.butter(order, hz, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, sig, axis=0)


def highpass(sig, hz, order=2):
    sos = signal.butter(order, hz, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, sig, axis=0)


def bandpass(sig, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, sig, axis=0)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def swept_noise(dur, f_start, f_end, q=2.2, curve=1.0):
    """Noise through a band-pass filter whose centre glides: the core of a whoosh."""
    x = noise(dur)
    n = len(x)
    freqs = f_start * (f_end / f_start) ** (np.linspace(0, 1, n) ** curve)
    out = np.zeros(n)
    low = band = 0.0
    for i in range(n):  # state-variable filter
        f = 2 * np.sin(np.pi * min(freqs[i], SR / 6.5) / SR)
        high = x[i] - low - band / q
        band += f * high
        low += f * band
        out[i] = band
    return out


# ---------------------------------------------------------------------------
# Instruments
# ---------------------------------------------------------------------------

def pluck(note, dur=0.7, bright=1.0):
    f = midi(note)
    t = tt(dur)
    n_h = max(1, min(22, int(8000 / f)))
    out = np.zeros(len(t))
    for h in range(1, n_h + 1):
        out += (1 / h) * np.exp(-t * (3.0 + h * 2.2 / bright)) * np.sin(2 * np.pi * f * h * t)
    return fade(out * np.minimum(1, t / 0.003), 0, 0.03)


def keys(note, dur=3.2, soft=1.0):
    """A soft felt-piano tone."""
    f = midi(note)
    t = tt(dur)
    out = np.zeros(len(t))
    for h in range(1, 11):
        fh = f * h * np.sqrt(1 + 0.0004 * h * h)
        if fh > 9000:
            break
        out += (1 / h ** (1.3 + 0.5 * soft)) * np.exp(-t * (1.0 + 0.55 * h)) * np.sin(2 * np.pi * fh * t + h)
    thump = lowpass(noise(dur) * np.exp(-t * 90), 900) * 0.25
    return fade((out + thump) * np.minimum(1, t / 0.006), 0, 0.2)


def bell(note, dur=3.0, decay=1.0):
    f = midi(note)
    t = tt(dur)
    partials = [(1, 1.0, 1.6), (2.0, 0.45, 2.4), (3.01, 0.3, 3.4), (4.2, 0.16, 4.6), (5.4, 0.1, 6.0)]
    out = np.zeros(len(t))
    for ratio, amp, d in partials:
        if f * ratio < 12000:
            out += amp * np.exp(-t * d * decay) * np.sin(2 * np.pi * f * ratio * t)
    return fade(out * np.minimum(1, t / 0.004), 0, 0.3)


def pad(notes, dur, cutoff=1800.0, attack=0.6, release=0.9):
    """Warm stereo pad: detuned band-limited saws, one voice per chord note."""
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for note in notes:
        for k, cents in enumerate((-11, -5, 0, 6, 12)):
            f = midi(note) * 2 ** (cents / 1200)
            ph = rng.uniform(0, 2 * np.pi)
            voice = np.zeros(n)
            for h in range(1, int(min(cutoff * 2.2, 9000) / f) + 1):
                voice += (1 / h) / (1 + (h * f / cutoff) ** 2) * np.sin(2 * np.pi * f * h * t + ph * h)
            pan = (k - 2) / 2.5
            out[:, 0] += voice * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += voice * np.sin((pan + 1) * np.pi / 4)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur + release - t) / release))
    return out * env[:, None] / (len(notes) * 2.2)


def bass(note, dur, pulse=False):
    f = midi(note)
    t = tt(dur)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1, t / 0.008) * (np.exp(-t * 5.5) if pulse else 1.0)
    return fade(tone * env, 0, 0.04)


def kick(strength=1.0):
    t = tt(0.4)
    f = 46 + 95 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    click = highpass(noise(0.4), 1800) * np.exp(-t * 320) * 0.18
    return fade((body + click) * strength, 0, 0.05)


def clap():
    t = tt(0.3)
    env = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0.0, 0.011, 0.023)) / 3
    return bandpass(noise(0.3), 900, 3600) * env * np.exp(-t * 6)


def hat(dur=0.07, tone=7500):
    t = tt(dur)
    return highpass(noise(dur), tone) * np.exp(-t * (4.2 / dur))


def impact(depth=1.0, dur=2.2):
    """A soft cinematic hit: a falling sub tone and a breath of air."""
    t = tt(dur)
    f = 34 + 70 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    air = lowpass(noise(dur), 2600) * np.exp(-t * 7) * 0.35
    return fade((sub * depth + air) * np.minimum(1, t / 0.004), 0, 0.3)


def whoosh(dur=0.5, lo=300, hi=5000, peak=0.6):
    """Air rushing past: band-passed noise that swells and falls away."""
    x = swept_noise(dur, lo, hi)
    t = np.linspace(0, 1, len(x))
    env = np.where(t < peak, (t / peak) ** 2.2, ((1 - t) / (1 - peak)) ** 1.6)
    return x * env


def riser(dur=1.5, lo=200, hi=7000):
    x = swept_noise(dur, lo, hi, q=3.0, curve=1.6)
    t = np.linspace(0, 1, len(x))
    tone_f = 220 * (4.0 ** t)
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.12
    return fade((x + tone) * t ** 2.4, 0, 0.012)


def pop(note=74, dur=0.16):
    """A soft bubble pop, tuned to the music."""
    t = tt(dur)
    f = midi(note) * (1 + 0.6 * np.exp(-t * 60))
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26), 0.002, 0.02)


def tick(dur=0.02, tone=3200):
    t = tt(dur)
    return fade((np.sin(2 * np.pi * tone * t) * 0.6 + highpass(noise(dur), 2500) * 0.5) * np.exp(-t * 240), 0.0005, 0.004)


def scribble(dur=0.5):
    """A felt pen on paper: rustling noise that follows the hand's speed."""
    x = bandpass(noise(dur), 1600, 6000)
    t = np.linspace(0, 1, len(x))
    wobble = 0.55 + 0.45 * np.sin(2 * np.pi * (5.5 * t * dur * 2.2 + 0.2)) ** 2
    return fade(x * np.sin(np.pi * t) ** 0.6 * wobble, 0.01, 0.04)


def glitch(dur=0.55):
    """Text turning into ciphertext: a quick stream of tiny digital blips."""
    out = np.zeros(int(dur * SR))
    pos = 0.0
    while pos < dur - 0.03:
        length = rng.uniform(0.012, 0.03)
        f = rng.choice([880, 1175, 1480, 1760, 2349, 2960])
        t = tt(length)
        blip = np.sign(np.sin(2 * np.pi * f * t)) * 0.35 + np.sin(2 * np.pi * f * t) * 0.65
        i = int(pos * SR)
        out[i:i + len(t)] += fade(blip, 0.001, 0.004)[: len(out) - i]
        pos += length + rng.uniform(0.004, 0.018)
    return lowpass(out, 5200)


def lock_click():
    """A lock closing: two small metallic clicks."""
    out = np.zeros(int(0.5 * SR))
    for delay, pitch, gain in ((0.0, 2100, 0.7), (0.07, 1400, 1.0)):
        t = tt(0.3)
        ring = sum(a * np.sin(2 * np.pi * pitch * r * t) * np.exp(-t * d)
                   for r, a, d in ((1, 1, 38), (2.76, 0.5, 55), (5.4, 0.25, 80)))
        body = lowpass(noise(0.3), 1400) * np.exp(-t * 70) * 0.8
        i = int(delay * SR)
        out[i:i + len(t)] += (ring + body)[: len(out) - i] * gain
    return out


def chime(notes, gap=0.09, dur=1.4):
    out = np.zeros(int((dur + gap * len(notes)) * SR))
    for k, note in enumerate(notes):
        b = bell(note, dur, decay=2.2)
        i = int(k * gap * SR)
        out[i:i + len(b)] += b
    return out


def shimmer(dur=2.5, notes=(86, 90, 93, 98, 102)):
    """A sparkle of tiny high bells."""
    out = np.zeros((int(dur * SR) + SR, 2))
    for _ in range(int(dur * 16)):
        at = rng.uniform(0, dur) ** 1.4 / dur ** 0.4
        g = bell(int(rng.choice(notes)), 0.9, decay=3.5) * rng.uniform(0.15, 0.6) * (1 - at / dur)
        add(out, g, at, 1.0, rng.uniform(-0.9, 0.9))
    return out


# ---------------------------------------------------------------------------
# Music
# ---------------------------------------------------------------------------

music_dry = bus()   # goes to the master as is
music_wet = bus()   # sent to the reverb
duck_me = bus()     # pads and bass: ducked by the kick
drums = bus()
kick_times = []

BM = dict(bass=35, chord=(59, 62, 66, 69), arp=(59, 66, 71, 74, 78, 74, 71, 66))
G = dict(bass=31, chord=(55, 59, 62, 69), arp=(55, 62, 67, 71, 74, 71, 67, 62))
D = dict(bass=26, chord=(57, 62, 66, 69), arp=(57, 62, 66, 69, 74, 69, 66, 62))
A = dict(bass=33, chord=(57, 61, 64, 69), arp=(57, 61, 64, 69, 73, 69, 64, 61))
ASUS = dict(bass=33, chord=(57, 62, 64, 69), arp=(57, 62, 64, 69, 74, 69, 64, 62))
D9 = dict(bass=26, chord=(57, 62, 64, 66, 69), arp=(62, 66, 69, 74, 76, 74, 69, 66))


def bar_time(index):
    return index * BAR


# Chord for each 2-second bar of the film (22 bars).
CHORDS = [
    BM, BM, G,                 # hook: 0-6 (the last half bar of the hook leans on A, see below)
    BM, G, D, A, ASUS,         # birth: 6-16
    D9, D9, G,                 # reveal: 16-22
    D, A, BM, G, D, A,         # features: 22-34
    G, D, A,                   # numbers: 34-40
    D9, D9,                    # ending: 40-44
]


def section(time):
    for name in ("numbers", "features", "reveal", "birth", "hook"):
        if time >= S[name]:
            return name
    return "hook"


# Pads: one per bar, brighter as the film opens up.
for i, chord in enumerate(CHORDS):
    t0 = bar_time(i)
    sec = section(t0)
    cutoff = {"hook": 900, "birth": 1300 + 200 * (i - 3), "reveal": 3200, "features": 2400, "numbers": 2800}[sec]
    gain = {"hook": 0.5, "birth": 0.42, "reveal": 0.48, "features": 0.4, "numbers": 0.42}[sec]
    if t0 >= S["numbers"] + NUM["logo"]:
        cutoff, gain = 3200, 0.48
    p = pad(chord["chord"], BAR, cutoff=cutoff, attack=0.05 if sec in ("reveal",) or i in (20,) else 0.5)
    add(duck_me, p, t0, gain)
    add(music_wet, p, t0, gain * 0.5)

# Hook: a low drone, sparse soft keys on each line, a slow pulse like a heartbeat.
drone_t = tt(6.0)
drone = (np.sin(2 * np.pi * midi(35) * drone_t) + 0.5 * np.sin(2 * np.pi * midi(47) * drone_t + 1.0))
drone *= np.minimum(1, drone_t / 0.4) * np.minimum(1, (6.0 - drone_t) / 0.5) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * drone_t))
add(music_dry, drone, 0, 0.17)
for cue, notes in ((HOOK["line1"], (47, 59, 66)), (HOOK["line2"], (50, 62, 69, 74)),
                   (HOOK["line3"], (43, 55, 62, 71)), (HOOK["line4"], (45, 57, 64, 73))):
    for k, note in enumerate(notes):
        tone = keys(note, 3.4, soft=1.0)
        add(music_dry, tone, cue + k * 0.012, 0.22, (k - 1.5) * 0.25)
        add(music_wet, tone, cue + k * 0.012, 0.22, (k - 1.5) * 0.25)
for b in np.arange(0, 6.0, BEAT):
    strength = 0.5 if (b / BEAT) % 3 == 0 else 0.26   # cuts fall every third beat
    add(drums, kick(strength), b, 0.75)
# Ticking that tightens on the last line.
for b in np.arange(HOOK["line4"], 6.0, BEAT / 4):
    add(drums, hat(0.04, 8500), b, 0.05 + 0.09 * (b - HOOK["line4"]) / 1.5, 0.3)

# Birth: an arpeggio that gains layers as agents join.
B0 = S["birth"]
t_coord, t_dev, t_test, t_whole = (B0 + BIRTH[k] for k in ("coordinator", "developer", "wholeApp", "deploy"))
t_test = B0 + BIRTH["testers"][0]
t_whole = B0 + BIRTH["wholeApp"]
t_deploy = B0 + BIRTH["deploy"]
t_final = B0 + BIRTH["finalTest"]
t_conv = B0 + BIRTH["converge"]
t_flash = B0 + BIRTH["flash"]

step = BEAT / 2
for time in np.arange(t_coord, t_conv + 0.01, step):
    chord = CHORDS[int(time // BAR)]
    k = int(round((time % BAR) / step))
    level = 0.15 + 0.2 * min(1, (time - t_coord) / 7.0)
    note = chord["arp"][k % 8]
    add(music_dry, pluck(note, 0.6, bright=0.8 + (time - t_coord) / 8), time, level, 0.35 * np.sin(k * 1.3))
    add(music_wet, pluck(note, 0.6), time, level * 0.5, 0.35 * np.sin(k * 1.3))
    if time >= t_deploy:  # an octave above joins for the last stretch
        add(music_dry, pluck(note + 12, 0.4, bright=1.4), time + step / 2, level * 0.5, -0.4 * np.sin(k * 1.3))

for time in np.arange(t_dev, t_conv, BEAT):
    chord = CHORDS[int(time // BAR)]
    add(drums, kick(0.8 if time < t_test else 1.0), time, 0.8)
    kick_times.append(time)
    add(duck_me, bass(chord["bass"] + 12, BEAT * 0.95, pulse=False), time, 0.2)
for time in np.arange(t_test, t_conv, BEAT / 4):
    k = int(round((time - t_test) / (BEAT / 4)))
    add(drums, hat(0.05), time, (0.1 if k % 2 == 0 else 0.055) * min(1.4, 0.7 + (time - t_test) / 6), 0.25)
for time in np.arange(t_whole + BEAT, t_conv, BEAT * 2):
    add(drums, clap(), time, 0.34)
    add(music_wet, clap(), time, 0.1)
# Snare-like roll into the burst of light.
for k, time in enumerate(np.arange(t_final + 1.0, t_flash, BEAT / 4)):
    add(drums, clap(), time, 0.1 + 0.035 * k)

# Reveal: the big arrival. Wide chord, bells, a slow melody.
R0 = S["reveal"]
MELODY = [(0.0, 81), (1.0, 78), (2.0, 74), (2.5, 76), (3.0, 78), (4.0, 79), (4.5, 74), (5.0, 81)]
for at, note in MELODY:
    for sig, g in ((bell(note, 3.2), 0.2), (keys(note - 12, 3.0, soft=0.5), 0.2)):
        add(music_dry, sig, R0 + at, g, 0.1)
        add(music_wet, sig, R0 + at, g * 0.9, -0.1)
for k, note in enumerate((38, 50, 57, 62, 66, 69, 74, 78)):
    add(music_dry, keys(note, 4.5, soft=0.3), R0 + k * 0.018, 0.2, (k - 3.5) * 0.2)
    add(music_wet, keys(note, 4.5, soft=0.3), R0 + k * 0.018, 0.12, (k - 3.5) * 0.2)
for time in np.arange(R0 + 2.0, R0 + 6.0 - 0.01, step):
    chord = CHORDS[int(time // BAR)]
    k = int(round((time % BAR) / step))
    add(music_dry, pluck(chord["arp"][k % 8] + 12, 0.5, bright=1.2), time, 0.07 + 0.02 * (time - R0 - 2), 0.4 * np.sin(k))
    add(music_wet, pluck(chord["arp"][k % 8] + 12, 0.5), time, 0.06, 0.4 * np.sin(k))
for bar_start, chord in ((R0, D9), (R0 + 2, D9), (R0 + 4, G)):
    add(duck_me, bass(chord["bass"] + (12 if chord is D9 else 12), BAR, pulse=False) * np.minimum(1, tt(BAR) / 0.02), bar_start, 0.16)
# Pick-up into the features.
for k, time in enumerate(np.arange(R0 + 5.0, R0 + 6.0, BEAT / 2)):
    add(drums, kick(0.6 + 0.1 * k), time, 0.7)
for k, time in enumerate(np.arange(R0 + 5.5, R0 + 6.0, BEAT / 4)):
    add(drums, clap(), time, 0.14 + 0.05 * k)

# Features and numbers: the full groove.
F0, N0 = S["features"], S["numbers"]
t_logo = N0 + NUM["logo"]
for time in np.arange(F0, t_logo - 0.01, BEAT):
    add(drums, kick(1.0), time, 0.85)
    kick_times.append(time)
for time in np.arange(F0 + BEAT, t_logo - 0.01, BEAT * 2):
    add(drums, clap(), time, 0.4)
    add(music_wet, clap(), time, 0.12)
for time in np.arange(F0, t_logo - 0.01, BEAT / 4):
    k = int(round((time - F0) / (BEAT / 4)))
    accent = (0.17, 0.07, 0.12, 0.07)[k % 4]
    add(drums, hat(0.045 if k % 4 else 0.07), time, accent * (1.15 if time >= N0 else 1.0), 0.3 if k % 2 else -0.2)
for time in np.arange(F0 + BEAT / 2, t_logo - 0.01, BEAT):   # open hat on the off-beat
    add(drums, hat(0.16, 6500), time, 0.09, -0.3)
for time in np.arange(F0, t_logo - 0.01, step):
    chord = CHORDS[int(time // BAR)]
    k = int(round((time % BAR) / step))
    add(duck_me, bass(chord["bass"] + (12 if k % 4 != 3 else 24), step * 0.9, pulse=True), time, 0.3)
    note = chord["arp"][k % 8]
    add(music_dry, pluck(note, 0.55, bright=1.3), time, 0.27, 0.4 * np.sin(k * 1.3))
    add(music_wet, pluck(note, 0.55), time, 0.09, 0.4 * np.sin(k * 1.3))
    lift = 0.15 if time >= N0 else 0.1
    add(music_dry, pluck(note + 12, 0.35, bright=1.6), time + step / 2, lift, -0.45 * np.sin(k * 1.3))
# A bell answers at the start of each feature and each bar of the numbers.
for time, note in ((F0, 81), (F0 + 2, 76), (F0 + FEAT["data"], 78), (F0 + FEAT["data"] + 2, 74),
                   (F0 + FEAT["crypto"], 81), (F0 + FEAT["crypto"] + 2, 76),
                   (N0, 79), (N0 + 1, 83), (N0 + 2, 81), (N0 + 3, 78), (N0 + 4, 76), (N0 + 5, 81)):
    add(music_dry, bell(note, 2.4), time, 0.13, 0.2)
    add(music_wet, bell(note, 2.4), time, 0.13, -0.2)
# Fill before the logo.
for k, time in enumerate(np.arange(t_logo - 0.5, t_logo, BEAT / 4)):
    add(drums, clap(), time, 0.16 + 0.06 * k)

# Ending: the opening chord of the reveal returns and rings out.
for k, note in enumerate((38, 50, 57, 62, 66, 69, 74, 78)):
    add(music_dry, keys(note, 5.0, soft=0.3), t_logo + k * 0.018, 0.2, (k - 3.5) * 0.2)
    add(music_wet, keys(note, 5.0, soft=0.3), t_logo + k * 0.018, 0.12, (k - 3.5) * 0.2)
for at, note in ((0.0, 81), (1.0, 78), (2.0, 74)):
    add(music_dry, bell(note, 3.5), t_logo + at, 0.2, 0.1)
    add(music_wet, bell(note, 3.5), t_logo + at, 0.2, -0.1)
    add(music_dry, keys(note - 12, 3.5, soft=0.5), t_logo + at, 0.2)
add(duck_me, bass(38, 3.6) * np.exp(-tt(3.6) * 0.7), t_logo, 0.24)


# ---------------------------------------------------------------------------
# Sound effects
# ---------------------------------------------------------------------------

sfx_dry = bus()
sfx_wet = bus()


def fx(sig, at, gain=1.0, pan=0.0, wet=0.3):
    add(sfx_dry, sig, at, gain, pan)
    if wet:
        add(sfx_wet, sig, at, gain * wet, pan)


def swoosh_to(at, dur=0.55, gain=0.3, lo=300, hi=5200, pan=0.0):
    """A whoosh whose loudest point lands exactly on `at`."""
    fx(whoosh(dur, lo, hi, peak=0.6), at - dur * 0.6, gain, pan)


# --- Hook
fx(impact(0.9), HOOK["line1"], 0.55, wet=0.5)
fx(scribble(0.5), HOOK["line1"] + 0.5, 0.11, 0.25)
for cue in ("line2", "line3", "line4"):
    swoosh_to(HOOK[cue], 0.5, 0.26)
for i in range(8):
    fx(pop(74 + (0, 2, 4, 7, 9, 12, 14, 16)[i], 0.12), HOOK["line2"] + 0.18 + i * 0.075, 0.1, (i % 3 - 1) * 0.6)
fx(impact(0.7, 1.6), HOOK["line3"], 0.5, wet=0.5)
fx(scribble(0.5), HOOK["line3"] + 0.4, 0.11, 0.1)
fx(scribble(0.4), HOOK["line4"] + 0.6, 0.11, 0.3)
fx(riser(0.75, 250, 6000), 6.0 - 0.75, 0.3)

# --- Birth
type_times = np.sort(rng.uniform(BIRTH["typeStart"], BIRTH["typeEnd"], 15))
for k, at in enumerate(type_times):
    fx(tick(0.018, 2400 + rng.uniform(-500, 700)), B0 + at, 0.16, rng.uniform(-0.3, 0.3), wet=0.15)
fx(pop(81, 0.14), B0 + BIRTH["typeEnd"] + 0.03, 0.3)
swoosh_to(t_coord, 0.4, 0.22, 500, 7000)
fx(bell(71, 2.2), t_coord, 0.26, 0.0, wet=0.8)
fx(impact(0.5, 1.4), t_coord, 0.3)
swoosh_to(t_dev, 0.35, 0.15, 400, 4000, -0.5)
fx(bell(66, 2.2), t_dev, 0.26, -0.5, wet=0.8)
fx(impact(0.6, 1.4), t_dev, 0.34)
TESTER_NOTES = (78, 81, 83, 86, 88, 90, 93)
for i, cue in enumerate(BIRTH["testers"]):
    at = B0 + cue
    pan = 0.3 + 0.08 * i
    fx(bell(TESTER_NOTES[i], 1.6, decay=1.6), at, 0.16, pan, wet=0.7)
    fx(whoosh(0.16, 2500, 9000, peak=0.3), at + 0.03, 0.09, pan)          # the beam
    fx(tick(0.03, 4200 + 300 * i), at + 0.15, 0.2, 0.1, wet=0.4)          # chips fly off the form
    fx(pop(TESTER_NOTES[i] + 12, 0.1), at + 0.85, 0.06, pan)             # confirmed
fx(shimmer(1.6), t_whole, 0.2, wet=0.9)
fx(impact(0.8, 1.8), t_whole, 0.42)
swoosh_to(t_whole + 0.25, 0.8, 0.2, 800, 9000)
swoosh_to(t_deploy, 0.35, 0.15, 400, 4000, -0.5)
fx(bell(69, 2.0), t_deploy, 0.24, -0.5, wet=0.8)
fx(chime((81, 86), 0.1), B0 + BIRTH["deployOk"], 0.2, -0.2, wet=0.8)
swoosh_to(t_final, 0.35, 0.15, 400, 4000, -0.5)
fx(bell(74, 2.0), t_final, 0.24, -0.5, wet=0.8)
scan_t = tt(0.6)
scan = np.sin(2 * np.pi * np.cumsum(900 * (2.2 ** (scan_t / 0.6))) / SR) * np.sin(np.pi * scan_t / 0.6) ** 2
fx(scan, t_final + 0.3, 0.05, 0.0, wet=0.5)
fx(chime((86, 90, 93), 0.08), B0 + BIRTH["finalOk"], 0.22, 0.0, wet=0.9)
fx(riser(0.75, 200, 9000), S["reveal"] - 0.75, 0.4, wet=0.5)

# --- Reveal
fx(impact(1.2, 3.0), R0, 0.85, wet=0.6)
fx(whoosh(1.4, 6000, 900, peak=0.08), R0, 0.3, wet=0.6)                   # air released by the burst
fx(shimmer(2.6), R0 + 0.05, 0.36, wet=1.0)
fx(whoosh(0.9, 2500, 11000, peak=0.5), R0 + REVEAL["sweep"], 0.1, wet=0.8)  # light sliding over the gloss
swoosh_to(R0 + REVEAL["wordmark"] + 0.1, 0.5, 0.2, 300, 3800, 0.2)
fx(scribble(0.5), R0 + REVEAL["tagline"] + 0.5, 0.1, -0.2)
fx(riser(0.6, 300, 7000), S["features"] - 0.6, 0.26)

# --- Features
POP_NOTES = (74, 76, 78, 81, 83)
swoosh_to(F0 + 0.2, 0.5, 0.2, 300, 4000, 0.4)
for i, cue in enumerate(FEAT["chatItems"]):
    fx(pop(POP_NOTES[i]), F0 + cue, 0.34, 0.45)
    fx(tick(0.02, 5200), F0 + cue + 0.2, 0.06, 0.6, wet=0.2)             # unread badge
fx(scribble(0.5), F0 + FEAT["note"], 0.1, 0.1)
swoosh_to(F0 + FEAT["data"], 0.5, 0.26)
for i, cue in enumerate(FEAT["dataItems"]):
    fx(pop((78, 81, 85)[i]), F0 + cue, 0.34, (-0.6, 0.0, 0.6)[i])
fx(tick(0.02, 3600), F0 + FEAT["dataItems"][1] + 1.0, 0.16, 0.0, wet=0.2)  # "copied"
fx(chime((86, 93), 0.07, 0.9), F0 + FEAT["dataItems"][2] + 1.15, 0.12, 0.6, wet=0.6)  # upload done
swoosh_to(F0 + FEAT["crypto"], 0.5, 0.26)
fx(pop(76), F0 + FEAT["message"], 0.32, -0.5)
fx(glitch(0.55), F0 + FEAT["scramble"], 0.13, -0.5, wet=0.25)
fx(lock_click(), F0 + FEAT["lock"] - 0.07, 0.3, -0.35, wet=0.3)
fx(scribble(0.45), F0 + FEAT["lock"] + 0.2, 0.09, -0.1)
travel = FEAT["arrive"] - FEAT["send"]
fx(whoosh(travel, 700, 3600, peak=0.55), F0 + FEAT["send"], 0.16, 0.0)
fx(chime((81, 88), 0.07, 1.0), F0 + FEAT["arrive"] - 0.03, 0.2, 0.5, wet=0.7)
fx(scribble(0.45), F0 + FEAT["arrive"] + 0.15, 0.09, 0.2)
fx(riser(0.4, 400, 6000), S["numbers"] - 0.4, 0.2)

# --- Numbers
for i, cue in enumerate(NUM["stats"]):
    at = N0 + cue
    fx(pop((74, 78, 81)[i], 0.2), at, 0.36, (-0.6, 0.0, 0.6)[i])
    # The counter spinning up: ticks that slow down as the number settles.
    p = 0.0
    while p < 1.0:
        fx(tick(0.012, 3800 + 900 * p), at + 0.05 + 0.9 * (1 - (1 - p) ** 3) , 0.07 * (1 - p * 0.6), (-0.6, 0.0, 0.6)[i], wet=0.1)
        p += 0.045
grow = NUM["compareHit"] - NUM["compare"]
grow_t = tt(grow)
tone = np.sin(2 * np.pi * np.cumsum(midi(57) * 2 ** (grow_t / grow)) / SR) * np.sin(np.pi * grow_t / grow) ** 0.7
fx(tone, N0 + NUM["compare"], 0.05, 0.0, wet=0.5)                         # the long bar growing
fx(whoosh(grow, 500, 2600, peak=0.8), N0 + NUM["compare"], 0.12)
fx(impact(0.7, 1.6), N0 + NUM["compareHit"], 0.42)
fx(chime((81, 86, 90), 0.06), N0 + NUM["compareHit"], 0.16, 0.2, wet=0.8)
fx(scribble(0.7), N0 + NUM["compareHit"] + 0.1, 0.12, 0.2)
fx(riser(0.5, 300, 7000), t_logo - 0.5, 0.3)
fx(impact(1.1, 3.0), t_logo, 0.75, wet=0.6)
fx(shimmer(2.4), t_logo + 0.05, 0.3, wet=1.0)
fx(whoosh(0.9, 2500, 11000, peak=0.5), t_logo + 0.7, 0.09, wet=0.8)


# ---------------------------------------------------------------------------
# Mix
# ---------------------------------------------------------------------------

def reverb(x, seconds=2.6, tone=5200):
    """Convolution reverb with a synthetic hall: decaying, slowly darkening noise."""
    t = tt(seconds)
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(len(t)) * np.exp(-t * 2.6)
        ir = lowpass(ir, tone)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = signal.fftconvolve(x[:, ch], ir)[: len(x)]
    return highpass(out, 180)


# The kick pushes pads and bass down for a moment, which makes the groove breathe.
duck = np.ones(len(duck_me))
for kt in kick_times:
    i = int(kt * SR)
    n = int(0.3 * SR)
    shape = 1 - 0.6 * np.exp(-np.arange(n) / (0.09 * SR))
    duck[i:i + n] = np.minimum(duck[i:i + n], shape[: len(duck) - i])
duck_me *= duck[:, None]

music_rev = reverb(music_wet) * 0.5
sfx_rev = reverb(sfx_wet, 2.2, 6500) * 0.55


def db(v):
    return 20 * np.log10(max(v, 1e-9))


if os.environ.get("STATS"):
    # Level of every bus in every part of the film, to balance the mix by numbers.
    parts = [("hook", 0, 6), ("birth", 6, 16), ("reveal", 16, 22), ("feat", 22, 34), ("nums", 34, 40), ("end", 40, 44)]
    print("bus        " + "".join(f"{n:>14s}" for n, _, _ in parts) + "   (rms / peak, dBFS)")
    seg = (music_dry + duck_me + drums + music_rev + sfx_dry + sfx_rev)[int(22 * SR):int(34 * SR)].mean(axis=1)
    f, pxx = signal.welch(seg, SR, nperseg=8192)
    bands = [(20, 60), (60, 250), (250, 1000), (1000, 4000), (4000, 12000), (12000, 20000)]
    print("features spectrum: " + "  ".join(f"{lo}-{hi} Hz {10 * np.log10(pxx[(f >= lo) & (f < hi)].sum() + 1e-20):.1f} dB" for lo, hi in bands))
    for name, b in (("keys+arp", music_dry), ("pad+bass", duck_me), ("drums", drums), ("music rev", music_rev),
                    ("sfx dry", sfx_dry), ("sfx rev", sfx_rev)):
        row = ""
        for _, t0, t1 in parts:
            seg = b[int(t0 * SR):int(t1 * SR)]
            row += f"  {db(np.sqrt(np.mean(seg ** 2))):5.1f} /{db(np.max(np.abs(seg))):5.1f}"
        print(f"{name:10s}{row}")

music = highpass(music_dry + duck_me + drums + music_rev, 28)
sfx = highpass(sfx_dry + sfx_rev, 40)


def finish(x):
    x = x[:N].copy()
    out_fade = int(0.9 * SR)
    x[-out_fade:] *= (np.linspace(1, 0, out_fade) ** 1.5)[:, None]
    return x


def limit(x, ceiling=0.84, lookahead=0.004, release=0.12):
    """A transparent look-ahead peak limiter."""
    peak = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    win = int(lookahead * SR)
    # Hold the lowest gain over the look-ahead window, then smooth the recovery.
    from scipy.ndimage import minimum_filter1d
    held = minimum_filter1d(need, size=2 * win + 1, mode="nearest")
    out = np.empty_like(held)
    g = 1.0
    coef = np.exp(-1 / (release * SR))
    for i in range(len(held)):
        g = held[i] if held[i] < g else 1 - (1 - g) * coef
        out[i] = g
    return x * out[:, None]


music, sfx = finish(music), finish(sfx)
MASTER = float(os.environ.get("MASTER", "0.58"))
gain = MASTER
raw = (music + sfx) * gain
raw = raw + 0.5 * highpass(raw, 4500)   # a little air on top: a gentle high shelf
mix = limit(raw)
peak = np.max(np.abs(mix))


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(data, -1, 1) * 32767).astype("<i2").tobytes())


write(os.path.join(ROOT, "public", "audio", "soundtrack.wav"), mix)
write(os.path.join(ROOT, "audio", "stems", "music.wav"), music * gain)
write(os.path.join(ROOT, "audio", "stems", "sfx.wav"), sfx * gain)


print(f"length {len(mix) / SR:.2f} s, master gain {gain:.2f}, limited samples {np.mean(np.max(np.abs(raw), axis=1) > 0.84) * 100:.2f} %")
for name, stem in (("music", music * gain), ("sfx", sfx * gain), ("mix", mix)):
    print(f"{name:6s} peak {db(np.max(np.abs(stem))):6.1f} dBFS   rms {db(np.sqrt(np.mean(stem ** 2))):6.1f} dBFS")
