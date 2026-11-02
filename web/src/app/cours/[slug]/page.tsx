import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { CHAPTERS, chapterIndex, coverOf, ficheStats, getChapter, moduleOf, neighbours, stripEmoji } from "@/lib/courses";
import { Fiche, ficheOutline } from "@/components/Fiche";
import { ChapterTabs } from "@/components/ChapterTabs";
import { ChapterActions, ChapterScore } from "@/components/CourseStatus";
import { SCHEMA_META, schemasForChapter } from "@/lib/schemaMeta";
import { T } from "@/lib/i18n";
import { Breadcrumbs, ChapterCover, ModuleIcon } from "@/components/ui";
import { asset } from "@/lib/base";

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getChapter(slug);
  return { title: c ? `${c.fr} · ${stripEmoji(c.ar)} — Code Maroc` : "Cours" };
}

/** Nombre accordé en arabe pour les compteurs de l'en-tête. */
function arCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 1) return `1 ${one}`;
  if (n === 2) return two;
  return n <= 10 ? `${n} ${few}` : `${n} ${many}`;
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getChapter(slug);
  const m = moduleOf(slug);
  if (!c || !m || !c.md) notFound();
  const { prev, next } = neighbours(slug);
  const idx = chapterIndex(slug);
  const st = ficheStats(c);
  const outline = ficheOutline(c.md);
  const schemas = schemasForChapter(slug).filter((id) => SCHEMA_META[id]);
  const arTitle = stripEmoji(c.ar);

  return (
    <div className="space-y-8">
      {/* En-tête de cours */}
      <section className="zellige zellige-dark -mx-4 -mt-6 bg-[linear-gradient(180deg,#fdedec_0%,transparent_100%)] px-4 pb-8 pt-6 sm:-mx-6 sm:px-6 lg:-mt-8 lg:pt-8">
        <Breadcrumbs
          items={[
            { label: <T fr="Cours" ar="الدروس" />, href: "/cours/" },
            { label: <T fr={m.fr} ar={stripEmoji(m.ar)} />, href: `/cours/?axe=${m.id}` },
            { label: <T fr={`Chapitre ${idx}`} ar={`الدرس ${idx}`} /> },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ModuleIcon id={m.id} size="md" />
              <div className="text-sm">
                <p className="font-semibold text-ink">
                  <T fr={`Axe ${m.id} · ${m.fr}`} ar={`المحور ${m.id} · ${stripEmoji(m.ar)}`} />
                </p>
                <p className="text-muted">
                  <T fr="Programme Perminou-NARSA · Permis B" ar="برنامج Perminou-NARSA · رخصة صنف ب" />
                </p>
              </div>
            </div>
            <h1 className="t-display text-ink">
              <T fr={c.fr} ar={arTitle} />
            </h1>
            <p className="text-xl text-ink-2">
              <span className="only-fr ar block">{arTitle}</span>
              <span className="only-ar">{c.fr}</span>
            </p>
            <ChapterActions slug={slug} />
          </div>
          <div className="hidden overflow-hidden rounded-[16px] border-2 border-line bg-white lg:block">
            <div className="aspect-[16/10]">
              <ChapterCover module={m.id} img={coverOf(c)} />
            </div>
          </div>
        </div>

        {/* Ligne d'informations */}
        <div className="mt-8 grid grid-cols-2 divide-line rounded-[16px] border-2 border-line bg-white shadow-sm md:grid-cols-4 md:divide-x rtl:md:divide-x-reverse">
          <div className="p-4">
            <p className="text-base font-semibold">
              <T fr={`${st.sections} sections`} ar={arCount(st.sections, "قسم", "قسمان", "أقسام", "قسما")} />
            </p>
            <p className="text-sm text-muted">
              <T fr="Fiche résumée et mindmap" ar="ملخص وخريطة ذهنية" />
            </p>
          </div>
          <div className="p-4">
            <p className="text-base font-semibold">
              {c.nCards ? (
                <T fr={`${c.nCards} panneaux`} ar={arCount(c.nCards, "علامة", "علامتان", "علامات", "علامة")} />
              ) : (
                <T fr="Règles et schémas" ar="قواعد ورسوم" />
              )}
            </p>
            <p className="text-sm text-muted">
              {c.nCards ? <T fr="En mode flashcards" ar="على شكل بطاقات" /> : <T fr="Astuces du moniteur" ar="نصائح المدرب" />}
            </p>
          </div>
          <div className="p-4">
            <p className="text-base font-semibold">
              <T fr={`${st.minutes} minutes`} ar={arCount(st.minutes, "دقيقة", "دقيقتان", "دقائق", "دقيقة")} />
            </p>
            <p className="text-sm text-muted">
              <T fr="Temps de lecture estimé" ar="مدة القراءة التقديرية" />
            </p>
          </div>
          <div className="p-4">
            <ChapterScore slug={slug} />
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <ChapterTabs md={c.md} title={c.fr} titleAr={arTitle} slug={slug} hasCards={!!c.nCards}>
            {/* Sommaire en puces défilantes (téléphone / tablette ; sur grand écran il est dans la colonne de droite) */}
            <nav className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden" aria-label="Sommaire">
              {outline.map((o) => (
                <a
                  key={o.id}
                  href={`#${o.id}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border-2 border-line bg-white py-1 pe-3.5 ps-1 text-[13px] font-[700] text-ink-2 shadow-[0_2px_0_var(--c-grey-200)]"
                >
                  <span
                    className="grid size-6 place-items-center rounded-full text-[11px] font-[800] text-white"
                    style={{ background: o.kind === "tips" ? "#f5b041" : o.kind === "traps" ? "#e74c3c" : o.kind === "video" ? "#2980b9" : o.tone }}
                  >
                    {o.kind === "normal" ? o.n : o.kind === "tips" ? "!" : o.kind === "traps" ? "×" : "▸"}
                  </span>
                  <span className="max-w-[11rem] truncate">
                    <T fr={o.fr} ar={o.ar} />
                  </span>
                </a>
              ))}
            </nav>
            <Fiche md={c.md} />
          </ChapterTabs>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-[24px] border-2 border-line bg-white p-4" aria-label="Sommaire">
            <p className="mb-2 px-1 text-[15px] font-[800]">
              <T fr="Au programme" ar="محتوى الدرس" />
            </p>
            <ol className="space-y-1">
              {outline.map((o) => (
                <li key={o.id}>
                  <a href={`#${o.id}`} className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-[14px] font-[600] text-ink-2 hover:bg-panel">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-[9px] text-[13px] font-[800] text-white"
                      style={{ background: o.kind === "tips" ? "#f5b041" : o.kind === "traps" ? "#e74c3c" : o.kind === "video" ? "#2980b9" : o.tone }}
                      aria-hidden="true"
                    >
                      {o.kind === "normal" ? o.n : o.kind === "tips" ? "!" : o.kind === "traps" ? "×" : "▸"}
                    </span>
                    <span className="min-w-0 flex-1 leading-snug">
                      <T fr={o.fr} ar={o.ar} />
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {schemas.map((id) => (
            <Link key={id} href={`/schemas/#${id}`} className="block rounded-[24px] border-2 border-line bg-white p-5 shadow-[0_4px_0_var(--c-grey-300)] transition-transform hover:-translate-y-0.5">
              <p className="t-overline mb-1">
                <T fr="Schéma animé" ar="رسم متحرك" />
              </p>
              <p className="text-base font-[800] text-ink">
                <T fr={SCHEMA_META[id].title} ar={SCHEMA_META[id].titleAr} />
              </p>
              <p className="mt-1 text-sm text-muted">
                <T fr={SCHEMA_META[id].desc} ar={SCHEMA_META[id].descAr} />
              </p>
              <span className="link mt-3 inline-flex items-center gap-1 text-sm">
                <T fr="Ouvrir le schéma" ar="فتح الرسم" /> <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
          {c.nCards ? (
            <a href={asset(`/anki/${slug}.csv`)} download className="flex items-center gap-3 rounded-[16px] border-2 border-line p-5 text-sm transition-shadow hover:shadow-md">
              <Download className="size-5 text-brand" />
              <span>
                <span className="block font-semibold text-ink">
                  <T fr="Cartes Anki (CSV)" ar="بطاقات Anki (CSV)" />
                </span>
                <span className="text-muted">
                  <T fr="Pour réviser sur ton téléphone" ar="للمراجعة على هاتفك" />
                </span>
              </span>
            </a>
          ) : null}
        </aside>
      </div>

      <nav className="grid gap-3 border-t-2 border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/cours/${prev.slug}/`} className="group rounded-[16px] border-2 border-line p-4 hover:shadow-md">
            <span className="flex items-center gap-1 text-sm text-muted">
              <ArrowLeft className="size-4" /> <T fr="Chapitre précédent" ar="الدرس السابق" />
            </span>
            <span className="mt-1 block font-semibold text-ink group-hover:underline">
              <T fr={prev.fr} ar={stripEmoji(prev.ar)} />
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/cours/${next.slug}/`} className="group rounded-[16px] border-2 border-line p-4 text-end hover:shadow-md">
            <span className="flex items-center justify-end gap-1 text-sm text-muted">
              <T fr="Chapitre suivant" ar="الدرس الموالي" /> <ArrowRight className="size-4" />
            </span>
            <span className="mt-1 block font-semibold text-ink group-hover:underline">
              <T fr={next.fr} ar={stripEmoji(next.ar)} />
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
