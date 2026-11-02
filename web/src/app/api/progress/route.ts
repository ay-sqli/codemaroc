import { progress, summarize } from "@/lib/server/db";
import { fail, json, requireUser } from "@/lib/server/auth-routes";

/** Progression de l'utilisateur connecté. */
export async function GET() {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const doc = await (await progress()).findOne({ _id: u._id });
  return json({ state: doc?.state ?? null, updatedAt: doc?.updatedAt?.getTime() ?? null });
}

/** Enregistre la progression (état complet de l'app, voir lib/store.ts). */
export async function PUT(req: Request) {
  const u = await requireUser();
  if (u instanceof Response) return u;
  const raw = await req.text();
  if (raw.length > 3_000_000) return fail("Progression trop volumineuse.", 413);
  let body: { state?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("JSON invalide.");
  }
  const state = body.state as { v?: number } | undefined;
  if (!state || typeof state !== "object" || state.v !== 1) return fail("État de progression invalide.");
  const updatedAt = new Date();
  await (await progress()).updateOne({ _id: u._id }, { $set: { state, summary: summarize(state), updatedAt } }, { upsert: true });
  return json({ ok: true, updatedAt: updatedAt.getTime() });
}
