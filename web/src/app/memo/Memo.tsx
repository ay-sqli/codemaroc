"use client";

import { BackBar } from "@/components/BackButton";
import { useMemo, useState } from "react";
import { Eye, Lightbulb, RotateCcw, Shuffle } from "lucide-react";
import { MEMO, memoGroupText, memoText, type MemoItem } from "@/lib/memo";
import { useLang } from "@/lib/i18n";
import { Button, PageHeader, PillTabs, cx } from "@/components/ui";
import { enrich } from "@/lib/illustrate";
import { asset } from "@/lib/base";

const HAS_AR = /[؀-ۿ]/;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Texte mémo → HTML avec chiffres et flèches mis en évidence. */
const rich = (s: string) => ({ __html: enrich(esc(s)) });

function FlashCard({ item }: { item: MemoItem }) {
  const { lang, t } = useLang();
  const [flip, setFlip] = useState(false);
  const it = memoText(item, lang);
  return (
    <button
      onClick={() => setFlip((f) => !f)}
      aria-pressed={flip}
      className={cx(
        "flex min-h-40 flex-col rounded-[20px] border-2 bg-white p-4 text-start shadow-[0_3px_0_var(--c-grey-300)] transition-transform active:translate-y-0.5 sm:p-5",
        flip ? "border-[#2980b9]" : "border-line",
      )}
    >
      <p className="text-xs text-muted">{flip ? t("Réponse", "الجواب") : t("Question", "السؤال")}</p>
      <p className="mt-1 text-base font-semibold text-ink">{it.q}</p>
      {flip ? (
        <div className="animate-pop mt-3 space-y-3">
          <p className="text-[15px] font-[700] leading-relaxed text-ink" dangerouslySetInnerHTML={rich(it.a)} />
          <p className="rounded-[12px] bg-warn-50 px-3 py-2 text-sm text-ink-2">
            <span className="font-semibold text-warn">{t("Moyen mnémotechnique : ", "حيلة للحفظ: ")}</span>
            {it.hook}
          </p>
        </div>
      ) : (
        <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand">
          <Eye className="size-4" /> {t("Réfléchis, puis clique pour vérifier", "فكّر، ثم انقر للتحقق")}
        </p>
      )}
    </button>
  );
}

export function Memo() {
  const { lang, t } = useLang();
  const [g, setG] = useState(MEMO[0].id);
  const [quiz, setQuiz] = useState(false);
  const [seed, setSeed] = useState(0);
  const group = MEMO.find((x) => x.id === g)!;
  const gt = memoGroupText(group, lang);
  const random = useMemo(() => {
    void seed;
    return MEMO.flatMap((x) => x.items)
      // eslint-disable-next-line react-hooks/purity
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
  }, [seed]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <BackBar items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Mémo & astuces", "المذكرة والحيل") }]} />
        <PageHeader
          title={t("Mémo & astuces mnémotechniques", "المذكرة وحيل الحفظ")}
          desc={t(
            "Points, amendes, vitesses, distances, âges : chaque chiffre a son « crochet » mental. Lis l'astuce, puis teste-toi. Retrouver la réponse de tête est ce qui la grave dans ta mémoire.",
            "النقط، الغرامات، السرعات، المسافات، السن: لكل رقم « خطّاف » ذهني. اقرأ الحيلة، ثم اختبر نفسك. تذكّر الجواب من ذاكرتك هو ما يرسّخه فيها.",
          )}
          actions={
            <Button
              variant="secondary"
              icon={<Shuffle className="size-4" />}
              onClick={() => {
                setQuiz(true);
                setSeed((s) => s + 1);
              }}
            >
              {t("Test éclair : 6 cartes au hasard", "اختبار سريع: 6 بطاقات عشوائية")}
            </Button>
          }
        />
      </div>

      {quiz && (
        <section className="rounded-[16px] bg-panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="t-h4">{t("Test éclair", "اختبار سريع")}</h2>
            <div className="flex gap-2">
              <Button variant="tertiary" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => setSeed((s) => s + 1)}>
                {t("Autres cartes", "بطاقات أخرى")}
              </Button>
              <Button variant="tertiary" size="sm" onClick={() => setQuiz(false)}>
                {t("Fermer", "إغلاق")}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {random.map((it) => (
              <FlashCard key={it.q + seed + lang} item={it} />
            ))}
          </div>
        </section>
      )}

      <PillTabs items={MEMO.map((x) => ({ id: x.id, label: memoGroupText(x, lang).title }))} value={g} onChange={setG} />

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="flex items-start gap-4 rounded-[24px] border-2 border-line bg-white p-4 shadow-[0_4px_0_var(--c-grey-300)] sm:p-5">
            <img src={asset("/mascot/teacher.webp")} alt="" className="h-20 w-auto shrink-0 sm:h-24" />
            <div className="min-w-0">
              <h2 className="text-[20px] font-[800] leading-snug text-[var(--c-grey-975)] sm:text-[24px]">{gt.title}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2 sm:text-base">{gt.intro}</p>
            </div>
          </div>
          <ol className="grid gap-4 xl:grid-cols-2">
            {group.items.map((raw, i) => {
              const it = memoText(raw, lang);
              return (
                <li key={raw.q} className="flex flex-col overflow-hidden rounded-[22px] border-2 border-line bg-white shadow-[0_4px_0_var(--c-grey-300)]">
                  <div className="flex items-start gap-3 p-4 pb-3 sm:p-5 sm:pb-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#d92b2b] text-[14px] font-[800] text-white">{i + 1}</span>
                    <h3 className={cx("text-[17px] font-[800] leading-snug text-[var(--c-grey-975)] sm:text-[18px]", HAS_AR.test(it.q) && "ar")}>{it.q}</h3>
                  </div>
                  <p
                    className={cx("mx-4 rounded-[14px] bg-[#ebf5fb] px-3.5 py-3 text-[16px] font-[600] leading-[1.85] text-ink sm:mx-5", HAS_AR.test(it.a) && "ar")}
                    dangerouslySetInnerHTML={rich(it.a)}
                  />
                  <div className="mt-auto flex items-start gap-2.5 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                    <Lightbulb className="mt-1 size-5 shrink-0 text-[#d68910]" strokeWidth={2.4} aria-hidden="true" />
                    <p className="text-[15px] leading-relaxed text-ink-2">
                      <span className="font-[800] text-[#b9770e]">{t("Astuce : ", "الحيلة: ")}</span>
                      <span className={cx(HAS_AR.test(it.hook) && "ar")}>{it.hook}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <h2 className="t-h4">{t("Teste-toi sur ce thème", "اختبر نفسك في هذا الموضوع")}</h2>
          {group.items.slice(0, 4).map((it) => (
            <FlashCard key={"f" + it.q + lang} item={it} />
          ))}
        </aside>
      </section>
    </div>
  );
}
