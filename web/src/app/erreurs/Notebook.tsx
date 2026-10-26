"use client";

import { useMemo, useState } from "react";
import { BellRing, ChevronDown, NotebookPen, Trash2 } from "lucide-react";
import { useBank } from "@/lib/questions";
import { removeFromNotebook, SRS_INTERVALS, useStore } from "@/lib/store";
import { getChapter, nameOf } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import { Correction, qText } from "@/components/QuizPlayer";
import {
  Badge, Breadcrumbs, ButtonLink, Callout, EmptyState, IconButton, ModuleIcon, PageHeader, Skeleton, Tabs, cx,
} from "@/components/ui";

type Filter = "due" | "1" | "2" | "3" | "4" | "5";
const BOX_LABEL: [string, string][] = [
  ["", ""],
  ["À revoir demain", "للمراجعة غدا"],
  ["Dans 2 jours", "بعد يومين"],
  ["Dans 4 jours", "بعد 4 أيام"],
  ["Dans 8 jours", "بعد 8 أيام"],
  ["Maîtrisée", "متقن"],
];

export function Notebook() {
  const { lang, t } = useLang();
  const { bank } = useBank();
  const srs = useStore((s) => s.srs);
  const answers = useStore((s) => s.answers);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("due");
  const [now] = useState(() => Date.now());

  const items = useMemo(
    () =>
      Object.entries(srs)
        .map(([id, it]) => ({ id, ...it, q: bank?.all.get(id), stat: answers[id] }))
        .filter((x) => x.q)
        .sort((a, b) => a.due - b.due),
    [srs, bank, answers],
  );
  const due = items.filter((i) => i.box < 5 && i.due <= now);
  const shown = filter === "due" ? due : items.filter((i) => i.box === Number(filter));
  const boxes = [1, 2, 3, 4, 5].map((b) => items.filter((i) => i.box === b).length);

  // Rappels : les règles des erreurs les plus fréquentes
  const reminders = useMemo(
    () =>
      items
        .filter((i) => i.q?.rappel && i.box < 5)
        .sort((a, b) => (b.stat?.ko ?? 0) - (a.stat?.ko ?? 0))
        .slice(0, 6),
    [items],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Carnet d'erreurs", "دفتر الأخطاء") }]} />
        <PageHeader
          title={t("Carnet d'erreurs", "دفتر الأخطاء")}
          desc={t(
            "Chaque question ratée revient selon la méthode Leitner : demain, puis après 2, 4, 8 et 16 jours. Bonne réponse : elle monte d'une boîte. Erreur : retour à la boîte 1.",
            "كل سؤال أخطأت فيه يعود حسب طريقة لايتنر: غدا، ثم بعد 2 و4 و8 و16 يوما. جواب صحيح: يصعد إلى العلبة الموالية. خطأ: يعود إلى العلبة 1.",
          )}
          actions={
            <ButtonLink href="/entrainement/session/?mode=notebook&n=30" size="lg" variant={due.length ? "primary" : "secondary"} icon={<BellRing className="size-4" />}>
              {t("Réviser maintenant", "راجع الآن")} ({due.length})
            </ButtonLink>
          }
        />
      </div>

      {reminders.length > 0 && (
        <Callout tone="tip" title={t("Tes rappels « à ne plus oublier »", "تذكيراتك « حتى لا تنسى »")}>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {reminders.map((r) => {
              const txt = qText(r.q!, lang).rappel!;
              return (
                <li key={r.id} className="flex items-start justify-between gap-3 rounded-[4px] bg-white p-3 text-[15px] text-ink">
                  <span className={cx(lang === "fr" && /[؀-ۿ]/.test(txt) && "ar")}>{txt}</span>
                  <Badge tone="error" className="shrink-0">
                    {t(`${r.stat?.ko ?? 1}× raté`, `${r.stat?.ko ?? 1}× خطأ`)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Callout>
      )}

      <div>
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: "due", label: t("À réviser", "للمراجعة"), count: due.length },
            ...[1, 2, 3, 4].map((b) => ({
              id: String(b) as Filter,
              label: t(`Boîte ${b} · +${SRS_INTERVALS[b]} j`, `العلبة ${b} · +${SRS_INTERVALS[b]} ي`),
              count: boxes[b - 1],
            })),
            { id: "5", label: t("Maîtrisées", "متقنة"), count: boxes[4] },
          ]}
        />

        <div className="pt-6">
          {!bank ? (
            <Skeleton className="h-40" />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={<NotebookPen className="size-6" />}
              title={items.length === 0 ? t("Aucune erreur enregistrée", "لا توجد أخطاء مسجلة") : t("Rien dans cette catégorie", "لا شيء في هذه الفئة")}
              desc={
                items.length === 0
                  ? t("Lance un entraînement : chaque question ratée sera rangée ici.", "ابدأ تمرينا: كل سؤال تخطئ فيه سيُرتَّب هنا.")
                  : t("Les questions changent de boîte à chaque révision.", "تنتقل الأسئلة من علبة إلى أخرى عند كل مراجعة.")
              }
              action={
                items.length === 0 ? <ButtonLink href="/entrainement/session/?mode=mix">{t("Lancer la session du jour", "ابدأ حصة اليوم")}</ButtonLink> : undefined
              }
            />
          ) : (
            <div className="divide-y divide-line rounded-[8px] border border-line">
              {shown.map((it) => {
                const q = it.q!;
                const ch = getChapter(q.chapter);
                const isOpen = open === it.id;
                const box = BOX_LABEL[it.box] ?? ["", ""];
                return (
                  <div key={it.id}>
                    <div className="flex items-center gap-3 p-3">
                      <button aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setOpen(isOpen ? null : it.id)}>
                        {q.img ? (
                          <img src={q.img} alt="" className="h-14 w-20 shrink-0 rounded-[4px] border border-line bg-white object-contain" />
                        ) : (
                          <span className="grid h-14 w-20 shrink-0 place-items-center rounded-[4px] bg-panel">{ch && <ModuleIcon id={ch.module} />}</span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[15px] text-ink">{qText(q, lang).prompt}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            {ch && <span>{nameOf(ch, lang)}</span>}
                            <span>{it.box < 5 && it.due <= now ? t("À réviser", "للمراجعة") : lang === "ar" ? box[1] : box[0]}</span>
                            {it.stat && (
                              <span className="text-ko">
                                {t(
                                  `${it.stat.ko} erreur${it.stat.ko > 1 ? "s" : ""} sur ${it.stat.seen}`,
                                  `${it.stat.ko} خطأ من ${it.stat.seen}`,
                                )}
                              </span>
                            )}
                          </span>
                        </span>
                        <ChevronDown className={cx("size-5 shrink-0 text-ink-2 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      <IconButton label={t("Retirer du carnet", "إزالة من الدفتر")} onClick={() => removeFromNotebook(it.id)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                    {isOpen && (
                      <div className="space-y-3 border-t border-line p-4">
                        {q.kind === "official" && q.img && <img src={q.img} alt="" className="w-full rounded-[8px]" />}
                        <Correction q={q} picked={q.answer} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
