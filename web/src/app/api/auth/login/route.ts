import { users } from "@/lib/server/db";
import { checkPassword, fail, isAdmin, json, publicUser, readJson, startSession } from "@/lib/server/auth-routes";

export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string; admin?: boolean }>(req);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const col = await users();
  const u = email ? await col.findOne({ email }) : null;
  // Même message que le compte existe ou non (ne pas révéler les adresses inscrites).
  if (!u || !(await checkPassword(password, u.passwordHash))) return fail("E-mail ou mot de passe incorrect.", 401);
  // Fenêtre de connexion du back-office : réservée aux administrateurs (aucune session ouverte sinon).
  if (body.admin && !isAdmin(u)) return fail("Ce compte n'a pas accès au back-office.", 403);
  const now = new Date();
  await col.updateOne({ _id: u._id }, { $set: { lastLoginAt: now } });
  await startSession(u._id.toHexString());
  return json({ user: publicUser({ ...u, lastLoginAt: now }) });
}
