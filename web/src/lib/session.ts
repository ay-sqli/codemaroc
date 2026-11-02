"use client";

import { useSyncExternalStore } from "react";
import { asset } from "./base";

/**
 * Session côté navigateur : l'utilisateur connecté (lu via /api/auth/me) et les actions de compte.
 * Le cookie de session est httpOnly : seul le serveur peut le lire.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: number;
  lastLoginAt: number | null;
}

type Status = "loading" | "guest" | "user";
let state: { status: Status; user: SessionUser | null } = { status: "loading", user: null };
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setUser(user: SessionUser | null) {
  state = { status: user ? "user" : "guest", user };
  emit();
}

/** Appel JSON vers l'API de l'app (gère le préfixe d'hébergement et les erreurs lisibles). */
export async function api<T = Record<string, unknown>>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(asset(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

export async function refreshSession() {
  try {
    const { user } = await api<{ user: SessionUser | null }>("/api/auth/me/");
    setUser(user);
  } catch {
    // Serveur ou base injoignable : l'app continue en mode invité (progression locale).
    setUser(null);
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!started) {
    started = true;
    void refreshSession();
  }
  return () => listeners.delete(l);
}

const SERVER = { status: "loading" as Status, user: null };
export function useSession() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

export async function login(email: string, password: string) {
  const { user } = await api<{ user: SessionUser }>("/api/auth/login/", { method: "POST", json: { email, password } });
  setUser(user);
  return user;
}

export async function register(name: string, email: string, password: string) {
  const { user } = await api<{ user: SessionUser }>("/api/auth/register/", { method: "POST", json: { name, email, password } });
  setUser(user);
  return user;
}

export async function logout() {
  await api("/api/auth/logout/", { method: "POST" }).catch(() => {});
  setUser(null);
}

export function updateSessionUser(user: SessionUser) {
  setUser(user);
}
