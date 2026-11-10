"use client";

import { useSyncExternalStore } from "react";

/** Ouverture du guide interactif, depuis n'importe où dans l'application. */
export type GuideRequest = { chapter?: string; at: number } | null;

let request: GuideRequest = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Ouvre le guide : au début d'un chapitre précis, ou là où l'apprenti s'était arrêté. */
export function openGuide(chapter?: string) {
  request = { chapter, at: Date.now() };
  emit();
}

export function closeGuide() {
  request = null;
  emit();
}

export function useGuide() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => request,
    () => null,
  );
}

const POS_KEY = "codemaroc-guide-position";

export interface GuidePosition {
  pos: number;
  spot: number;
  /** Écran le plus avancé déjà vu. */
  best: number;
}

export function readGuidePosition(): GuidePosition | null {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) ?? "null") as GuidePosition | null;
  } catch {
    return null;
  }
}

export function writeGuidePosition(p: GuidePosition | null) {
  try {
    if (p) localStorage.setItem(POS_KEY, JSON.stringify(p));
    else localStorage.removeItem(POS_KEY);
  } catch {}
}
