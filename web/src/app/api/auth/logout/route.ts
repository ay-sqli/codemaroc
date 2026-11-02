import { endSession, json } from "@/lib/server/auth-routes";

export async function POST() {
  await endSession();
  return json({ ok: true });
}
