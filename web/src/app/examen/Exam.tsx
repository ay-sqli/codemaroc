"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock, Headphones, Keyboard, ListChecks } from "lucide-react";
import { useBank } from "@/lib/questions";
import { buildExam } from "@/lib/select";
import { recordExam, updateSettings, useStore } from "@/lib/store";
import type { Question } from "@/lib/types";
import { QuizPlayer, type QuizResult } from "@/components/QuizPlayer";
import { Results } from "@/components/Results";
import { Badge, Breadcrumbs, Button, Callout, EmptyState, Switch } from "@/components/ui";
import { fmtDate, useLang } from "@/lib/i18n";

export function Exam() {
  const { lang, t } = useLang();
  const { bank } = useBank();
  const settings = useStore((s) => s.settings);
  const exams = useStore((s) => s.exams);
  const [qs, setQs] = useState<Question[] | null>(null);
  const [done, setDone] = useState<{ r: QuizResult[]; s: number } | null>(null);

  const best = useMemo(() => exams.reduce((m, e) => Math.max(m, e.score), 0), [exams]);
  const passed = exams.filter((e) => e.score >= Math.ceil(e.total * 0.8)).length;
  const history = [...exams].reverse().slice(0, 10);

  const finish = useCallback((r: QuizResult[], s: number) => {
    recordExam({ ts: Date.now(), score: r.filter((x) => x.ok).length, total: r.length, seconds: s, wrong: r.filter((x) => !x.ok).map((x) => x.q.id) });
    setDone({ r, s });
  }, []);

  if (done)
    return (
      <Results
        results={done.r}
        seconds={done.s}
        exam
        onRestart={() => {
          setDone(null);
          setQs(null);
        }}
      />
    );
  if (qs) return <QuizPlayer questions={qs} mode="exam" title={t("Examen blanc", "امتحان تجريبي")} onFinish={finish} />;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Breadcrumbs items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Examen blanc", "امتحان تجريبي") }]} />
      <header className="space-y-3">
        <Badge tone="brand">{t("Évaluation notée", "تقييم بنقطة")}</Badge>
        <h1 className="t-h1">{t("Examen blanc du permis B", "الامتحان التجريبي لرخصة السياقة صنف ب")}</h1>
        <p className="text-base text-ink-2">
          {t(
            "Comme le jour J : une image, l'audio en arabe et des cases 1 à 4 avec une ou plusieurs bonnes réponses. La correction n'apparaît qu'à la fin.",
            "كما في يوم الامتحان: صورة، وتسجيل صوتي بالعربية، وخانات من 1 إلى 4 بجواب صحيح واحد أو أكثر. لا يظهر التصحيح إلا في النهاية.",
          )}
        </p>
      </header>

      <section className="rounded-[16px] border-2 border-line">
        <dl className="grid divide-line sm:grid-cols-2 sm:divide-x">
          <div className="flex gap-3 p-5">
            <ListChecks className="size-5 shrink-0 text-ink-2" />
            <div>
              <dt className="text-sm text-muted">{t("Questions", "الأسئلة")}</dt>
              <dd className="font-semibold">{t("40 questions, tirées de la banque officielle", "40 سؤالا من البنك الرسمي")}</dd>
            </div>
          </div>
          <div className="flex gap-3 border-t-2 border-line p-5 sm:border-t-0">
            <Clock className="size-5 shrink-0 text-ink-2" />
            <div>
              <dt className="text-sm text-muted">{t("Temps", "الوقت")}</dt>
              <dd className="font-semibold">{t("30 secondes par question", "30 ثانية لكل سؤال")}</dd>
            </div>
          </div>
          <div className="flex gap-3 border-t-2 border-line p-5">
            <Headphones className="size-5 shrink-0 text-ink-2" />
            <div>
              <dt className="text-sm text-muted">{t("Audio", "الصوت")}</dt>
              <dd className="font-semibold">{t("Question lue en arabe", "السؤال مقروء بالعربية")}</dd>
            </div>
          </div>
          <div className="flex gap-3 border-t-2 border-line p-5">
            <Keyboard className="size-5 shrink-0 text-ink-2" />
            <div>
              <dt className="text-sm text-muted">{t("Clavier", "لوحة المفاتيح")}</dt>
              <dd className="font-semibold">{t("Touches 1 à 4, puis Entrée", "المفاتيح من 1 إلى 4، ثم Entrée")}</dd>
            </div>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-line bg-panel px-5 py-4">
          <p className="text-sm">
            {t("Note pour réussir :", "النقطة المطلوبة للنجاح:")} <b className="font-semibold">32 / 40 (80 %)</b>
          </p>
          <Button size="lg" disabled={!bank} onClick={() => bank && setQs(buildExam(bank))}>
            {bank ? t("Commencer l'examen", "ابدأ الامتحان") : t("Chargement…", "جار التحميل…")}
          </Button>
        </div>
      </section>

      <section className="rounded-[16px] border-2 border-line p-5">
        <h2 className="t-h4 mb-1">{t("Réglages", "الإعدادات")}</h2>
        <div className="divide-y divide-line">
          <Switch checked={settings.timer} onChange={(v) => updateSettings({ timer: v })} label={t("Chronomètre de 30 secondes par question", "مؤقت 30 ثانية لكل سؤال")} />
          <Switch checked={settings.autoAudio} onChange={(v) => updateSettings({ autoAudio: v })} label={t("Lecture automatique de l'audio", "التشغيل التلقائي للصوت")} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="t-h3">{t("Tes tentatives", "محاولاتك")}</h2>
          {exams.length > 0 && (
            <p className="text-sm text-muted">
              {t("Meilleure note :", "أفضل نقطة:")} <b className="font-semibold text-ink">{best} / 40</b> ·{" "}
              {t(`${passed} réussite${passed > 1 ? "s" : ""} sur ${exams.length}`, `${passed} نجاح من أصل ${exams.length}`)}
            </p>
          )}
        </div>
        {history.length ? (
          <div className="overflow-x-auto rounded-[16px] border-2 border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel text-start text-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">{t("Date", "التاريخ")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("Note", "النقطة")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("Durée", "المدة")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("Statut", "الحالة")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((e) => {
                  const ok = e.score >= Math.ceil(e.total * 0.8);
                  return (
                    <tr key={e.ts}>
                      <td className="px-4 py-3">{fmtDate(e.ts, lang, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3 font-semibold">
                        {e.score} / {e.total}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {t(`${Math.floor(e.seconds / 60)} min ${e.seconds % 60} s`, `${Math.floor(e.seconds / 60)} د ${e.seconds % 60} ث`)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={ok ? "success" : "error"}>{ok ? t("Réussi", "ناجح") : t("Non réussi", "غير ناجح")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
              mascot="timer"
            title={t("Aucune tentative pour l'instant", "لا توجد محاولات حتى الآن")}
            desc={t(
              "Ta première note apparaîtra ici. Conseil : fais au moins un examen blanc par jour la dernière semaine.",
              "ستظهر نقطتك الأولى هنا. نصيحة: اجتز امتحانا تجريبيا واحدا على الأقل كل يوم خلال الأسبوع الأخير.",
            )}
          />
        )}
      </section>

      <Callout tone="info" title={t("Bon à savoir", "معلومة مفيدة")}>
        {t(
          "Les questions sont tirées au hasard dans les 398 questions officielles de Perminou. Chaque erreur est ajoutée à ton carnet pour être revue plus tard.",
          "تُختار الأسئلة عشوائيا من بين 398 سؤالا رسميا من Perminou. يُضاف كل خطأ إلى دفترك لمراجعته لاحقا.",
        )}
      </Callout>
    </div>
  );
}
