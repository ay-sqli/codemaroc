import data from "@/data/courses_fr.json";
import { withBase } from "./base";

/** Fiche française d'un chapitre (chargée seulement côté serveur, par la page du cours). */
export function ficheFr(slug: string): string | undefined {
  const md = (data as Record<string, string>)[slug];
  return md ? withBase(md) : undefined;
}
