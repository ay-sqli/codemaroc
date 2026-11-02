"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBank } from "@/lib/questions";
import { XP, buildPath, heartsFor, questionsFor, statusOf } from "@/lib/game";
import { completeLesson, getState, recordCombo, useStore } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import type { Question } from "@/lib/types";
import { LessonEnd, LessonIntro, LessonPlay, clearSnapshot, loadSnapshot, type LessonSnapshot, type PlayStats } from "@/components/game/LessonPlayer";
import { Mascot } from "@/components/game/Mascot";

type Phase =
  | { k: "intro" }
  | { k: "play"; attempt: number; qs: Question[]; resume?: { snap: LessonSnapshot; queue: Question[] } }
  | { k: "end"; won: boolean; stats: PlayStats; xp: number };

/** Une étape du parcours : cours express → questions → résultat (réussie = étape suivante débloquée). */
export function Lesson() {
  const { t } = useLang();
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const { bank, error } = useBank();
  const game = useStore((s) => s.game);
  const [phase, setPhase] = useState<Phase>({ k: "intro" });
  // Questions affichées dans le cours express : figées pour l'étape (tirage du défi / sommet au départ).
  const [introQs, setIntroQs] = useState<{ id: string; qs: Question[]; snap: LessonSnapshot | null } | null>(null);

  if (error) return <p className="duo p-6 text-[var(--duo-red)]">{error}</p>;
  if (!bank) return <div className="duo min-h-dvh animate-pulse bg-[var(--duo-snow)]" />;
  const path = buildPath(bank);
  const node = path.byId.get(id);
  const back = () => router.push("/");

  if (!node) {
    return (
      <div className="duo grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <Mascot pose="confused" size={160} className="mx-auto" />
          <p className="duo-h mt-4 text-2xl">{t("Étape introuvable", "المرحلة غير موجودة")}</p>
          <Link href="/" className="duo-btn mt-6">
            {t("Retour au parcours", "العودة إلى المسار")}
          </Link>
        </div>
      </div>
    );
  }

  // Le statut est figé au début : une fois l'étape réussie, l'écran de fin ne doit pas basculer.
  const status = phase.k === "end" ? "done" : statusOf(path, game, node.id);
  if (status === "locked") {
    return (
      <div className="duo grid min-h-dvh place-items-center p-6 text-center">
        <div className="max-w-sm">
          <Mascot pose="forbidden" size={170} className="mx-auto" />
          <p className="duo-h mt-5 text-2xl">{t("Étape verrouillée", "مرحلة مقفلة")}</p>
          <p className="mt-2 font-[600] text-[var(--duo-muted)]">{t("Termine d'abord les étapes précédentes du parcours.", "أكمل أولا المراحل السابقة في المسار.")}</p>
          <Link href="/" className="duo-btn mt-6">
            {t("Retour au parcours", "العودة إلى المسار")}
          </Link>
        </div>
      </div>
    );
  }

  const qs = introQs?.id === node.id ? introQs.qs : null;
  if (!qs) {
    setIntroQs({ id: node.id, qs: questionsFor(node, bank, getState()), snap: node.kind === "lesson" ? loadSnapshot(node.id) : null });
    return <div className="duo min-h-dvh" />;
  }
  // Étape interrompue (page fermée, téléphone éteint…) : on propose de reprendre à la même question.
  const snap = introQs?.snap ?? null;
  const resumeQueue = snap ? (snap.queue.map((qid) => bank.all.get(qid)).filter(Boolean) as Question[]) : [];
  const canResume = !!snap && resumeQueue.length === snap.queue.length && snap.pos < resumeQueue.length;
  const maxHearts = heartsFor(node.kind);
  const flatIndex = path.flat.findIndex((n) => n.id === node.id);
  const nextNode = path.flat[flatIndex + 1];

  const start = () => {
    clearSnapshot();
    setPhase((p) => ({ k: "play", attempt: (p.k === "play" ? p.attempt : 0) + 1, qs: node.kind === "lesson" ? qs : questionsFor(node, bank, getState()) }));
  };
  const resume = () => snap && setPhase({ k: "play", attempt: 1, qs, resume: { snap, queue: resumeQueue } });

  const end = (won: boolean, stats: PlayStats) => {
    let xp = 0;
    if (won) {
      const replay = !!getState().game.done[node.id];
      xp = replay ? (node.kind === "summit" ? 20 : XP.replay) : node.kind === "summit" ? XP.summit : node.kind === "challenge" ? XP.challenge : XP.lesson + (stats.mistakes === 0 ? XP.perfect : 0);
      const answered = stats.correct + stats.mistakes;
      completeLesson(node.id, xp, answered ? stats.correct / answered : 1, stats.bestCombo);
    } else recordCombo(stats.bestCombo);
    setPhase({ k: "end", won, stats, xp });
  };

  return (
    <div className="duo min-h-dvh bg-[var(--duo-canvas)]">
      {phase.k === "intro" && <LessonIntro node={node} questions={qs} onStart={start} onQuit={back} resume={canResume ? snap : null} onResume={resume} />}
      {phase.k === "play" && <LessonPlay key={phase.attempt} node={node} questions={phase.qs} maxHearts={maxHearts} onEnd={end} onQuit={back} resume={phase.resume} />}
      {phase.k === "end" && (
        <LessonEnd
          node={node}
          won={phase.won}
          stats={phase.stats}
          xp={phase.xp}
          hasNext={!!nextNode}
          onContinue={back}
          onNext={() => {
            setPhase({ k: "intro" });
            router.push(`/lecon/?id=${encodeURIComponent(nextNode.id)}`);
          }}
          onRetry={start}
          onReview={node.kind === "lesson" ? () => setPhase({ k: "intro" }) : undefined}
        />
      )}
    </div>
  );
}
