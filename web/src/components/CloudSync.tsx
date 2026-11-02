"use client";

import { useEffect, useSyncExternalStore } from "react";
import { asset } from "@/lib/base";
import { api, useSession } from "@/lib/session";
import { getState, mergeStates, normalizeState, onStateChange, replaceState, resetState, type State } from "@/lib/store";

/**
 * Synchronisation de la progression avec le compte (MongoDB) :
 * 1. à la connexion, fusion de la progression de l'appareil avec celle du compte ;
 * 2. ensuite, sauvegarde automatique après chaque modification (regroupée toutes les 1,5 s) ;
 * 3. sauvegarde immédiate quand la page passe en arrière-plan ou se ferme.
 * À la déconnexion, la progression locale est effacée (appareil partagé).
 */

const OWNER = "codemaroc-owner";
type SyncStatus = "idle" | "syncing" | "saved" | "error" | "offline";
let status: { s: SyncStatus; at: number | null } = { s: "idle", at: null };
const listeners = new Set<() => void>();
function setStatus(s: SyncStatus, at: number | null = status.at) {
  status = { s, at };
  listeners.forEach((l) => l());
}
export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}

const readOwner = () => {
  try {
    return localStorage.getItem(OWNER);
  } catch {
    return null;
  }
};
const writeOwner = (id: string | null) => {
  try {
    if (id) localStorage.setItem(OWNER, id);
    else localStorage.removeItem(OWNER);
  } catch {}
};

async function push(keepalive = false) {
  setStatus("syncing");
  try {
    const res = await fetch(asset("/api/progress/"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: getState() }),
      credentials: "same-origin",
      keepalive,
    });
    if (!res.ok) throw new Error(String(res.status));
    setStatus("saved", Date.now());
  } catch {
    setStatus(navigator.onLine ? "error" : "offline");
  }
}

/** Sauvegarde immédiate (avant une déconnexion, par exemple). */
export const flushProgress = () => push();

export function CloudSync() {
  const { status: auth, user } = useSession();
  const uid = user?.id ?? null;

  useEffect(() => {
    if (auth === "guest") {
      // Déconnecté après avoir été connecté sur cet appareil : on efface la progression de ce compte.
      if (readOwner()) {
        writeOwner(null);
        resetState();
      }
      setStatus("idle", null);
      return;
    }
    if (auth !== "user" || !uid) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ready = false;

    (async () => {
      setStatus("syncing");
      try {
        const { state: remote } = await api<{ state: State | null }>("/api/progress/");
        if (cancelled) return;
        const owner = readOwner();
        const local = getState();
        // Progression d'invité (ou du même compte) : on la fusionne. Progression d'un AUTRE compte : on l'ignore.
        const base = owner && owner !== uid ? null : local;
        const merged = remote ? (base ? mergeStates(normalizeState(remote), base) : normalizeState(remote)) : (base ?? getState());
        replaceState(merged);
        writeOwner(uid);
        ready = true;
        await push();
      } catch {
        setStatus(navigator.onLine ? "error" : "offline");
      }
    })();

    const off = onStateChange(() => {
      if (!ready) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void push(), 1500);
    });
    const flush = () => {
      if (ready && timer) {
        clearTimeout(timer);
        timer = null;
        void push(true);
      }
    };
    const onVis = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      cancelled = true;
      off();
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [auth, uid]);

  return null;
}
