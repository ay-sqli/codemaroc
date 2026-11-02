import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { users, type UserDoc } from "./db";

/**
 * Authentification : mots de passe hachés (bcrypt), session = jeton signé (HS256, AUTH_SECRET)
 * dans un cookie httpOnly — illisible par le JavaScript de la page.
 */

const COOKIE = "cm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET manquant ou trop court (voir web/.env.local)");
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function startSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Utilisateur connecté (relu en base : un rôle changé ou un compte supprimé prend effet tout de suite). */
export async function currentUser(): Promise<UserDoc | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !ObjectId.isValid(payload.sub)) return null;
    return await (await users()).findOne({ _id: new ObjectId(payload.sub) });
  } catch {
    return null;
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (message: string, status = 400) => json({ error: message }, status);

/** Garde : utilisateur connecté, sinon 401. */
export async function requireUser(): Promise<UserDoc | Response> {
  return (await currentUser()) ?? fail("Connexion requise", 401);
}

/** Garde : administrateur, sinon 401 / 403. */
export async function requireAdmin(): Promise<UserDoc | Response> {
  const u = await currentUser();
  if (!u) return fail("Connexion requise", 401);
  if (u.role !== "admin") return fail("Accès réservé aux administrateurs", 403);
  return u;
}

/** Validation des champs de compte. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function validateAccount(input: { name?: unknown; email?: unknown; password?: unknown }, { needPassword = true } = {}) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (name.length < 2 || name.length > 40) return { error: "Le nom doit faire entre 2 et 40 caractères." } as const;
  if (!EMAIL.test(email) || email.length > 120) return { error: "Adresse e-mail invalide." } as const;
  if ((needPassword || password) && (password.length < 8 || password.length > 100)) return { error: "Le mot de passe doit contenir au moins 8 caractères." } as const;
  return { name, email, password } as const;
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
