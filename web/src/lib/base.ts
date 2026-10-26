/**
 * Préfixe d'hébergement (ex. « /codemaroc » sur GitHub Pages, vide en local).
 * next/link et le routeur l'ajoutent seuls ; les chemins bruts (<img>, <audio>, fetch, <a>) passent par asset().
 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** « /media/x.png » → « /codemaroc/media/x.png » (les URL externes et relatives sont laissées telles quelles). */
export function asset<T extends string | null | undefined>(p: T): T {
  return (p && BASE && p.startsWith("/") && !p.startsWith("//") ? BASE + p : p) as T;
}

/** Préfixe les src="/…" du HTML embarqué dans le Markdown des fiches. */
export function withBase(html: string) {
  return BASE ? html.replace(/src="\/(?!\/)/g, `src="${BASE}/`) : html;
}
