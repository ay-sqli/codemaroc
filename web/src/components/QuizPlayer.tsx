"use client";

import { BackButton } from "./BackButton";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Flag, Lightbulb, NotebookPen, Pause, Shapes, Timer, Volume2, XCircle } from "lucide-react";
import type { Question } from "@/lib/types";
import { isCorrect } from "@/lib/questions";
import { addToNotebook, flagQuestion, recordAnswer, useStore } from "@/lib/store";
import { getChapter, nameOf } from "@/lib/courses";
import { schemaTitle } from "@/lib/schemaMeta";
import { useLang, type Lang } from "@/lib/i18n";
import { SchemaModal, SCHEMAS } from "./schemas";
import { RichText } from "./RichText";
import { Badge, Button, Callout, ChoiceOption, Input, ProgressBar, cx } from "./ui";

export interface QuizResult {
  q: Question;
  picked: number[];
  ok: boolean;
  timedOut?: boolean;
}

const KIND_LABEL: Record<Question["kind"], [string, string]> = {
  official: ["Question officielle", "سؤال رسمي"],
  sign: ["Panneau / schéma", "علامة / رسم"],
  rule: ["Règle du code", "قاعدة من مدونة السير"],
};

/** Textes d'une question dans la langue choisie (repli sur le français si la traduction manque). */
export function qText(q: Question, lang: Lang) {
  const ar = lang === "ar";
  return {
    prompt: ar && q.promptAr ? q.promptAr : q.prompt,
    option: (k: number) => (ar && q.options[k]?.labelAr) || q.options[k]?.label || "",
    explanation: (ar && q.explanationAr) || q.explanation,
    rappel: (ar && q.rappelAr) || q.rappel,
  };
}

function AudioButton({ src, auto }: { src: string; auto: boolean }) {
  const { t } = useLang();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = 0;
    if (auto) a.play().catch(() => setPlaying(false));
    return () => a.pause();
  }, [src, auto]);
  return (
    <>
      <audio ref={ref} src={src} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} preload="none" />
      <Button variant="secondary" size="sm" icon={playing ? <Pause className="size-4" /> : <Volume2 className="size-4" />} onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}>
        {playing ? t("Pause", "إيقاف مؤقت") : t("Écouter la question", "استمع إلى السؤال")}
      </Button>
    </>
  );
}

