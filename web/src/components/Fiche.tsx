import { AlertTriangle, Film, Lightbulb } from "lucide-react";
import { parseMd, splitTitle, type MdNode, type MdSection } from "@/lib/md";
import { stripEmoji } from "@/lib/courses";
import { T } from "@/lib/i18n";

function Node({ n }: { n: MdNode }) {
  return (
    <li className="leading-relaxed">
      <span className="inline-flex items-start gap-3">
        {n.img && <img src={n.img} alt="" data-zoom data-caption={stripEmoji(n.text)} className={n.imgClass ?? ""} loading="lazy" />}
        <span dangerouslySetInnerHTML={{ __html: stripEmoji(n.html) }} />
      </span>
      {n.children.length > 0 && (
        <ul className="mt-2 space-y-1.5 border-s-2 border-line ps-4">
          {n.children.map((c, i) => (
            <Node key={i} n={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Une section composée surtout de « image + intitulé » s'affiche en galerie. */
function isGallery(s: MdSection) {
  const withImg = s.items.filter((i) => i.img && !i.imgClass);
  return withImg.length >= 4 && withImg.length / s.items.length >= 0.7;
}

const SPECIAL: Record<string, { label: React.ReactNode; icon: React.ReactNode; box: string }> = {
  tips: { label: <T fr="Astuces du moniteur" ar="نصائح المدرب" />, icon: <Lightbulb className="size-5 text-warn" />, box: "border-[#f3d38a] bg-warn-50" },
  traps: { label: <T fr="Pièges d'examen" ar="فخاخ الامتحان" />, icon: <AlertTriangle className="size-5 text-ko" />, box: "border-[#f2c2c2] bg-ko-50" },
  video: { label: <T fr="Contenu vidéo sur Perminou" ar="محتوى فيديو على Perminou" />, icon: <Film className="size-5 text-brand" />, box: "border-brand-200 bg-brand-50" },
};

function Section({ s, n }: { s: MdSection; n: number }) {
  const t = splitTitle(s.title);
  const ar = stripEmoji(t.ar);
  const special = s.kind !== "normal" ? SPECIAL[s.kind] : null;

  if (special)
    return (
      <section className={`rounded-[8px] border p-5 sm:p-6 ${special.box}`}>
        <header className="mb-3 flex flex-wrap items-center gap-2">
          {special.icon}
          <h2 className="t-h4">{special.label}</h2>
          <span className="only-fr ar text-sm text-muted">{ar}</span>
        </header>
        <ul className="fiche ar list-disc space-y-2 ps-5 text-[15px] text-ink-2 marker:text-muted">
          {s.items.map((it, i) => (
            <Node key={i} n={it} />
          ))}
        </ul>
      </section>
    );

  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-baseline gap-3">
          <span className="text-sm font-semibold text-muted">{String(t.num || n).padStart(2, "0")}</span>
          <span className="ar t-h3 text-ink">{ar}</span>
        </h2>
        {t.fr && <span className="text-sm text-muted">{t.fr}</span>}
      </header>
      {isGallery(s) ? (
        <div className="ar grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {s.items.map((it, i) => (
            <figure key={i} className="flex flex-col items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-center">
              {it.img ? <img src={it.img} alt={stripEmoji(it.text)} data-zoom loading="lazy" className="h-20 w-auto object-contain" /> : null}
              <figcaption className="text-[13px] leading-snug text-ink-2" dangerouslySetInnerHTML={{ __html: stripEmoji(it.html) }} />
            </figure>
          ))}
        </div>
      ) : (
        <ul className="fiche ar list-disc space-y-2.5 ps-5 text-[15px] text-ink-2 marker:text-subtle">
          {s.items.map((it, i) => (
            <Node key={i} n={it} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Fiche({ md }: { md: string }) {
  const doc = parseMd(md);
  let n = 0;
  return (
    <div className="space-y-8">
      {doc.sections.map((s, i) => {
        if (s.kind === "normal") n++;
        return <Section key={i} s={s} n={n} />;
      })}
    </div>
  );
}
