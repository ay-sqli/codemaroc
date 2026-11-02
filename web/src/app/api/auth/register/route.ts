import { users } from "@/lib/server/db";
import { fail, hashPassword, json, publicUser, readJson, startSession, validateAccount } from "@/lib/server/auth-routes";

/** Création de compte. Le tout premier compte devient administrateur. */
export async function POST(req: Request) {
  const v = validateAccount(await readJson(req));
  if ("error" in v) return fail(v.error!);
  const col = await users();
  if (await col.findOne({ email: v.email })) return fail("Un compte existe déjà avec cette adresse e-mail.", 409);
  const firstAdmin = (await col.countDocuments({ role: "admin" })) === 0;
  const now = new Date();
  const doc = {
    email: v.email,
    name: v.name,
    passwordHash: await hashPassword(v.password),
    role: firstAdmin ? ("admin" as const) : ("user" as const),
    createdAt: now,
    lastLoginAt: now,
  };
  const { insertedId } = await col.insertOne(doc as never);
  await startSession(insertedId.toHexString());
  return json({ user: publicUser({ ...doc, _id: insertedId }) }, 201);
}
