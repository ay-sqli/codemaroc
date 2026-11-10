import data from "@/data/pictos.json";
import { asset } from "./base";

/**
 * Petites images glissées dans le texte : après un mot-clé (« sens interdit », « ceinture »…),
 * on place le panneau ou le pictogramme correspondant pour que la lecture soit immédiate.
 * Le dictionnaire (content/pictos.json) ne contient que des images contrôlées une à une.
 */

type Lang = "fr" | "ar";
interface Entry {
  url: string;
  re: RegExp;
}

const AR_LETTER = "\\u0600-\\u06FF";
const FR_LETTER = "A-Za-zÀ-ÿ";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function compile(lang: Lang): Entry[] {
  return (data as { url: string; ar: string[]; fr: string[] }[]).map((e) => {
    const terms = [...e[lang]].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
    if (lang === "ar") {
      // Préfixes arabes attachés au mot : و ب ف ل.
      return { url: e.url, re: new RegExp(`(?<![${AR_LETTER}])[وبفل]?(?:${terms})(?![${AR_LETTER}])`, "u") };
    }
    const exact = e.fr.every((t) => t === t.toUpperCase());
    return { url: e.url, re: new RegExp(`(?<![${FR_LETTER}])(?:${terms})(?![${FR_LETTER}])`, exact ? "u" : "iu") };
  });
}

const compiled: Partial<Record<Lang, Entry[]>> = {};

function pictoTag(url: string, caption: string) {
  const alt = caption.replace(/"/g, "&quot;");
  return `<img src="${asset(url)}" alt="" class="picto" data-zoom data-caption="${alt}" loading="lazy">`;
}

/**
 * Ajoute jusqu'à `max` petites images dans un HTML de ligne de texte, sans toucher aux balises.
 * Chaque image n'apparaît qu'une fois par ligne.
 */
export function withPictos(html: string, lang: Lang, max = 3) {
  const entries = (compiled[lang] ??= compile(lang));
  const parts = html.split(/(<[^>]+>)/);
  const used = new Set<string>();
  // Une image déjà présente dans la ligne n'est pas répétée.
  for (const m of html.matchAll(/<img src="([^"]+)"/g)) used.add(m[1]);
  let left = max;
  return parts
    .map((part) => {
      if (!part || part.startsWith("<") || left <= 0) return part;
      const taken: { start: number; end: number; url: string; text: string }[] = [];
      for (const e of entries) {
        if (left <= 0) break;
        const url = asset(e.url);
        if (used.has(url)) continue;
        const m = e.re.exec(part);
        if (!m) continue;
        const start = m.index;
        const end = start + m[0].length;
        if (taken.some((t) => start < t.end && end > t.start)) continue;
        taken.push({ start, end, url: e.url, text: m[0] });
        used.add(url);
        left--;
      }
      if (!taken.length) return part;
      taken.sort((a, b) => a.start - b.start);
      let out = "";
      let pos = 0;
      for (const t of taken) {
        // Après le mot : on ne coupe pas un article de son nom (« l'autoroute »).
        out += part.slice(pos, t.end) + pictoTag(t.url, t.text);
        pos = t.end;
      }
      return out + part.slice(pos);
    })
    .join("");
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
