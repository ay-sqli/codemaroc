import { progress, users } from "@/lib/server/db";
import { checkPassword, currentUser, endSession, fail, hashPassword, isAdmin, json, publicUser, readJson, requireUser } from "@/lib/server/auth-routes";

/** Utilisateur connecté (null si invité). */
export async function GET() {
  const u = await currentUser();
  return json({ user: u ? publicUser(u) : null });
}

/** Modifier son nom et/ou son mot de passe (le mot de passe actuel est exigé pour en changer). */
export async function PATCH(req: Request) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const body = await readJson<{ name?: string; currentPassword?: string; newPassword?: string }>(req);
  const set: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 40) return fail("Le nom doit faire entre 2 et 40 caractères.");
    set.name = name;
  }
  if (body.newPassword !== undefined) {
    if (!(await checkPassword(String(body.currentPassword ?? ""), u.passwordHash))) return fail("Mot de passe actuel incorrect.", 403);
    if (String(body.newPassword).length < 8) return fail("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    set.passwordHash = await hashPassword(String(body.newPassword));
  }
  if (!Object.keys(set).length) return fail("Rien à modifier.");
  await (await users()).updateOne({ _id: u._id }, { $set: set });
  return json({ user: publicUser({ ...u, ...set }) });
}

/** Supprimer son compte et sa progression (mot de passe exigé). */
export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const body = await readJson<{ password?: string }>(req);
  if (!(await checkPassword(String(body.password ?? ""), u.passwordHash))) return fail("Mot de passe incorrect.", 403);
  if (isAdmin(u)) return fail("Le compte administrateur ne peut pas être supprimé.", 409);
  await (await progress()).deleteOne({ _id: u._id });
  await (await users()).deleteOne({ _id: u._id });
  await endSession();
  return json({ ok: true });
}