/** Panneau de correction : bonne réponse, explication, règle à retenir, schéma, chapitre. */
export function Correction({ q, picked, compact = false }: { q: Question; picked: number[]; compact?: boolean }) {
  const { lang, t } = useLang();
  const tx = qText(q, lang);
  const ok = isCorrect(q, picked);
  const [schema, setSchema] = useState<string | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [note, setNote] = useState("");
  const inNotebook = useStore((s) => !!s.srs[q.id]);
  const ch = getChapter(q.chapter);
  const answerText = q.answer.map((i) => (q.kind === "official" ? t(`case ${i + 1}`, `الخانة ${i + 1}`) : tx.option(i))).join(" + ");

  return (
    <div className="animate-pop space-y-3">
      <Callout tone={ok ? "success" : "error"} title={ok ? t("Bonne réponse", "جواب صحيح") : t("Réponse incorrecte", "جواب خاطئ")}>
        {!ok && (
          <p className="mb-2">
            {t("Réponse attendue :", "الجواب المنتظر:")}{" "}
            <strong className="font-semibold text-ink">{answerText}</strong>
          </p>
        )}
        <p className="text-[15px] leading-relaxed text-ink-2"><RichText text={tx.explanation} /></p>
      </Callout>
      {q.uncertain && (
        <Callout tone="info">
          {t(
            "Image peu lisible : corrigé proposé avec réserve. Si Perminou donne une autre réponse, utilise « Signaler le corrigé ».",
            "الصورة غير واضحة: التصحيح مقترح مع تحفظ. استمع إلى التسجيل الصوتي، وإذا أعطت Perminou جوابا آخر، استعمل « الإبلاغ عن التصحيح ».",
          )}
        </Callout>
      )}
      {tx.rappel && (
        <Callout tone="tip" icon={<Lightbulb className="size-5 text-warn" />} title={t("À retenir pour ne plus te tromper", "احفظ هذا حتى لا تخطئ مرة أخرى")}>
          <p className="text-[15px] leading-relaxed text-ink"><RichText text={tx.rappel} max={2} /></p>
        </Callout>
      )}
      {!compact && (
        <div className="flex flex-wrap gap-2 pt-1">
          {q.schema && SCHEMAS[q.schema] && (
            <Button variant="secondary" size="sm" icon={<Shapes className="size-4" />} onClick={() => setSchema(q.schema!)}>
              {t("Comprendre avec le schéma :", "افهم بالرسم:")} {schemaTitle(SCHEMAS[q.schema], lang)}
            </Button>
          )}
          {ch && (
            <Link
              href={`/cours/${ch.slug}/`}
              target="_blank"
              className="inline-flex min-h-8 items-center gap-2 rounded-[12px] px-3 text-sm font-semibold text-brand hover:bg-brand-50"
            >
              <BookOpen className="size-4" /> {t("Revoir le cours :", "راجع الدرس:")} {nameOf(ch, lang)}
            </Link>
          )}
          {ok && !inNotebook && (
            <Button variant="tertiary" size="sm" icon={<NotebookPen className="size-4" />} onClick={() => addToNotebook(q.id, q.chapter)}>
              {t("Je veux la revoir", "أريد مراجعته")}
            </Button>
          )}
          {q.kind === "official" && (
            <Button variant="tertiary" size="sm" icon={<Flag className="size-4" />} onClick={() => setFlagOpen((f) => !f)}>
              {t("Signaler le corrigé", "الإبلاغ عن التصحيح")}
            </Button>
          )}
        </div>
      )}
      {flagOpen && (
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("Ex : la bonne réponse sur Perminou était 1 et 3", "مثال: الجواب الصحيح على Perminou كان 1 و 3")}
          />
          <Button
            onClick={() => {
              flagQuestion(q.id, note || "à vérifier");
              setFlagOpen(false);
            }}
          >
            {t("Envoyer", "إرسال")}
          </Button>
        </div>
      )}
      {schema && <SchemaModal id={schema} onClose={() => setSchema(null)} />}
    </div>
  );
}

