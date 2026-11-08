"use client";

import { useSyncExternalStore } from "react";
import { asset } from "./base";
import { currentLang } from "./i18n";

/** Messages renvoyés par le serveur (écrits en français) dans la langue de l'utilisateur. */
const ERRORS_AR: Record<string, string> = {
  "Connexion requise": "يجب تسجيل الدخول",
  "Accès réservé aux administrateurs": "الدخول مخصص للمديرين",
  "Le nom doit faire entre 2 et 40 caractères.": "يجب أن يتكون الاسم من 2 إلى 40 حرفا.",
  "Adresse e-mail invalide.": "البريد الإلكتروني غير صالح.",
  "Le mot de passe doit contenir au moins 8 caractères.": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
  "Le nouveau mot de passe doit contenir au moins 8 caractères.": "يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.",
  "Progression trop volumineuse.": "حجم التقدم كبير جدا.",
  "JSON invalide.": "بيانات غير صالحة.",
  "État de progression invalide.": "حالة التقدم غير صالحة.",
  "Un compte existe déjà avec cette adresse e-mail.": "يوجد حساب بهذا البريد الإلكتروني.",
  "Mot de passe actuel incorrect.": "كلمة المرور الحالية غير صحيحة.",
  "Rien à modifier.": "لا يوجد ما يجب تعديله.",
  "Mot de passe incorrect.": "كلمة المرور غير صحيحة.",
  "Le compte administrateur ne peut pas être supprimé.": "لا يمكن حذف حساب المدير.",
  "Utilisateur introuvable.": "المستخدم غير موجود.",
  "Il n'y a qu'un seul administrateur : le rôle ne peut pas être modifié.": "يوجد مدير واحد فقط: لا يمكن تغيير الدور.",
  "Tu ne peux pas supprimer ton propre compte depuis le back-office.": "لا يمكنك حذف حسابك من لوحة الإدارة.",
  "E-mail ou mot de passe incorrect.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Ce compte n'a pas accès au back-office.": "لا يملك هذا الحساب صلاحية الدخول إلى لوحة الإدارة.",
};

function localizeError(message: string | undefined, status: number) {
  if (currentLang() !== "ar") return message || `Erreur ${status}`;
  return (message && ERRORS_AR[message]) || `حدث خطأ (${status})`;
}

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
  if (!res.ok) throw new Error(localizeError(data.error, res.status));
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
