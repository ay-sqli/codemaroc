import dns from "node:dns";
import { MongoClient, type Collection, type Db, type ObjectId } from "mongodb";

/**
 * Connexion MongoDB Atlas (une seule connexion réutilisée entre les requêtes).
 * Variables : MONGODB_URI (chaîne Atlas), MONGODB_DB (nom de la base, « codemaroc » par défaut).
 */

/** Certains postes (Windows, réseaux filtrés) ont un résolveur DNS qui refuse les requêtes SRV
 * de « mongodb+srv » : en cas de refus, on réessaie via des DNS publics. */
function usePublicDns() {
  const servers = ["1.1.1.1", "8.8.8.8"];
  dns.setServers(servers);
  dns.promises.setServers(servers);
}

async function connect(uri: string) {
  const open = () => new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 }).connect();
  try {
    return await open();
  } catch (e) {
    const err = e as { syscall?: string; code?: string };
    if (err.syscall !== "querySrv") throw e;
    usePublicDns();
    return open();
  }
}

export type Role = "user" | "admin";

/**
 * Un seul administrateur, désigné par son e-mail (variable ADMIN_EMAIL, sinon ayoub@gmail.com).
 * Le rôle est toujours recalculé depuis l'e-mail : aucun autre compte ne peut devenir admin.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ayoub@gmail.com").trim().toLowerCase();
export const roleFor = (email: string): Role => (email.trim().toLowerCase() === ADMIN_EMAIL ? "admin" : "user");
export const isAdmin = (u: { email: string }) => roleFor(u.email) === "admin";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  lastLoginAt?: Date;
}

/** Résumé calculé à chaque sauvegarde, pour le back-office (évite de relire tout l'état). */
export interface ProgressSummary {
  done: number;
  xp: number;
  answered: number;
  correct: number;
  exams: number;
  bestExam: number;
  activeDays: number;
  lastActive: number;
}

export interface ProgressDoc {
  _id: ObjectId; // = identifiant de l'utilisateur
  state: unknown;
  summary: ProgressSummary;
  updatedAt: Date;
}

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexes?: Promise<unknown> };

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI manquant (voir web/.env.local)");
  if (!g._mongo) {
    g._mongo = connect(uri);
    g._mongo.catch(() => (g._mongo = undefined));
  }
  const db = (await g._mongo).db(process.env.MONGODB_DB || "codemaroc");
  g._indexes ??= Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("users").createIndex({ role: 1 }),
    // Remet les rôles en ordre : seul ADMIN_EMAIL est admin.
    db.collection("users").updateMany({ role: "admin", email: { $ne: ADMIN_EMAIL } }, { $set: { role: "user" } }),
    db.collection("users").updateOne({ email: ADMIN_EMAIL, role: { $ne: "admin" } }, { $set: { role: "admin" } }),
  ]);
  await g._indexes;
  return db;
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

export async function progress(): Promise<Collection<ProgressDoc>> {
  return (await getDb()).collection<ProgressDoc>("progress");
}

/** Données publiques d'un utilisateur (jamais le hash du mot de passe). */
export function publicUser(u: UserDoc) {
  return { id: u._id.toHexString(), email: u.email, name: u.name, role: roleFor(u.email), createdAt: u.createdAt.getTime(), lastLoginAt: u.lastLoginAt?.getTime() ?? null };
}
export type PublicUser = ReturnType<typeof publicUser>;

/** Résumé de progression calculé à partir de l'état sauvegardé par l'app (lib/store.ts). */
export function summarize(state: unknown): ProgressSummary {
  const s = (state ?? {}) as {
    answers?: Record<string, { lastOk?: boolean; last?: number }>;
    exams?: { score?: number }[];
    days?: Record<string, number>;
    game?: { done?: Record<string, unknown>; xp?: number };
  };
  const answers = Object.values(s.answers ?? {});
  return {
    done: Object.keys(s.game?.done ?? {}).length,
    xp: Number(s.game?.xp) || 0,
    answered: answers.length,
    correct: answers.filter((a) => a?.lastOk).length,
    exams: s.exams?.length ?? 0,
    bestExam: Math.max(0, ...(s.exams ?? []).map((e) => Number(e?.score) || 0)),
    activeDays: Object.keys(s.days ?? {}).length,
    lastActive: Math.max(0, ...answers.map((a) => Number(a?.last) || 0)),
  };
}
