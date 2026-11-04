import { progress, users } from "@/lib/server/db";
import { fail, hashPassword, json, publicUser, readJson, requireAdmin, roleFor, validateAccount } from "@/lib/server/auth-routes";

/** Back-office : tous les utilisateurs avec leur résumé de progression. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const list = await (await users()).find({}).sort({ createdAt: -1 }).toArray();
  const prog = await (await progress()).find({}, { projection: { summary: 1, updatedAt: 1 } }).toArray();
  const byId = new Map(prog.map((p) => [p._id.toHexString(), p]));
  return json({
    users: list.map((u) => {
      const p = byId.get(u._id.toHexString());
      return { ...publicUser(u), summary: p?.summary ?? null, syncedAt: p?.updatedAt?.getTime() ?? null };
    }),
  });
}

/** Back-office : créer un utilisateur (toujours simple utilisateur, il n'y a qu'un admin). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await readJson<{ name?: string; email?: string; password?: string }>(req);
  const v = validateAccount(body);
  if ("error" in v) return fail(v.error!);
  const col = await users();
  if (await col.findOne({ email: v.email })) return fail("Un compte existe déjà avec cette adresse e-mail.", 409);
  const doc = {
    email: v.email,
    name: v.name,
    passwordHash: await hashPassword(v.password),
    role: roleFor(v.email),
    createdAt: new Date(),
  };
  const { insertedId } = await col.insertOne(doc as never);
  return json({ user: publicUser({ ...doc, _id: insertedId }) }, 201);
}
