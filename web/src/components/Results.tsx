"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, NotebookPen, RotateCcw, XCircle } from "lucide-react";
import type { QuizResult } from "./QuizPlayer";
import { Correction, qText } from "./QuizPlayer";
import { countLabel, useLang } from "@/lib/i18n";
import { getChapter, nameOf } from "@/lib/courses";
import { Badge, Button, ButtonLink, ModuleIcon, ProgressRing, cx } from "./ui";

export function Results({
  results, seconds, exam, onRestart,
}: { results: QuizResult[]; seconds: number; exam: boolean; onRestart: () => void }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const errN = (n: number) => countLabel(lang, n, ["erreur"], ["خطأ", "خطآن", "أخطاء", "خطأ"]);
  const dur = t(`${Math.floor(seconds / 60)} min ${seconds % 60} s`, `${Math.floor(seconds / 60)} د ${seconds % 60} ث`);
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  const pct = total ? (ok / total) * 100 : 0;
  const pass = exam ? ok >= Math.ceil(total * 0.8) : pct >= 80;
  const wrong = results.filter((r) => !r.ok);

  // Chapitres où se concentrent les erreurs
  const weak = useMemo(() => {
    const m = new Map<string, number>();
    wrong.forEach((r) => m.set(r.q.chapter, (m.get(r.q.chapter) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [wrong]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Note obtenue */}
      <section className="rounded-[8px] border border-line">
        <div className={cx("flex items-center gap-2 rounded-t-[8px] px-5 py-3 text-sm font-semibold", pass ? "bg-ok-50 text-[#137333]" : "bg-ko-50 text-[#b00020]")}>
          {pass ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
          {exam
            ? pass
              ? t("Félicitations ! Tu as réussi l'examen blanc.", "مبروك! لقد نجحت في الامتحان التجريبي.")
              : t("Examen blanc non réussi.", "لم تنجح في الامتحان التجريبي.")
            : pass
              ? t("Très bon résultat !", "نتيجة ممتازة!")
              : t("Continue : tes erreurs sont dans le carnet.", "واصل: أخطاؤك موجودة في الدفتر.")}
        </div>
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
          <ProgressRing pct={pct} size={128} tone={pass ? "ok" : "ko"}>
            <span className="block text-3xl font-semibold leading-none">{Math.round(pct)} %</span>
          </ProgressRing>
          <div className="flex-1 space-y-3 text-center sm:text-start">
            <div>
              <p className="text-sm text-muted">{exam ? t("Note de l'examen blanc", "نقطة الامتحان التجريبي") : t("Note de la session", "نقطة الحصة")}</p>
              <p className="text-3xl font-semibold" dir="ltr">
                {ok} <span className="text-xl font-normal text-muted">/ {total}</span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:max-w-sm">
              <dt className="text-muted">{t("Pour réussir", "للنجاح")}</dt>
              <dd className="font-semibold">{exam ? `${Math.ceil(total * 0.8)} / ${total} (80 %)` : t("80 % ou plus", "80 % أو أكثر")}</dd>
              <dt className="text-muted">{t("Durée", "المدة")}</dt>
              <dd className="font-semibold">{dur}</dd>
              <dt className="text-muted">{t("Erreurs", "الأخطاء")}</dt>
              <dd className="font-semibold">
                {t(`${wrong.length} ajoutée${wrong.length > 1 ? "s" : ""} au carnet`, `${errN(wrong.length)} أُضيفت إلى الدفتر`)}
              </dd>
            </dl>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4">
          <Button onClick={onRestart} icon={<RotateCcw className="size-4" />}>
            {t("Recommencer", "إعادة المحاولة")}
          </Button>
          {wrong.length > 0 && (
            <ButtonLink href="/erreurs/" variant="secondary" icon={<NotebookPen className="size-4" />}>
              {t("Ouvrir le carnet d'erreurs", "افتح دفتر الأخطاء")}
            </ButtonLink>
          )}
        </div>
      </section>

      {weak.length > 0 && (
        <section>
          <h2 className="t-h4 mb-3">{t("Chapitres à retravailler", "دروس يجب مراجعتها")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {weak.map(([slug, n]) => {
              const c = getChapter(slug);
              return c ? (
                <Link key={slug} href={`/cours/${slug}/`} className="flex items-center gap-3 rounded-[8px] border border-line p-3 hover:shadow-md">
                  <ModuleIcon id={c.module} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{nameOf(c, lang)}</span>
                    <span className="text-sm text-muted">{errN(n)}</span>
                  </span>
                </Link>
              ) : null;
            })}
          </div>
        </section>
      )}

      {wrong.length > 0 && (
        <section>
          <h2 className="t-h4 mb-3">{t("Correction de tes erreurs", "تصحيح أخطائك")}</h2>
          <div className="divide-y divide-line rounded-[8px] border border-line">
            {wrong.map((r, i) => (
              <div key={r.q.id + i}>
                <button
                  aria-expanded={open === r.q.id}
                  className="flex w-full items-center gap-3 p-3 text-start hover:bg-panel"
                  onClick={() => setOpen(open === r.q.id ? null : r.q.id)}
                >
                  {r.q.img ? (
                    <img src={r.q.img} alt="" className="h-14 w-20 shrink-0 rounded-[4px] border border-line bg-white object-contain" />
                  ) : (
                    <span className="grid h-14 w-20 shrink-0 place-items-center rounded-[4px] bg-panel text-sm text-muted">Q{i + 1}</span>
                  )}
                  <span className="min-w-0 flex-1 text-sm text-ink">
                    <span className="line-clamp-2">{qText(r.q, lang).prompt ?? t("Question", "سؤال")}</span>
                    {r.timedOut && (
                      <Badge tone="error" className="mt-1">
                        {t("Temps écoulé", "انتهى الوقت")}
                      </Badge>
                    )}
                  </span>
                  <ChevronDown className={cx("size-5 shrink-0 text-ink-2 transition-transform", open === r.q.id && "rotate-180")} />
                </button>
                {open === r.q.id && (
                  <div className="space-y-3 border-t border-line p-4">
                    {r.q.kind === "official" && r.q.img && <img src={r.q.img} alt="" className="w-full rounded-[8px]" />}
                    <p className="text-sm text-muted">
                      {t("Ta réponse :", "جوابك:")}{" "}
                      <b className="font-semibold text-ink">
                        {r.picked.length
                          ? r.picked.map((k) => (r.q.kind === "official" ? k + 1 : qText(r.q, lang).option(k))).join(" + ")
                          : t("aucune", "لا شيء")}
                      </b>
                    </p>
                    <Correction q={r.q} picked={r.picked} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
