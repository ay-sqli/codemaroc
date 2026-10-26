"use client";

import { useSyncExternalStore } from "react";

/**
 * Progression de l'utilisateur, stockée uniquement dans son navigateur (localStorage).
 * Pas de base de données : chaque personne qui ouvre l'app a sa propre progression,
 * exportable / importable en JSON depuis la page Progression.
 */

export interface AnswerStat {
  seen: number;
  ok: number;
  ko: number;
  last: number;
  lastOk: boolean;
}

/** Boîte de Leitner du carnet d'erreurs (1 = à revoir vite … 5 = maîtrisé). */
export interface SrsItem {
  box: number;
  due: number;
  added: number;
  chapter: string;
}

export interface ExamResult {
  ts: number;
  score: number;
  total: number;
  seconds: number;
  wrong: string[];
}

export interface Settings {
  examDate?: string;
  dailyGoal: number;
  timer: boolean;
  autoAudio: boolean;
  theme: "system" | "light" | "dark";
}

export interface State {
  v: 1;
  answers: Record<string, AnswerStat>;
  srs: Record<string, SrsItem>;
  read: Record<string, number>;
  exams: ExamResult[];
  days: Record<string, number>;
  flags: Record<string, string>;
  settings: Settings;
}

const KEY = "narsa-revision-v1";
const DAY = 86_400_000;
/** Intervalles de révision par boîte (en jours). */
export const SRS_INTERVALS = [0, 1, 2, 4, 8, 16];

const initial: State = {
  v: 1,
  answers: {},
  srs: {},
  read: {},
  exams: [],
  days: {},
  flags: {},
  settings: { dailyGoal: 40, timer: true, autoAudio: false, theme: "system" },
};

let state: State = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw), settings: { ...initial.settings, ...JSON.parse(raw).settings } };
  } catch {
    /* stockage indisponible (navigation privée…) : l'app fonctionne sans sauvegarde */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(updater: (s: State) => State) {
  load();
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export function getState() {
  load();
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(initial),
  );
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Enregistre une réponse : statistiques + carnet d'erreurs (Leitner). */
export function recordAnswer(id: string, ok: boolean, chapter: string) {
  set((s) => {
    const prev = s.answers[id] ?? { seen: 0, ok: 0, ko: 0, last: 0, lastOk: false };
    const answers = {
      ...s.answers,
      [id]: { seen: prev.seen + 1, ok: prev.ok + (ok ? 1 : 0), ko: prev.ko + (ok ? 0 : 1), last: Date.now(), lastOk: ok },
    };
    const srs = { ...s.srs };
    const item = srs[id];
    if (!ok) {
      srs[id] = { box: 1, due: Date.now() + SRS_INTERVALS[1] * DAY, added: item?.added ?? Date.now(), chapter };
    } else if (item) {
      const box = Math.min(5, item.box + 1);
      srs[id] = { ...item, box, due: Date.now() + SRS_INTERVALS[box] * DAY };
    }
    const d = today();
    return { ...s, answers, srs, days: { ...s.days, [d]: (s.days[d] ?? 0) + 1 } };
  });
}

/** Ajoute manuellement une question au carnet (« je veux la revoir »). */
export function addToNotebook(id: string, chapter: string) {
  set((s) => (s.srs[id] ? s : { ...s, srs: { ...s.srs, [id]: { box: 1, due: Date.now(), added: Date.now(), chapter } } }));
}

export function removeFromNotebook(id: string) {
  set((s) => {
    const srs = { ...s.srs };
    delete srs[id];
    return { ...s, srs };
  });
}

export function markRead(slug: string) {
  set((s) => ({ ...s, read: { ...s.read, [slug]: Date.now() } }));
}

export function recordExam(r: ExamResult) {
  set((s) => ({ ...s, exams: [...s.exams, r].slice(-100) }));
}

export function flagQuestion(id: string, note: string) {
  set((s) => ({ ...s, flags: { ...s.flags, [id]: note } }));
}

export function updateSettings(p: Partial<Settings>) {
  set((s) => ({ ...s, settings: { ...s.settings, ...p } }));
}

export function exportState() {
  return JSON.stringify(getState(), null, 2);
}

export function importState(json: string) {
  const parsed = JSON.parse(json) as State;
  if (parsed?.v !== 1 || typeof parsed.answers !== "object") throw new Error("Fichier invalide");
  set(() => ({ ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } }));
}

export function resetState() {
  set(() => initial);
}

/** Série de jours consécutifs d'activité (jusqu'à aujourd'hui ou hier). */
export function streak(days: Record<string, number>) {
  let n = 0;
  const d = new Date();
  if (!days[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
  while (days[d.toISOString().slice(0, 10)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
