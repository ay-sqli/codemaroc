/**
 * Mini-parseur du Markdown des fiches (format produit par scripts/build_app.py) :
 *   # Titre
 *   ## Section
 *   - élément (indentation de 2 espaces = sous-élément), avec <img …> et **gras**.
 */

export interface MdNode {
  html: string;
  img?: string;
  imgClass?: string;
  text: string;
  children: MdNode[];
}

export interface MdSection {
  title: string;
  kind: "normal" | "tips" | "traps" | "video";
  items: MdNode[];
}

export interface MdDoc {
  title: string;
  sections: MdSection[];
}

function inline(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function plain(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\*\*/g, "").trim();
}

export function parseMd(md: string): MdDoc {
  const doc: MdDoc = { title: "", sections: [] };
  let section: MdSection | null = null;
  const stack: { depth: number; node: MdNode }[] = [];

  for (const raw of md.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (raw.startsWith("# ")) {
      doc.title = raw.slice(2).trim();
      continue;
    }
    if (raw.startsWith("## ")) {
      const title = raw.slice(3).trim();
      const kind = title.includes("نصائح المدرب") ? "tips" : title.includes("فخاخ") ? "traps" : title.includes("Perminou") ? "video" : "normal";
      section = { title, kind, items: [] };
      doc.sections.push(section);
      stack.length = 0;
      continue;
    }
    const m = raw.match(/^(\s*)-\s+(.*)$/);
    if (!m || !section) continue;
    const depth = Math.floor(m[1].length / 2);
    const body = m[2];
    const im = body.match(/<img src="([^"]+)"(?: class="(\w+)")?>/);
    const node: MdNode = {
      html: inline(body.replace(/<img[^>]*>\s*/, "")),
      img: im?.[1],
      imgClass: im?.[2],
      text: plain(body),
      children: [],
    };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else section.items.push(node);
    stack.push({ depth, node });
  }
  return doc;
}

/** Sépare « 🛑 1. Titre arabe (Titre FR) » en morceaux pour l'affichage. */
export function splitTitle(t: string) {
  const m = t.match(/^(\S+)\s+(?:(\d+)\.\s*)?(.*?)\s*(?:\(([^)]+)\))?$/u);
  if (!m) return { emoji: "", num: "", ar: t, fr: "" };
  return { emoji: m[1], num: m[2] ?? "", ar: m[3], fr: m[4] ?? "" };
}
