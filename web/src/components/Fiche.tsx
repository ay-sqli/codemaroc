import { AlertTriangle, Ban, CirclePlay, Lightbulb, type LucideIcon } from "lucide-react";
import { parseMd, splitTitle, type MdNode, type MdSection } from "@/lib/md";
import { stripEmoji } from "@/lib/courses";
import { enrich, illustrationFor } from "@/lib/illustrate";
import { T } from "@/lib/i18n";

/**
 * Fiche de cours lisible : une carte par section (numéro, titre, illustration), chiffres et flèches
 * mis en évidence, images du cours regroupées en cartes visuelles, astuces en post-it, pièges en
 * cartes rouges.
 */

const html = (n: MdNode) => enrich(n.html);

/** Une ligne de texte : puce colorée, texte aéré, sous-points en retrait. */
function Row({ n, tone }: { n: MdNode; tone: string }) {
  return (
    <li className="fiche-row">
      <span className="fiche-dot" style={{ background: tone }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p dangerouslySetInnerHTML={{ __html: html(n) }} />
        {n.children.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {n.children.map((c, i) => (
              <li key={i} className="rounded-[12px] bg-[var(--c-grey-100)] px-3 py-2 text-[16px]" dangerouslySetInnerHTML={{ __html: html(c) }} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Image du cours + sa légende, en carte (cliquable pour agrandir).
 * L'image occupe toute la largeur de la carte, au-dessus du texte : un document (permis, carte grise…)
 * ou un schéma reste lisible sur mobile comme sur ordinateur, et ne déborde jamais de son cadre.
 */
function Visual({ n }: { n: MdNode }) {
  const big = n.imgClass === "big" || n.imgClass === "xl";
  return (
    <figure className={`fiche-visual ${big ? "sm:col-span-2" : ""}`}>
      <span className={`block w-full overflow-hidden rounded-[14px] bg-white p-2 ${big ? "h-56 sm:h-72" : "h-40 sm:h-44"}`}>
        <img src={n.img} alt="" data-zoom data-caption={stripEmoji(n.text)} loading="lazy" className="block h-full w-full object-contain" />
      </span>
      <figcaption className="min-w-0 px-1 pb-0.5" dangerouslySetInnerHTML={{ __html: html(n) }} />
    </figure>
  );
}

/** Regroupe les éléments consécutifs : suites d'images → grille de cartes ; suites de texte → liste. */
function Blocks({ items, tone }: { items: MdNode[]; tone: string }) {
  const groups: { img: boolean; list: MdNode[] }[] = [];
  for (const it of items) {
    const img = !!it.img;
    const last = groups[groups.length - 1];
    if (last && last.img === img) last.list.push(it);
    else groups.push({ img, list: [it] });
  }
  return (
    <div className="space-y-4">
      {groups.map((g, i) =>
        g.img && g.list.length >= 4 && g.list.every((n) => !n.imgClass) ? (
          // Galerie de panneaux : vignette au-dessus, signification dessous
          <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {g.list.map((n, j) => (
              <figure key={j} className="flex flex-col items-center gap-2 rounded-[18px] border-2 border-line bg-white p-2.5 text-center shadow-[0_3px_0_var(--c-grey-200)] sm:p-3">
                <span className="block h-28 w-full overflow-hidden sm:h-36">
                  <img src={n.img} alt="" data-zoom data-caption={stripEmoji(n.text)} loading="lazy" className="block h-full w-full object-contain" />
                </span>
                <figcaption className="text-[14px] font-[600] leading-snug text-ink" dangerouslySetInnerHTML={{ __html: html(n) }} />
              </figure>
            ))}
          </div>
        ) : g.img ? (
          <div key={i} className="grid gap-3 sm:grid-cols-2">
            {g.list.map((n, j) => (
              <Visual key={j} n={n} />
            ))}
          </div>
        ) : (
          <ul key={i} className="space-y-3">
            {g.list.map((n, j) => (
              <Row key={j} n={n} tone={tone} />
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

/** Couleur d'accent qui tourne d'une section à l'autre (charte Code Maroc). */
const TONES = ["#d92b2b", "#198754", "#2980b9", "#f39c12", "#1b4f72"];

function Special({ s }: { s: MdSection }) {
  const t = splitTitle(s.title);
  const conf: { Icon: LucideIcon; Mark: LucideIcon; c: string; label: React.ReactNode; box: string; item: string } = {
    tips: { Icon: Lightbulb, Mark: Lightbulb, c: "#b9770e", label: <T fr="Astuces du moniteur" ar="نصائح المدرب" />, box: "border-[#ffe17a] bg-[#fef9e7]", item: "bg-white border-[#ffe17a]" },
    traps: { Icon: AlertTriangle, Mark: Ban, c: "#c0392b", label: <T fr="Pièges d'examen" ar="فخاخ الامتحان" />, box: "border-[#ffb2b2] bg-[#fdedec]", item: "bg-white border-[#ffb2b2]" },
    video: { Icon: CirclePlay, Mark: CirclePlay, c: "#1f618d", label: <T fr="Contenu vidéo sur Perminou" ar="محتوى فيديو على Perminou" />, box: "border-[#a9cce3] bg-[#ebf5fb]", item: "bg-white border-[#a9cce3]" },
  }[s.kind as "tips" | "traps" | "video"];
  return (
    <section id={`s-${s.kind}`} className={`fiche-card scroll-mt-28 border-2 ${conf.box}`}>
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[14px] bg-white shadow-[0_3px_0_rgb(0_0_0/0.08)] sm:size-12 sm:rounded-[16px]" aria-hidden="true">
          <conf.Icon className="size-6" style={{ color: conf.c }} strokeWidth={2.4} />
        </span>
        <h2 className="t-h3">{conf.label}</h2>
        <span className="only-fr ar text-sm text-muted">{stripEmoji(t.ar)}</span>
      </header>
      <ul className="grid gap-2.5 md:grid-cols-2">
        {s.items.map((n, i) => (
          <li key={i} className={`ar flex items-start gap-2.5 rounded-[16px] border-2 p-3 text-[16.5px] leading-[1.9] sm:gap-3 sm:p-3.5 ${conf.item}`}>
            <conf.Mark className="mt-1.5 size-5 shrink-0" style={{ color: conf.c }} strokeWidth={2.4} aria-hidden="true" />
            <span className="min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: html(n) }} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({ s, n }: { s: MdSection; n: number }) {
  if (s.kind !== "normal") return <Special s={s} />;
  const t = splitTitle(s.title);
  const ar = stripEmoji(t.ar);
  const tone = TONES[(n - 1) % TONES.length];
  const hasImg = s.items.some((it) => it.img);
  // Illustration de l'app quand la section n'a pas d'image du cours (mots-clés du titre, puis du texte).
  const pic = hasImg ? null : illustrationFor(`${s.title} ${s.items.map((i) => i.text).join(" ")}`);
  return (
    <section id={`s-${n}`} className="fiche-card scroll-mt-28 border-2 border-line bg-white" style={{ boxShadow: "0 4px 0 var(--c-grey-300)" }}>
      <header className="mb-4 flex items-start gap-3 sm:mb-5 sm:gap-4">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-[14px] font-[family-name:var(--font-display)] text-[18px] font-[900] text-white sm:size-12 sm:rounded-[16px] sm:text-[20px]"
          style={{ background: tone, boxShadow: `0 3px 0 ${tone}99` }}
          aria-hidden="true"
        >
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-[800] uppercase tracking-wider" style={{ color: tone }}>
            <T fr={`Partie ${n}`} ar={`الجزء ${n}`} />
            {t.fr && <span className="ms-2 normal-case tracking-normal text-muted">· {t.fr}</span>}
          </p>
          <h2 className="ar mt-0.5 text-[20px] font-[800] leading-snug text-[var(--c-grey-975)] sm:text-[22px]">{ar}</h2>
        </div>
        {pic && (
          <img
            src={pic.url}
            alt=""
            loading="lazy"
            className={`shrink-0 object-contain ${pic.kind === "tile" ? "h-14 w-16 rounded-[12px] object-cover sm:h-20 sm:w-24 sm:rounded-[14px]" : pic.kind === "mascot" ? "h-14 w-auto sm:h-20" : "h-12 w-auto sm:h-16"}`}
          />
        )}
      </header>
      <div className="ar">
        <Blocks items={s.items} tone={tone} />
      </div>
    </section>
  );
}

/** Sommaire de la fiche (ancres vers chaque partie). */
export function ficheOutline(md: string) {
  const doc = parseMd(md);
  let n = 0;
  return doc.sections.map((s) => {
    const t = splitTitle(s.title);
    if (s.kind === "normal") n++;
    return {
      id: s.kind === "normal" ? `s-${n}` : `s-${s.kind}`,
      kind: s.kind,
      n,
      tone: TONES[(Math.max(1, n) - 1) % TONES.length],
      ar: stripEmoji(t.ar),
      fr: s.kind === "tips" ? "Astuces du moniteur" : s.kind === "traps" ? "Pièges d'examen" : s.kind === "video" ? "Vidéo" : t.fr || stripEmoji(t.ar),
    };
  });
}

export function Fiche({ md }: { md: string }) {
  const doc = parseMd(md);
  let n = 0;
  return (
    <div className="space-y-6">
      {doc.sections.map((s, i) => {
        if (s.kind === "normal") n++;
        return <Section key={i} s={s} n={n} />;
      })}
    </div>
  );
}
