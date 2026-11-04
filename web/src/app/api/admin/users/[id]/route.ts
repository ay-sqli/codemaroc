import { ObjectId } from "mongodb";
import { progress, users } from "@/lib/server/db";
import { fail, hashPassword, isAdmin, json, publicUser, readJson, requireAdmin } from "@/lib/server/auth-routes";

type Ctx = { params: Promise<{ id: string }> };

async function target(ctx: Ctx) {
  const { id } = await ctx.params;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

/** Détail d'un utilisateur + sa progression complète. */
export async function GET(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const _id = await target(ctx);
  const u = _id && (await (await users()).findOne({ _id }));
  if (!u) return fail("Utilisateur introuvable.", 404);
  const p = await (await progress()).findOne({ _id: u._id });
  return json({ user: publicUser(u), state: p?.state ?? null, summary: p?.summary ?? null, syncedAt: p?.updatedAt?.getTime() ?? null });
}

/** Modifier le nom ou le mot de passe d'un utilisateur, ou remettre sa progression à zéro. Le rôle n'est pas modifiable. */
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const _id = await target(ctx);
  const col = await users();
  const u = _id && (await col.findOne({ _id }));
  if (!u) return fail("Utilisateur introuvable.", 404);
  const body = await readJson<{ name?: string; role?: string; password?: string; resetProgress?: boolean }>(req);
  if (body.role !== undefined) return fail("Il n'y a qu'un seul administrateur : le rôle ne peut pas être modifié.", 403);
  const set: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 40) return fail("Le nom doit faire entre 2 et 40 caractères.");
    set.name = name;
  }
  if (body.password !== undefined) {
    if (String(body.password).length < 8) return fail("Le mot de passe doit contenir au moins 8 caractères.");
    set.passwordHash = await hashPassword(String(body.password));
  }
  if (body.resetProgress) await (await progress()).deleteOne({ _id: u._id });
  if (Object.keys(set).length) await col.updateOne({ _id: u._id }, { $set: set });
  return json({ user: publicUser({ ...u, ...set }) });
}

/** Supprimer un utilisateur et sa progression. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const _id = await target(ctx);
  const col = await users();
  const u = _id && (await col.findOne({ _id }));
  if (!u) return fail("Utilisateur introuvable.", 404);
  if (u._id.equals(admin._id)) return fail("Tu ne peux pas supprimer ton propre compte depuis le back-office.", 409);
  if (isAdmin(u)) return fail("Le compte administrateur ne peut pas être supprimé.", 409);
  await (await progress()).deleteOne({ _id: u._id });
  await col.deleteOne({ _id: u._id });
  return json({ ok: true });
}
