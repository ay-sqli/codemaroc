"use client";

import { useMemo, useState } from "react";
import { Eye, RotateCcw, Shuffle } from "lucide-react";
import { MEMO, memoGroupText, memoText, type MemoItem } from "@/lib/memo";
import { useLang } from "@/lib/i18n";
import { Breadcrumbs, Button, PageHeader, PillTabs, cx } from "@/components/ui";

function FlashCard({ item }: { item: MemoItem }) {
  const { lang, t } = useLang();
  const [flip, setFlip] = useState(false);
  const it = memoText(item, lang);
  return (
    <button
      onClick={() => setFlip((f) => !f)}
      aria-pressed={flip}
      className={cx("flex min-h-44 flex-col rounded-[8px] border bg-white p-5 text-start transition-shadow hover:shadow-md", flip ? "border-brand" : "border-line")}
    >
      <p className="text-xs text-muted">{flip ? t("Réponse", "الجواب") : t("Question", "السؤال")}</p>
      <p className="mt-1 text-base font-semibold text-ink">{it.q}</p>
      {flip ? (
        <div className="animate-pop mt-3 space-y-3">
          <p className="text-[15px] font-semibold text-brand">{it.a}</p>
          <p className="rounded-[4px] bg-warn-50 px-3 py-2 text-sm text-ink-2">
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
        <Breadcrumbs items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Mémo & astuces", "المذكرة والحيل") }]} />
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
        <section className="rounded-[8px] bg-panel p-5">
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

      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <h2 className="t-h2">{gt.title}</h2>
            <p className="mt-2 text-base text-ink-2">{gt.intro}</p>
          </div>
          <div className="divide-y divide-line rounded-[8px] border border-line">
            {group.items.map((raw) => {
              const it = memoText(raw, lang);
              return (
                <div key={raw.q} className="grid gap-2 p-5 sm:grid-cols-[1fr_1.2fr] sm:gap-6">
                  <p className="font-semibold text-ink">{it.q}</p>
                  <div className="space-y-2">
                    <p className="text-[15px] font-semibold text-brand">{it.a}</p>
                    <p className="text-sm text-ink-2">
                      <span className="font-semibold text-warn">{t("Astuce : ", "الحيلة: ")}</span>
                      {it.hook}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