export function QuizPlayer({
  questions, mode, title, onFinish, onQuit, exitHref = "/entrainement/",
}: {
  questions: Question[];
  mode: "practice" | "exam";
  title: string;
  onFinish: (r: QuizResult[], seconds: number) => void;
  /** quitter sans terminer (ex. revenir à l'accueil de l'examen) ; par défaut, retour à la page précédente */
  onQuit?: () => void;
  exitHref?: string;
}) {
  const { lang, t } = useLang();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const settings = useStore((s) => s.settings);
  const start = useRef(0);
  useEffect(() => {
    start.current = Date.now();
  }, []);
  const q = questions[i];
  const perQuestion = 30;
  // Le chrono mémorise la question à laquelle il appartient : à l'arrivée d'une nouvelle
  // question il repart de 30 s sans risquer de la valider avec le « 0 » de la précédente.
  const [clock, setClock] = useState({ q: 0, left: perQuestion });
  const left = clock.q === i ? clock.left : perQuestion;
  const timed = mode === "exam" && settings.timer;

  const submit = useCallback(
    (timedOut = false) => {
      if (!q) return;
      const ok = !timedOut && isCorrect(q, picked);
      recordAnswer(q.id, ok, q.chapter);
      const r = [...results, { q, picked, ok, timedOut }];
      setResults(r);
      if (mode === "exam") {
        if (i + 1 >= questions.length) onFinish(r, Math.round((Date.now() - start.current) / 1000));
        else {
          setI(i + 1);
          setPicked([]);
        }
      } else setChecked(true);
    },
    [q, picked, results, mode, i, questions.length, onFinish],
  );

  const next = useCallback(() => {
    if (i + 1 >= questions.length) onFinish(results, Math.round((Date.now() - start.current) / 1000));
    else {
      setI(i + 1);
      setPicked([]);
      setChecked(false);
    }
  }, [i, questions.length, onFinish, results]);

  // Sur petit écran la correction arrive sous la ligne de flottaison : on la fait remonter.
  const corrRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = corrRef.current;
    if (!checked || !el) return;
    const top = el.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.6) window.scrollBy({ top: top - window.innerHeight * 0.35, behavior: "smooth" });
  }, [checked]);
  // Nouvelle question : retour en haut si elle n'est plus visible.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [i]);

  // Chronomètre par question (mode examen, comme à l'examen réel)
  useEffect(() => {
    if (!timed) return;
    const tm = setInterval(() => setClock((c) => ({ q: i, left: (c.q === i ? c.left : perQuestion) - 1 })), 1000);
    return () => clearInterval(tm);
  }, [i, timed]);
  useEffect(() => {
    if (timed && clock.q === i && clock.left <= 0) submit(picked.length === 0);
  }, [clock, i, timed, submit, picked.length]);

  const toggle = (k: number) => {
    if (checked) return;
    setPicked((p) => (q.multi ? (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]) : [k]));
  };

  // Raccourcis clavier : 1-4 pour choisir, Entrée pour valider / continuer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length && !checked) toggle(n - 1);
      if (e.key === "Enter") {
        if (checked) next();
        else if (picked.length) submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const score = useMemo(() => results.filter((r) => r.ok).length, [results]);
  if (!q) return null;
  const tx = qText(q, lang);
  const official = q.kind === "official";
  const progress = ((i + (checked ? 1 : 0)) / questions.length) * 100;

  const stateOf = (k: number): "correct" | "wrong" | "missed" | undefined => {
    if (!checked) return undefined;
    const sel = picked.includes(k);
    const good = q.answer.includes(k);
    if (good && sel) return "correct";
    if (sel && !good) return "wrong";
    if (good && !sel) return "missed";
    return undefined;
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* En-tête et progression */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton
            href={exitHref}
            onClick={onQuit}
            label={<span className="max-sm:sr-only">{t("Quitter", "خروج")}</span>}
            confirmText={
              results.length > 0
                ? mode === "exam"
                  ? t("Quitter l'examen ? Il ne sera pas compté.", "مغادرة الامتحان ؟ لن يُحتسب.")
                  : t("Quitter la session ? Tes réponses sont déjà enregistrées.", "مغادرة الحصة ؟ أجوبتك محفوظة.")
                : undefined
            }
            className="!px-3"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted">{title}</p>
            <p className="text-lg font-semibold">
              {t("Question", "السؤال")} {i + 1} <span className="font-normal text-muted">{t("sur", "من")} {questions.length}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "practice" && results.length > 0 && (
              <Badge tone="success">
                {score} / {results.length} {t("justes", "صحيحة")}
              </Badge>
            )}
            {timed && (
              <Badge tone={left <= 10 ? "error" : "neutral"} icon={<Timer className="size-3.5" />} className={cx("text-sm", left <= 10 && "animate-pulse")}>
                {Math.max(0, left)} {t("s", "ث")}
              </Badge>
            )}
          </div>
        </div>
        <ProgressBar value={progress} label={t("Progression du quiz", "تقدم الاختبار")} />
      </div>

      <div key={q.id} ref={cardRef} className="animate-pop">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Badge tone={q.kind === "official" ? "brand" : "neutral"}>{lang === "ar" ? KIND_LABEL[q.kind][1] : KIND_LABEL[q.kind][0]}</Badge>
          {/* L'enregistrement officiel n'existe qu'en arabe. */}
          {lang === "ar" && q.audio && <AudioButton src={q.audio} auto={settings.autoAudio} />}
        </div>

        {official ? (
          <div className="overflow-hidden rounded-[16px] border-2 border-line">
            <img src={q.img} alt={t("Question", "السؤال")} data-zoom data-caption="" className="w-full bg-[#1f1f1f] object-contain" />
            <div className="border-t-2 border-line bg-white p-4">
              {/* Le texte de l'image officielle est en arabe : l'énoncé est repris en français. */}
              {lang === "fr" && tx.prompt && <p className="mb-3 text-[17px] font-semibold leading-snug text-ink">{tx.prompt}</p>}
              <p className="mb-3 text-[15px] font-semibold">
                {t("Coche la ou les bonnes cases", "اختر الخانة أو الخانات الصحيحة")}{" "}
                <span className="font-normal text-muted">{t("(plusieurs réponses possibles)", "(يمكن أن تكون عدة أجوبة صحيحة)")}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" dir="ltr">
                {q.options.map((_, k) => {
                  const st = stateOf(k);
                  const sel = picked.includes(k);
                  return (
                    <button
                      key={k}
                      role="checkbox"
                      aria-checked={sel}
                      onClick={() => toggle(k)}
                      className={cx(
                        "flex h-16 items-center justify-center gap-2 rounded-[16px] border text-2xl font-semibold transition-colors",
                        st === "correct"
                          ? "border-ok bg-ok-50 text-ok"
                          : st === "wrong"
                            ? "animate-shake border-ko bg-ko-50 text-ko"
                            : st === "missed"
                              ? "border-dashed border-ok text-ok"
                              : sel
                                ? "border-brand bg-brand text-white"
                                : "border-line-strong bg-white text-ink hover:border-brand hover:text-brand",
                      )}
                    >
                      {st === "correct" && <CheckCircle2 className="size-5" />}
                      {st === "wrong" && <XCircle className="size-5" />}
                      {k + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {q.img && (
                <div className="mx-auto w-fit max-w-full shrink-0 overflow-hidden rounded-[16px] border-2 border-line bg-white sm:mx-0 sm:max-w-[50%]">
                  {/* Le cadre prend la forme de l'image : aucun vide, et le panneau reste entier. */}
                  <img src={q.img} alt="" data-zoom className="block h-40 w-auto max-w-full object-cover sm:h-44" />
                </div>
              )}
              <div className="space-y-1">
                {tx.prompt && <h2 className={cx("text-xl font-semibold leading-snug", lang === "ar" && "leading-relaxed")}>{tx.prompt}</h2>}
                <p className="text-sm text-muted">{q.multi ? t("Plusieurs réponses possibles", "يمكن أن تكون عدة أجوبة صحيحة") : t("Une seule réponse", "جواب واحد فقط")}</p>
              </div>
            </div>
            <div className="space-y-2.5" role={q.multi ? "group" : "radiogroup"}>
              {q.options.map((_, k) => {
                const st = stateOf(k);
                const label = tx.option(k);
                return (
                  <div key={k} className={st === "wrong" ? "animate-shake" : ""}>
                    <ChoiceOption index={k} multi={q.multi} selected={picked.includes(k)} state={st} onClick={() => toggle(k)} disabled={checked}>
                      <span>{label}</span>
                    </ChoiceOption>
                    {st === "correct" && (
                      <p className="mt-1 flex items-center gap-1 ps-4 text-sm font-semibold text-ok">
                        <CheckCircle2 className="size-4" /> {t("Correct", "صحيح")}
                      </p>
                    )}
                    {st === "wrong" && (
                      <p className="mt-1 flex items-center gap-1 ps-4 text-sm font-semibold text-ko">
                        <XCircle className="size-4" /> {t("Incorrect", "خطأ")}
                      </p>
                    )}
                    {st === "missed" && (
                      <p className="mt-1 ps-4 text-sm font-semibold text-ok">
                        {q.multi ? t("Cette réponse était aussi à cocher", "كان يجب اختيار هذا الجواب أيضا") : t("C'était la bonne réponse", "هذا هو الجواب الصحيح")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {checked && (
        <div ref={corrRef} className="mt-6">
          <Correction q={q} picked={picked} />
        </div>
      )}

      {/* Barre d'actions */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t-2 border-line bg-white px-4 py-3 sm:mx-0 sm:rounded-[16px] sm:border">
        <div>
          {mode === "practice" && !checked && (
            <Button variant="tertiary" onClick={() => onFinish(results, Math.round((Date.now() - start.current) / 1000))}>
              {t("Terminer la session", "إنهاء الحصة")}
            </Button>
          )}
        </div>
        {!checked ? (
          <Button size="lg" disabled={!picked.length} onClick={() => submit()}>
            {mode === "exam"
              ? i + 1 >= questions.length
                ? t("Terminer l'examen", "إنهاء الامتحان")
                : t("Valider et continuer", "تأكيد ومتابعة")
              : t("Valider", "تأكيد")}
          </Button>
        ) : (
          <Button size="lg" onClick={next} iconEnd={<ArrowRight className="size-4" />}>
            {i + 1 >= questions.length ? t("Voir le résultat", "عرض النتيجة") : t("Question suivante", "السؤال الموالي")}
          </Button>
        )}
      </div>
    </div>
  );
}
