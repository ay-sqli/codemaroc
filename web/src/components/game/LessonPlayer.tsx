"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Clock, Lightbulb, Shapes, Target, Timer, Volume2, VolumeX, X, Zap } from "lucide-react";
import type { Question } from "@/lib/types";
import { isCorrect } from "@/lib/questions";
import { recordAnswer, setGameSound, useStore } from "@/lib/store";
import { QUESTION_SECONDS, type GameNode } from "@/lib/game";
import { getChapter, nameOf } from "@/lib/courses";
import { schemaTitle } from "@/lib/schemaMeta";
import { countLabel, useLang } from "@/lib/i18n";
import { qText } from "@/components/QuizPlayer";
import { SchemaModal, SCHEMAS, schemaForChapter } from "@/components/schemas";
import { cx } from "@/components/ui";
import { asset } from "@/lib/base";
import { Mascot, MascotSays, OOPS_POSES, PRAISE_POSES } from "./Mascot";
import { preloadSounds, sfx } from "./sounds";
import { GameIcon } from "./GameIcon";
import { VOYANT_UNITS, Voyants } from "./Voyants";
import { RoadScene } from "./RoadScene";

const HAS_AR = /[؀-ۿ]/;
const PRAISE: [string, string][] = [
  ["Excellent !", "ممتاز !"],
  ["Bravo !", "أحسنت !"],
  ["Parfait !", "رائع !"],
  ["Super !", "جيد جدا !"],
  ["Bien joué !", "برافو !"],
];

/** Étape en cours, gardée dans le navigateur : si la page se ferme, on reprend à la même question. */
export interface LessonSnapshot {
  id: string;
  queue: string[];
  pos: number;
  hearts: number;
  correct: string[];
  mistakes: number;
  wrongIds: string[];
  combo: number;
  bestCombo: number;
  seconds: number;
}

const SNAP_KEY = "codemaroc-etape-en-cours";

export function loadSnapshot(id: string): LessonSnapshot | null {
  try {
    const s = JSON.parse(localStorage.getItem(SNAP_KEY) ?? "null") as LessonSnapshot | null;
    return s?.id === id ? s : null;
  } catch {
    return null;
  }
}

export function clearSnapshot() {
  try {
    localStorage.removeItem(SNAP_KEY);
  } catch {}
}

export interface PlayStats {
  correct: number;
  mistakes: number;
  total: number;
  seconds: number;
  bestCombo: number;
  wrongIds: string[];
}

