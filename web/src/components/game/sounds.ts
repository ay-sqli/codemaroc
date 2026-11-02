"use client";

import { asset } from "@/lib/base";
import { getState } from "@/lib/store";

/**
 * Sons du jeu : fichiers courts de public/sfx (bonne réponse, erreur, klaxon, dérapage…),
 * décodés une fois puis joués via Web Audio. Tant qu'un fichier n'est pas chargé, un petit son
 * synthétisé le remplace.
 */

type Name = "correct" | "wrong" | "tap" | "complete" | "fail" | "horn" | "chest" | "tick" | "summit";

let ctx: AudioContext | null = null;
const buffers = new Map<Name, AudioBuffer>();
const loading = new Map<Name, Promise<void>>();

function audio() {
  if (typeof window === "undefined" || !getState().game.sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function load(a: AudioContext, name: Name) {
  if (!loading.has(name)) {
    loading.set(
      name,
      fetch(asset(`/sfx/${name}.wav`))
        .then((r) => r.arrayBuffer())
        .then((b) => a.decodeAudioData(b))
        .then((buf) => void buffers.set(name, buf))
        .catch(() => {}),
    );
  }
  return loading.get(name)!;
}

/** Précharge tous les sons (appelé au début d'une étape). */
export function preloadSounds() {
  const a = audio();
  if (!a) return;
  (["correct", "wrong", "tap", "complete", "fail", "horn", "chest", "tick", "summit"] as Name[]).forEach((n) => void load(a, n));
}

function tone(a: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

/** Sons de secours synthétisés. */
const SYNTH: Record<Name, (a: AudioContext) => void> = {
  correct: (a) => {
    tone(a, 880, 0, 0.12, "triangle");
    tone(a, 1318.5, 0.09, 0.22, "triangle");
  },
  wrong: (a) => {
    tone(a, 220, 0, 0.18, "square", 0.08);
    tone(a, 174.6, 0.14, 0.28, "square", 0.08);
  },
  tap: (a) => tone(a, 660, 0, 0.05, "sine", 0.06),
  complete: (a) => [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(a, f, i * 0.11, 0.3, "triangle")),
  summit: (a) => [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => tone(a, f, i * 0.11, 0.35, "triangle")),
  chest: (a) => [784, 988, 1175, 1568].forEach((f, i) => tone(a, f, i * 0.08, 0.25, "triangle")),
  fail: (a) => [392, 349.2, 311.1, 261.6].forEach((f, i) => tone(a, f, i * 0.16, 0.3, "triangle", 0.12)),
  horn: (a) =>
    [0, 0.28].forEach((t) => {
      tone(a, 415.3, t, 0.22, "square", 0.06);
      tone(a, 523.3, t, 0.22, "square", 0.06);
    }),
  tick: (a) => tone(a, 1200, 0, 0.04, "square", 0.04),
};

const VOLUME: Partial<Record<Name, number>> = { tap: 0.5, tick: 0.6, horn: 0.6, fail: 0.7 };

function play(name: Name) {
  const a = audio();
  if (!a) return;
  const buf = buffers.get(name);
  if (!buf) {
    void load(a, name);
    return SYNTH[name](a);
  }
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = VOLUME[name] ?? 0.9;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  correct: () => play("correct"),
  wrong: () => play("wrong"),
  tap: () => play("tap"),
  complete: () => play("complete"),
  summit: () => play("summit"),
  chest: () => play("chest"),
  /** Permis suspendu : petit dérapage. */
  fail: () => play("fail"),
  /** Klaxon joyeux (sans-faute). */
  horn: () => play("horn"),
  /** Tic-tac des 5 dernières secondes du chrono. */
  tick: () => play("tick"),
};
