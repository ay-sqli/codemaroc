"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { useBank } from "@/lib/questions";
import { MODE_INFO, pick, type Mode } from "@/lib/select";
import { getState } from "@/lib/store";
import { getChapter, getModule, nameOf } from "@/lib/courses";
import { useLang } from "@/lib/i18n";
import type { Question } from "@/lib/types";
import { QuizPlayer, type QuizResult } from "@/components/QuizPlayer";
import { Results } from "@/components/Results";
import { ButtonLink, Callout, EmptyState, Skeleton } from "@/components/ui";

export function Session() {
  const { lang, t } = useLang();
  const sp = useSearchParams();
  const mode = (sp.get("mode") ?? "mix") as Mode;
  const c = sp.get("c") ?? undefined;
  const n = Number(sp.get("n") ?? 20);
  const { bank, error } = useBank();
  const [qs, setQs] = useState<Question[] | null>(null);
  const [done, setDone] = useState<{ r: QuizResult[]; s: number } | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (bank) setQs(pick(bank, getState(), mode, { c, n }));
  }, [bank, mode, c, n, round]);

  const finish = useCallback((r: QuizResult[], s: number) => setDone({ r, s }), []);

  if (error) return <Callout tone="error" title={t("Chargement impossible", "تعذر التحميل")}>{error}</Callout>;
  if (!qs) return <Skeleton className="mx-auto h-96 max-w-3xl" />;

  const info = MODE_INFO[mode] ?? MODE_INFO.mix;
  const infoTitle = lang === "ar" ? info.titleAr : info.title;
  const ch = getChapter(c ?? "");
  const md = getModule(c ?? "");
  const title =
    mode === "chapter" && ch ? `${infoTitle} : ${nameOf(ch, lang)}` : mode === "module" && md ? `${infoTitle} : ${nameOf(md, lang)}` : infoTitle;

  if (!qs.length)
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
              mascot="vacation"
          icon={<PartyPopper className="size-6" />}
          title={mode === "notebook" ? t("Rien à réviser pour l'instant", "لا شيء للمراجعة حاليا") : t("Aucune question ici", "لا توجد أسئلة هنا")}
          desc={
            mode === "notebook"
              ? t("Tes erreurs reviendront automatiquement au bon moment (1, 2, 4, 8 puis 16 jours).", "ستعود أخطاؤك تلقائيا في الوقت المناسب (بعد 1، 2، 4، 8 ثم 16 يوما).")
              : mode === "weak"
                ? t("Tu n'as pas encore d'erreurs enregistrées. Fais d'abord quelques sessions.", "لا توجد لديك أخطاء مسجلة بعد. أنجز بعض الحصص أولا.")
                : t("Cette catégorie ne contient pas encore de question.", "هذه الفئة لا تحتوي على أسئلة بعد.")
          }
          action={<ButtonLink href="/entrainement/">{t("Choisir un autre entraînement", "اختر تمرينا آخر")}</ButtonLink>}
        />
      </div>
    );

  if (done)
    return (
      <Results
        results={done.r}
        seconds={done.s}
        exam={false}
        onRestart={() => {
          setDone(null);
          setQs(null);
          setRound((x) => x + 1);
        }}
      />
    );

  return <QuizPlayer key={round} questions={qs} mode="practice" title={title} onFinish={finish} />;
}