/* ─────────────────────────── Barre du haut ─────────────────────────── */
function TopBar({ progress, hearts, maxHearts, onQuit, timeLeft, hit }: { progress: number; hearts: number; maxHearts: number; onQuit: () => void; timeLeft?: number; hit: boolean }) {
  const { t } = useLang();
  const sound = useStore((s) => s.game.sound);
  return (
    <div className="mx-auto flex w-full max-w-[1000px] items-center gap-3 px-4 pt-5 sm:gap-4 sm:px-6 sm:pt-10" dir="ltr">
      <button onClick={onQuit} aria-label={t("Quitter l'étape", "مغادرة المرحلة")} className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--duo-grey-d)] hover:bg-[var(--duo-snow)]">
        <X className="size-7" strokeWidth={2.6} />
      </button>
      <div className="duo-progress flex-1" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${Math.max(progress, 2)}%` }} />
      </div>
      {timeLeft !== undefined && (
        <span className={cx("duo-mono flex items-center gap-1 text-[17px] font-[700]", timeLeft <= 5 ? "animate-pulse text-[var(--duo-red)]" : "text-[var(--duo-blue)]")}>
          <Timer className="size-5" /> {Math.max(0, timeLeft)}
        </span>
      )}
      <span
        className={cx("flex items-center gap-1.5 text-[17px] font-[800] text-[var(--duo-brand)]", hit && "duo-heart-hit")}
        title={t(`${hearts} points de permis sur ${maxHearts}`, `${hearts} نقط من ${maxHearts}`)}
      >
        <GameIcon name="permis" size={32} /> <span className="duo-mono">{hearts}</span>
      </span>
      <button
        onClick={() => setGameSound(!sound)}
        aria-label={sound ? t("Couper le son", "كتم الصوت") : t("Activer le son", "تشغيل الصوت")}
        className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--duo-grey-d)] hover:bg-[var(--duo-snow)] max-sm:hidden"
      >
        {sound ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
      </button>
    </div>
  );
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
      <button
        onClick={() => (playing ? ref.current?.pause() : ref.current?.play())}
        className="duo-btn duo-btn-blue !min-h-14 !rounded-[16px] !px-4 normal-case tracking-normal"
        aria-label={t("Écouter la question", "استمع إلى السؤال")}
      >
        <Volume2 className={cx("size-7", playing && "animate-pulse")} />
        <span className="max-sm:hidden">{playing ? t("Lecture…", "تشغيل…") : t("Écouter", "استمع")}</span>
      </button>
    </>
  );
}

/* ─────────────────────────── Cours express ─────────────────────────── */
export function LessonIntro({
  node, questions, onStart, onQuit, resume, onResume,
}: {
  node: GameNode;
  questions: Question[];
  onStart: () => void;
  onQuit: () => void;
  resume?: LessonSnapshot | null;
  onResume?: () => void;
}) {
  const { lang, t } = useLang();
  const [schema, setSchema] = useState<string | null>(null);
  const ch = getChapter(node.unit);
  const points = useMemo(() => {
    const out: string[] = [];
    for (const q of questions) {
      if (q.kind === "sign") continue;
      const r = qText(q, lang).rappel;
      if (r && !out.includes(r)) out.push(r);
    }
    return out;
  }, [questions, lang]);
  const signs = useMemo(() => {
    const seen = new Set<string>();
    return questions.filter((q) => q.kind === "sign" && q.img && !seen.has(q.img) && seen.add(q.img));
  }, [questions]);
  const schemas = useMemo(() => {
    const ids = new Set(questions.map((q) => q.schema).filter(Boolean) as string[]);
    const forCh = schemaForChapter(node.unit);
    if (forCh) ids.add(forCh);
    return [...ids].filter((id) => SCHEMAS[id]);
  }, [questions, node.unit]);
  const timed = node.kind !== "lesson";

  return (
    <div className="min-h-dvh pb-32">
      <div className="mx-auto flex max-w-[760px] items-center gap-3 px-4 pt-5 sm:pt-8">
        <button onClick={onQuit} aria-label={t("Retour au parcours", "العودة إلى المسار")} className="grid size-9 place-items-center rounded-full text-[var(--duo-grey-d)] hover:bg-[var(--duo-snow)]">
          <X className="size-7" strokeWidth={2.6} />
        </button>
        <p className="truncate text-[15px] font-[800] uppercase tracking-wide text-[var(--duo-grey-d)]">{ch ? nameOf(ch, lang) : t("Examen final", "الامتحان النهائي")}</p>
      </div>

      <div className="mx-auto max-w-[760px] px-4 pt-6">
        <p className="text-[14px] font-[800] uppercase tracking-wider text-[var(--duo-blue)]">
          {timed ? (node.kind === "summit" ? t("Le sommet", "القمة") : t("Défi de l'unité", "تحدي الوحدة")) : `${t("Étape", "المرحلة")} ${node.index} · ${t("cours express", "درس سريع")}`}
        </p>
        <h1 className="duo-h mt-1 text-[28px] leading-tight sm:text-[32px]">{lang === "ar" ? node.title.ar : node.title.fr}</h1>

        {node.unit && <RoadScene unit={node.unit} section={node.section} />}

        <div className="mt-6">
          {timed ? (
            <MascotSays pose={node.kind === "summit" ? "hero" : "timer"}>
              {node.kind === "summit"
                ? t("Dernière ligne droite ! 40 questions comme le jour J. Tu as droit à 8 erreurs au maximum.", "آخر خطوة ! 40 سؤالا كما في يوم الامتحان. يُسمح لك بـ8 أخطاء على الأكثر.")
                : t("Montre ce que tu as retenu de cette unité ! Pas de cours cette fois : 10 questions au chrono.", "أظهر ما حفظته في هذه الوحدة ! بدون درس هذه المرة: 10 أسئلة بتوقيت.")}
            </MascotSays>
          ) : (
            <MascotSays pose={node.index === 1 ? "teacher" : node.index % 2 ? "study" : "reading"}>
              {t(
                `Lis l'essentiel ci-dessous, puis réponds aux ${questions.length} questions. Tu as 3 points de permis : chaque erreur en retire un et la question revient à la fin.`,
                `اقرأ الأساسي أدناه، ثم أجب عن ${questions.length} سؤالا. لديك 3 نقط في رخصتك: كل خطأ يسحب نقطة ويعود السؤال في النهاية.`,
              )}
            </MascotSays>
          )}
        </div>

        {timed ? (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Target, v: questions.length, l: t("questions", "سؤال") },
              { icon: Clock, v: `${QUESTION_SECONDS} s`, l: t("par question", "لكل سؤال") },
              { icon: null, v: node.kind === "summit" ? 8 : 2, l: t("erreurs permises", "أخطاء مسموحة") },
            ].map(({ icon: Icon, v, l }) => (
              <div key={l} className="duo-card p-4 text-center">
                {Icon ? <Icon className="mx-auto mb-1 size-7 text-[var(--duo-blue)]" /> : <GameIcon name="permis" size={30} className="mx-auto mb-1" />}
                <p className="duo-h text-2xl" dir="ltr">
                  {v}
                </p>
                <p className="text-[13px] font-[700] text-[var(--duo-muted)]">{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {signs.length > 0 && (
              <section className="mt-8">
                <h2 className="duo-h mb-3 text-xl">{t("Les panneaux à reconnaître", "العلامات التي يجب التعرف عليها")}</h2>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {signs.map((q) => (
                    <li key={q.id} className="duo-card flex flex-col items-center gap-2 p-3 text-center">
                      <img src={q.img} alt="" data-zoom className="h-20 w-full object-contain" />
                      <span className="ar text-[14px] font-semibold leading-snug text-[var(--duo-ink)]">{q.rappel}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {points.length > 0 && (
              <section className="mt-8">
                <h2 className="duo-h mb-3 text-xl">{t("L'essentiel à retenir", "الأساسي الذي يجب حفظه")}</h2>
                <ol className="space-y-2.5">
                  {points.map((p, i) => (
                    <li key={i} className="duo-card flex items-start gap-3 p-3.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--duo-yellow)] text-[13px] font-[800] text-white">{i + 1}</span>
                      <span className={cx("text-[15px] font-[600] leading-relaxed text-[var(--duo-ink)]", lang === "fr" && HAS_AR.test(p) && "ar")}>{p}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </>
        )}

        {!timed && VOYANT_UNITS[node.unit] && <Voyants only={VOYANT_UNITS[node.unit]} />}

        {(schemas.length > 0 || ch) && (
          <section className="mt-8 flex flex-wrap gap-3">
            {schemas.map((id) => (
              <button key={id} onClick={() => setSchema(id)} className="duo-btn duo-btn-ghost !min-h-12 normal-case tracking-normal">
                <Shapes className="size-5" /> {t("Schéma :", "رسم:")} {schemaTitle(SCHEMAS[id], lang)}
              </button>
            ))}
            {ch && (
              <Link href={`/cours/${ch.slug}/`} className="duo-btn duo-btn-plain !min-h-12 normal-case tracking-normal">
                <BookOpen className="size-5" /> {t("Lire la fiche complète", "اقرأ الملخص الكامل")}
              </Link>
            )}
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[var(--duo-grey)] bg-white pb-[env(safe-area-inset-bottom)]">
        {resume && onResume ? (
          <div className="mx-auto flex max-w-[1000px] flex-col-reverse gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
            <button onClick={onStart} className="duo-btn duo-btn-ghost w-full sm:w-auto">
              {t("Recommencer l'étape", "أعد المرحلة من البداية")}
            </button>
            <button onClick={onResume} autoFocus className="duo-btn w-full sm:w-auto sm:min-w-[260px]">
              {t("Reprendre", "استأنف")} · {resume.correct.length}/{questions.length}
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[1000px] items-center justify-end px-4 py-4 sm:px-6 sm:py-6">
            <button onClick={onStart} autoFocus className="duo-btn w-full sm:w-auto sm:min-w-[220px]">
              {timed ? t("Commencer", "ابدأ") : t("Aux questions !", "إلى الأسئلة !")}
            </button>
          </div>
        )}
      </div>
      {schema && <SchemaModal id={schema} onClose={() => setSchema(null)} />}
    </div>
  );
}

/* ─────────────────────────── Questions ─────────────────────────── */
export function LessonPlay({
  node, questions, maxHearts, onEnd, onQuit, resume,
}: {
  node: GameNode;
  questions: Question[];
  maxHearts: number;
  onEnd: (won: boolean, stats: PlayStats) => void;
  onQuit: () => void;
  /** Reprise d'une tentative interrompue (étapes uniquement). */
  resume?: { snap: LessonSnapshot; queue: Question[] } | null;
}) {
  const { lang, t } = useLang();
  const autoAudio = useStore((s) => s.settings.autoAudio);
  const requeue = node.kind === "lesson";
  const timed = node.kind !== "lesson";
  const showPrompt = node.kind !== "summit";
  const snap = resume?.snap;
  const [queue, setQueue] = useState(resume?.queue ?? questions);
  const [pos, setPos] = useState(snap?.pos ?? 0);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState<null | { ok: boolean; praise: number }>(null);
  const [hearts, setHearts] = useState(snap?.hearts ?? maxHearts);
  const [hit, setHit] = useState(false);
  const [correct, setCorrect] = useState<Set<string>>(() => new Set(snap?.correct));
  const [mistakes, setMistakes] = useState(snap?.mistakes ?? 0);
  const [wrongIds, setWrongIds] = useState<string[]>(snap?.wrongIds ?? []);
  const [combo, setCombo] = useState(snap?.combo ?? 0);
  const [bestCombo, setBestCombo] = useState(snap?.bestCombo ?? 0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [schema, setSchema] = useState<string | null>(null);
  const start = useRef(0);
  useEffect(() => {
    start.current = Date.now() - (snap?.seconds ?? 0) * 1000;
    preloadSounds();
  }, [snap]);
  // Sauvegarde continue de l'étape (une question déjà corrigée compte comme passée).
  useEffect(() => {
    if (!requeue) return;
    const next = checked ? pos + 1 : pos;
    if (next >= queue.length || hearts <= 0) return clearSnapshot();
    const s: LessonSnapshot = {
      id: node.id,
      queue: queue.map((x) => x.id),
      pos: next,
      hearts,
      correct: [...correct],
      mistakes,
      wrongIds,
      combo,
      bestCombo,
      seconds: Math.round((Date.now() - start.current) / 1000),
    };
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify(s));
    } catch {}
  }, [requeue, node.id, queue, pos, checked, hearts, correct, mistakes, wrongIds, combo, bestCombo]);
  const q = queue[pos];
  const [clock, setClock] = useState({ pos: 0, left: QUESTION_SECONDS });
  const left = clock.pos === pos ? clock.left : QUESTION_SECONDS;

  const check = useCallback(
    (timedOut = false) => {
      if (!q || checked) return;
      const ok = !timedOut && isCorrect(q, picked);
      recordAnswer(q.id, ok, q.chapter);
      if (ok) {
        sfx.correct();
        setCorrect((c) => new Set(c).add(q.id));
        const nc = combo + 1;
        setCombo(nc);
        setBestCombo((b) => Math.max(b, nc));
      } else {
        sfx.wrong();
        setHearts((h) => h - 1);
        setHit(true);
        setTimeout(() => setHit(false), 450);
        setMistakes((m) => m + 1);
        setWrongIds((w) => (w.includes(q.id) ? w : [...w, q.id]));
        setCombo(0);
        if (requeue) setQueue((qs) => [...qs, q]);
      }
      setChecked({ ok, praise: Math.floor(Math.random() * PRAISE.length) });
    },
    [q, checked, picked, combo, requeue],
  );

  const stats = (): PlayStats => ({
    correct: correct.size,
    mistakes,
    total: questions.length,
    seconds: Math.round((Date.now() - start.current) / 1000),
    bestCombo,
    wrongIds,
  });

  const next = () => {
    if (hearts <= 0 || pos + 1 >= queue.length) clearSnapshot();
    if (hearts <= 0) return onEnd(false, stats());
    if (pos + 1 >= queue.length) return onEnd(true, stats());
    setPos(pos + 1);
    setPicked([]);
    setChecked(null);
    window.scrollTo({ top: 0 });
  };

  // Chrono (défi et sommet) : 30 s par question, comme à l'examen.
  const checkRef = useRef(check);
  useEffect(() => {
    checkRef.current = check;
  });
  useEffect(() => {
    if (!timed || checked) return;
    let remaining = QUESTION_SECONDS;
    const tm = setInterval(() => {
      remaining -= 1;
      setClock({ pos, left: remaining });
      if (remaining > 0 && remaining <= 5) sfx.tick();
      if (remaining <= 0) {
        clearInterval(tm);
        checkRef.current(true);
      }
    }, 1000);
    return () => clearInterval(tm);
  }, [pos, timed, checked]);

  const toggle = (k: number) => {
    if (checked || !q) return;
    sfx.tap();
    setPicked((p) => (q.multi ? (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]) : [k]));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || confirmQuit || schema) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length && !checked) toggle(n - 1);
      if (e.key === "Enter") {
        e.preventDefault();
        if (checked) next();
        else if (picked.length) check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!q) return null;
  const tx = qText(q, lang);
  const official = q.kind === "official";
  const progress = (correct.size / questions.length) * 100 + (requeue ? 0 : ((pos + (checked ? 1 : 0) - correct.size) / questions.length) * 100);
  const stateOf = (k: number): "correct" | "wrong" | "missed" | "selected" | undefined => {
    const sel = picked.includes(k);
    if (!checked) return sel ? "selected" : undefined;
    const good = q.answer.includes(k);
    if (good && sel) return "correct";
    if (sel && !good) return "wrong";
    if (good && !sel) return "missed";
    return undefined;
  };
  const answerText = q.answer.map((i) => (official ? t(`case ${i + 1}`, `الخانة ${i + 1}`) : tx.option(i))).join(" + ");
  const isRetry = queue.slice(0, pos).some((x) => x.id === q.id);
  const comboMsg = checked?.ok && combo >= 3 && (combo === 3 || combo % 5 === 0);

  return (
    <div className={cx("min-h-dvh", checked ? "pb-[60vh] sm:pb-72" : "pb-36")}>
      <TopBar progress={progress} hearts={hearts} maxHearts={maxHearts} onQuit={() => setConfirmQuit(true)} timeLeft={timed ? left : undefined} hit={hit} />

      <div key={`${q.id}-${pos}`} className="animate-pop mx-auto max-w-[640px] px-4 pt-8 sm:pt-12">
        {isRetry && (
          <p className="mb-3 flex items-center gap-2 text-[14px] font-[800] uppercase tracking-wide text-[var(--duo-orange)]">
            <Zap className="size-5 fill-[var(--duo-orange)]" /> {t("Erreur précédente", "خطأ سابق")}
          </p>
        )}
        {official ? (
          <>
            <h1 className="duo-h mb-4 text-[22px] leading-snug sm:text-[26px]">
              {showPrompt && tx.prompt ? tx.prompt : t("Coche la ou les bonnes cases", "اختر الخانة أو الخانات الصحيحة")}
            </h1>
            <div className="duo-card overflow-hidden !p-0">
              <img src={q.img} alt={t("Question", "السؤال")} data-zoom data-caption="" className="w-full bg-[#1f1f1f] object-contain" />
            </div>
            <div className="mt-4 flex items-center gap-3" dir="ltr">
              {q.audio && <AudioButton src={q.audio} auto={autoAudio} />}
              <p className="text-[14px] font-[700] text-[var(--duo-muted)]" dir={lang === "ar" ? "rtl" : "ltr"}>
                {t("Une ou plusieurs cases à cocher", "خانة واحدة أو أكثر")}
              </p>
            </div>
            <div className={cx("mt-4 grid gap-3", q.options.length === 2 ? "grid-cols-2" : "grid-cols-4")} dir="ltr">
              {q.options.map((_, k) => (
                <button
                  key={k}
                  className={cx("duo-tile h-16 text-[26px] font-[800]", stateOf(k) === "wrong" && "animate-shake")}
                  data-state={stateOf(k)}
                  onClick={() => toggle(k)}
                  disabled={!!checked}
                  role="checkbox"
                  aria-checked={picked.includes(k)}
                >
                  {k + 1}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-[14px] font-[800] uppercase tracking-wide text-[var(--duo-purple)]">
              {q.kind === "sign" ? t("Panneau", "علامة") : t("Règle du code", "قاعدة")}
              <span className="ms-2 normal-case tracking-normal text-[var(--duo-grey-d)]">
                {q.multi ? t("· plusieurs réponses", "· عدة أجوبة") : t("· une réponse", "· جواب واحد")}
              </span>
            </p>
            {tx.prompt && <h1 className={cx("duo-h text-[22px] leading-snug sm:text-[26px]", lang === "ar" && "leading-relaxed")}>{tx.prompt}</h1>}
            {tx.promptAlt && <p className={cx("mt-1 font-[600] text-[var(--duo-muted)]", HAS_AR.test(tx.promptAlt) ? "ar text-[17px]" : "text-[15px]")}>{tx.promptAlt}</p>}
            {q.img && (
              <div className="duo-card mx-auto mt-5 grid h-44 w-full max-w-[280px] place-items-center p-3">
                <img src={q.img} alt="" data-zoom className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div className="mt-6 space-y-3" role={q.multi ? "group" : "radiogroup"}>
              {q.options.map((_, k) => {
                const label = tx.option(k);
                const st = stateOf(k);
                return (
                  <button
                    key={k}
                    className={cx("duo-tile flex min-h-[60px] w-full items-center gap-3 px-3.5 py-3 text-start", st === "wrong" && "animate-shake")}
                    data-state={st}
                    onClick={() => toggle(k)}
                    disabled={!!checked}
                    role={q.multi ? "checkbox" : "radio"}
                    aria-checked={picked.includes(k)}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[8px] border-2 border-current/30 text-[14px] font-[800] opacity-70">{k + 1}</span>
                    <span className={cx("flex-1 text-[16px] font-[700] leading-snug", HAS_AR.test(label) && "ar")}>{label}</span>
                    {st === "correct" && <Check className="size-6 shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bas d'écran : bouton Vérifier, puis bandeau de correction */}
      {!checked ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[var(--duo-grey)] bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
            <span className="text-[14px] font-[700] text-[var(--duo-grey-d)] max-sm:hidden">
              {countLabel(lang, questions.length - correct.size, ["question restante", "questions restantes"], ["سؤال متبق", "سؤالان متبقيان", "أسئلة متبقية", "سؤالا متبقيا"])}
            </span>
            <button onClick={() => check()} disabled={!picked.length} className="duo-btn w-full sm:w-auto sm:min-w-[180px]">
              {t("Vérifier", "تحقق")}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cx("duo-sheet fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]", checked.ok ? "bg-[var(--duo-green-50)]" : "bg-[var(--duo-red-50)]")}
          role="status"
        >
          <div className="mx-auto max-h-[58vh] max-w-[1000px] overflow-y-auto px-4 pb-4 pt-5 sm:flex sm:items-end sm:gap-6 sm:px-6 sm:py-6">
            <Mascot
              key={`${q.id}-${pos}`}
              pose={checked.ok ? PRAISE_POSES[checked.praise % PRAISE_POSES.length] : OOPS_POSES[checked.praise % OOPS_POSES.length]}
              size={120}
              className="duo-mascot-in shrink-0 self-end max-sm:hidden"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span className={cx("grid size-12 shrink-0 place-items-center rounded-full bg-white", checked.ok ? "text-[var(--duo-green)]" : "text-[var(--duo-red)]")}>
                  {checked.ok ? <Check className="size-8" strokeWidth={4} /> : <X className="size-8" strokeWidth={4} />}
                </span>
                <div>
                  <p className={cx("duo-h !text-[22px] leading-tight", checked.ok ? "!text-[var(--duo-green)]" : "!text-[var(--duo-red-d)]")}>
                    {checked.ok ? PRAISE[checked.praise][lang === "ar" ? 1 : 0] : t("Bonne réponse :", "الجواب الصحيح:")}
                  </p>
                  {!checked.ok && <p className={cx("text-[16px] font-[800] text-[var(--duo-red-d)]", HAS_AR.test(answerText) && "ar")}>{answerText}</p>}
                  {comboMsg && (
                    <p className="text-[15px] font-[800] text-[var(--duo-orange)]">
                      {t(`${combo} bonnes réponses d'affilée !`, `${combo} أجوبة صحيحة متتالية !`)}
                    </p>
                  )}
                </div>
              </div>
              <p className={cx("mt-3 text-[15px] font-[500] leading-relaxed", checked.ok ? "text-[var(--duo-green-d)]" : "text-[#922b21]")}>{tx.explanation}</p>
              {!checked.ok && tx.rappel && tx.rappel !== tx.explanation && tx.rappel !== answerText && (
                <p className="mt-2 flex items-start gap-2 rounded-[12px] bg-white/70 p-3 text-[15px] font-[700] text-[var(--duo-ink)]">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-[var(--duo-yellow-d)]" />
                  <span className={cx(lang === "fr" && HAS_AR.test(tx.rappel) && "ar")}>{tx.rappel}</span>
                </p>
              )}
              {!checked.ok && requeue && (
                <p className="mt-2 text-[14px] font-[700] text-[var(--duo-red-d)]">{t("Cette question reviendra à la fin de l'étape.", "سيعود هذا السؤال في نهاية المرحلة.")}</p>
              )}
              {q.schema && SCHEMAS[q.schema] && (
                <button onClick={() => setSchema(q.schema!)} className="mt-3 inline-flex items-center gap-2 text-[14px] font-[800] uppercase tracking-wide text-[var(--duo-blue)]">
                  <Shapes className="size-5" /> {checked.ok ? t("Revoir avec le schéma", "راجع بالرسم") : t("Comprendre mon erreur", "افهم خطئي")}
                </button>
              )}
            </div>
            <button onClick={next} autoFocus className={cx("duo-btn mt-4 w-full shrink-0 sm:mt-0 sm:w-auto sm:min-w-[180px]", checked.ok ? "duo-btn-green" : "duo-btn-red")}>
              {hearts <= 0 ? t("Voir le résultat", "عرض النتيجة") : t("Continuer", "متابعة")}
            </button>
          </div>
        </div>
      )}

      {confirmQuit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setConfirmQuit(false)}>
          <div className="duo-sheet w-full max-w-md rounded-t-[20px] bg-white p-6 text-center sm:rounded-[20px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <Mascot pose="worried" size={130} className="duo-mascot-in mx-auto" />
            <p className="duo-h mt-3 text-[22px]">{t("Attends, ne pars pas !", "انتظر، لا تغادر !")}</p>
            <p className="mt-1 text-[15px] font-[600] text-[var(--duo-muted)]">
              {t("Si tu quittes maintenant, tu perds ta progression dans cette étape.", "إذا غادرت الآن، ستفقد تقدمك في هذه المرحلة.")}
            </p>
            <button onClick={() => setConfirmQuit(false)} autoFocus className="duo-btn duo-btn-blue mt-6 w-full">
              {t("Continuer l'étape", "متابعة المرحلة")}
            </button>
            <button
              onClick={() => {
                clearSnapshot();
                onQuit();
              }}
              className="duo-btn duo-btn-plain mt-2 w-full !text-[var(--duo-red)]"
            >
              {t("Quitter", "مغادرة")}
            </button>
          </div>
        </div>
      )}
      {schema && <SchemaModal id={schema} onClose={() => setSchema(null)} />}
    </div>
  );
}

/* ─────────────────────────── Fin d'étape ─────────────────────────── */
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.8,
      color: ["#d92b2b", "#198754", "#f5b041", "#2980b9", "#e74c3c", "#2ecc71"][i % 6],
      rot: Math.random() * 360,
    })),
  );
  return (
    <div aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="duo-confetti" style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, rotate: `${p.rot}deg` }} />
      ))}
    </div>
  );
}

function StatBox({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: typeof Zap }) {
  return (
    <div className="duo-pop-in rounded-[16px] border-2 p-0.5" style={{ borderColor: color, background: color }}>
      <p className="py-1 text-center text-[12px] font-[800] uppercase tracking-wider text-white">{label}</p>
      <p className="flex items-center justify-center gap-1.5 rounded-[13px] bg-white py-3 text-[20px] font-[800]" style={{ color }} dir="ltr">
        <Icon className="size-5" /> {value}
      </p>
    </div>
  );
}

export function LessonEnd({
  node, won, stats, xp, hasNext, onContinue, onNext, onRetry, onReview,
}: {
  node: GameNode;
  won: boolean;
  stats: PlayStats;
  xp: number;
  hasNext: boolean;
  onContinue: () => void;
  onNext: () => void;
  onRetry: () => void;
  onReview?: () => void;
}) {
  const { lang, t } = useLang();
  const answered = stats.correct + stats.mistakes;
  const acc = answered ? Math.round((stats.correct / answered) * 100) : 0;
  const time = `${Math.floor(stats.seconds / 60)}:${String(stats.seconds % 60).padStart(2, "0")}`;
  useEffect(() => {
    if (!won) return sfx.fail();
    if (node.kind === "summit") sfx.summit();
    else if (node.kind === "challenge") sfx.chest();
    else sfx.complete();
    // Sans-faute : klaxon joyeux à deux tons.
    if (stats.mistakes === 0) setTimeout(() => sfx.horn(), 900);
  }, [won, stats.mistakes, node.kind]);

  const title = won
    ? node.kind === "summit"
      ? t("Tu as atteint le sommet !", "وصلت إلى القمة !")
      : node.kind === "challenge"
        ? t("Défi réussi !", "نجحت في التحدي !")
        : stats.mistakes === 0
          ? t("Étape parfaite !", "مرحلة مثالية !")
          : t("Étape terminée !", "اكتملت المرحلة !")
    : t("Permis suspendu !", "الرخصة موقوفة !");

  return (
    <div className="flex min-h-dvh flex-col pb-40">
      {won && <Confetti />}
      {won && <div className="zellige-band h-4 w-full shrink-0" aria-hidden="true" />}
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-4 pt-10 text-center">
        {won && node.kind === "summit" && <img src={asset("/decor/sommet.webp")} alt="" className="duo-mascot-in mb-2 h-[140px] w-auto" />}
        {won && node.kind === "challenge" && <GameIcon name="chest-open" size={110} className="duo-mascot-in -mb-6" />}
        <Mascot
          pose={won ? (node.kind === "summit" ? "permis" : node.kind === "challenge" ? "trophy" : stats.mistakes === 0 ? "excellent" : "cheer") : node.kind === "summit" ? "wrong" : "tired"}
          size={200}
          className="duo-mascot-in"
        />
        <h1 className={cx("duo-h mt-6 text-[30px] leading-tight", won ? "!text-[var(--duo-yellow-d)]" : "!text-[var(--duo-red)]")}>{title}</h1>
        <p className="mt-2 max-w-md text-[16px] font-[600] text-[var(--duo-muted)]">
          {won
            ? node.kind === "summit"
              ? t(
                  `${stats.correct} bonnes réponses sur ${stats.total}. Tu as vu toutes les questions du parcours : tu es prêt pour l'examen !`,
                  `${stats.correct} أجوبة صحيحة من ${stats.total}. رأيت كل أسئلة المسار: أنت مستعد للامتحان !`,
                )
              : t("L'étape suivante est débloquée. Continue sur ta lancée !", "تم فتح المرحلة الموالية. واصل على هذا المنوال !")
            : node.kind === "summit"
              ? t(
                  `${stats.correct} bonnes réponses — il en faut 32 sur 40. Revois tes erreurs et retente le sommet !`,
                  `${stats.correct} أجوبة صحيحة — يجب 32 من 40. راجع أخطاءك وأعد محاولة القمة !`,
                )
              : t(
                  "Tu as perdu tous tes points. Pour avancer, il faut réussir cette étape : relis le cours express et réessaie, tu vas y arriver !",
                  "فقدت كل نقطك. للتقدم، يجب أن تنجح في هذه المرحلة: أعد قراءة الدرس السريع وحاول مجددا، ستنجح !",
                )}
        </p>
        <div className="mt-8 grid w-full grid-cols-3 gap-3">
          <StatBox label={won ? t("XP gagnés", "نقاط الخبرة") : t("Réponses", "الأجوبة")} value={won ? `+${xp}` : `${stats.correct}/${stats.total}`} color="#f5b041" icon={Zap} />
          <StatBox label={t("Précision", "الدقة")} value={`${acc} %`} color="#198754" icon={Target} />
          <StatBox label={t("Temps", "المدة")} value={time} color="#2980b9" icon={Clock} />
        </div>
        {stats.wrongIds.length > 0 && (
          <p className="mt-5 text-[14px] font-[700] text-[var(--duo-muted)]">
            {countLabel(lang, stats.wrongIds.length, ["question ratée ajoutée", "questions ratées ajoutées"], ["سؤال أُضيف", "سؤالان أُضيفا", "أسئلة أُضيفت", "سؤالا أُضيف"])}{" "}
            {t("à ton", "إلى")}{" "}
            <Link href="/erreurs/" className="text-[var(--duo-blue)]">
              {t("carnet d'erreurs", "دفتر الأخطاء")}
            </Link>
            .
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[var(--duo-grey)] bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[1000px] flex-col-reverse gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
          {won ? (
            <>
              <button onClick={onContinue} className="duo-btn duo-btn-ghost w-full sm:w-auto">
                {t("Retour au parcours", "العودة إلى المسار")}
              </button>
              {hasNext ? (
                <button onClick={onNext} autoFocus className="duo-btn w-full sm:w-auto sm:min-w-[220px]">
                  {t("Étape suivante", "المرحلة الموالية")}
                </button>
              ) : (
                <button onClick={onContinue} autoFocus className="duo-btn w-full sm:w-auto sm:min-w-[220px]">
                  {t("Continuer", "متابعة")}
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={onContinue} className="duo-btn duo-btn-plain w-full sm:w-auto">
                {t("Plus tard", "لاحقا")}
              </button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {onReview && (
                  <button onClick={onReview} className="duo-btn duo-btn-ghost w-full sm:w-auto">
                    {t("Revoir le cours", "راجع الدرس")}
                  </button>
                )}
                <button onClick={onRetry} autoFocus className="duo-btn duo-btn-blue w-full sm:w-auto sm:min-w-[200px]">
                  {t("Réessayer", "حاول مجددا")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
