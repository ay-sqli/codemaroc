"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Tip, Toggle, vehicleSrc } from "./ui";

/**
 * Passage à niveau animé : feux rouges clignotants, barrières qui s'abaissent, la voiture s'arrête,
 * le train passe, puis la voiture traverse. Version « sans barrières » : on s'arrête et on regarde.
 * Repères du cours : feu rouge clignotant = « stop » ; jamais d'arrêt ni de stationnement sur la voie
 * ferrée (stationnement interdit à moins de 12 m) ; sans barrières, s'assurer qu'aucun train n'arrive ;
 * si un train approche, quitter immédiatement la voie.
 */
const ASPHALT = "#424e58";
/** Étapes de la scène (secondes depuis le lancement). */
const STEPS = [0, 1.2, 2.6, 6.8, 7.8, 10.5] as const;

function Train({ x }: { x: number }) {
  return (
    <g style={{ transform: `translate(${x}px, 304px)`, transition: x > 0 ? "transform 3.6s linear" : "none" }}>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${-i * 186} 0)`}>
          <rect x={-88} y={-36} width={176} height={72} rx={i === 0 ? 30 : 10} fill="#e8eaed" stroke="#1e2328" strokeWidth={5} />
          <rect x={-74} y={-22} width={148} height={44} rx={6} fill="#f39c12" opacity={0.9} />
          <rect x={-60} y={-8} width={120} height={16} rx={4} fill="#5b6470" />
          {i === 0 && <circle cx={74} cy={0} r={8} fill="#ffe066" stroke="#1e2328" strokeWidth={3} />}
        </g>
      ))}
    </g>
  );
}

function Arm({ px, py, dir, down }: { px: number; py: number; dir: 1 | -1; down: boolean }) {
  // Bras pivotant autour du poteau : horizontal (fermé) ou levé à 80° (ouvert).
  return (
    <g style={{ transform: `translate(${px}px, ${py}px) rotate(${down ? 0 : -80 * dir}deg)`, transition: "transform 1.1s ease-in-out" }}>
      <rect x={dir === 1 ? 0 : -262} y={-8} width={262} height={16} rx={8} fill="#fff" stroke="#1e2328" strokeWidth={3} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={(dir === 1 ? 12 : -250) + i * 36} y={-6} width={18} height={12} fill="#e74c3c" />
      ))}
    </g>
  );
}

export default function PassageNiveau() {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<"barrieres" | "sans">("barrieres");
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    // Lancement : on enchaîne les étapes (rendu initial à l'étape -1, puis minuterie).
    const timers = STEPS.map((s, i) => setTimeout(() => setStep(i), s * 1000 + 60));
    return () => timers.forEach(clearTimeout);
  }, [run, mode]);

  // Remise à zéro avant le nouveau rendu (sinon la scène repartirait de la fin).
  const restart = (m = mode) => {
    setStep(-1);
    setMode(m);
    setRun((n) => n + 1);
  };

  const barriers = mode === "barrieres";
  const flashing = step >= 0 && step < 4;
  const down = barriers && step >= 1 && step < 4;
  const trainX = step >= 2 ? 1100 : -260;
  // Voiture : approche, s'arrête avant la barrière (y = 500), puis traverse quand c'est libre.
  const carY = step < 0 ? 700 : step < 4 ? 505 : -90;
  const carDur = step < 4 ? 2.4 : 2.6;

  const msg =
    step < 1
      ? t("Le feu rouge clignote : c'est un STOP.", "الضوء الأحمر الوامض: إنه « قف ».")
      : step < 2
        ? barriers
          ? t("Les barrières s'abaissent : je m'arrête AVANT, jamais sur les rails.", "الحواجز تنزل: أتوقف قبلها، ولا أتوقف أبدا فوق السكة.")
          : t("Pas de barrière : je m'arrête, je regarde à gauche et à droite.", "لا يوجد حاجز: أتوقف وأنظر يمينا ويسارا.")
        : step < 4
          ? t("Le train passe : j'attends, moteur au ralenti.", "القطار يمر: أنتظر.")
          : t("Voie libre et feux éteints : je traverse sans m'arrêter sur la voie.", "الطريق خالية والأضواء مطفأة: أعبر دون التوقف فوق السكة.");

  return (
    <div className="space-y-4">
      <Toggle
        options={[
          { id: "barrieres", label: t("Avec barrières", "بحواجز") },
          { id: "sans", label: t("Sans barrières", "بدون حواجز") },
        ]}
        value={mode}
        onChange={(m) => restart(m)}
      />
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,340px)_1fr]">
        <svg key={`${run}-${mode}`} viewBox="0 0 640 614" className="w-full overflow-hidden rounded-[20px] border-2 border-line bg-[#eadfc6]" direction="ltr">
          <image href={asset("/tiles/passage-niveau.webp")} x={0} y={0} width={640} height={614} />
          {/* On efface les barrières dessinées pour les animer */}
          <rect x={180} y={198} width={268} height={22} fill={ASPHALT} />
          <rect x={198} y={390} width={268} height={22} fill={ASPHALT} />
          {barriers ? (
            <>
              <Arm px={176} py={209} dir={1} down={down} />
              <Arm px={470} py={401} dir={-1} down={down} />
            </>
          ) : (
            <>
              <rect x={160} y={190} width={30} height={30} fill="#9aa3ad" />
              <rect x={455} y={386} width={30} height={30} fill="#9aa3ad" />
            </>
          )}
          {/* Feux rouges clignotants au bord de la route */}
          {[
            [150, 170],
            [495, 440],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <rect x={-22} y={-14} width={44} height={28} rx={14} fill="#1e2328" />
              <circle cx={-10} cy={0} r={8} fill={flashing ? "#ff2d2d" : "#4a2222"} className={flashing ? "schema-beacon-red" : ""} />
              <circle cx={10} cy={0} r={8} fill={flashing ? "#ff2d2d" : "#4a2222"} className={flashing ? "schema-beacon-blue" : ""} style={flashing ? { fill: "#ff2d2d" } : undefined} />
            </g>
          ))}
          <Train x={trainX} />
          <g style={{ transform: `translate(372px, ${carY}px)`, transition: step < 0 ? "none" : `transform ${carDur}s cubic-bezier(0.25, 0.6, 0.35, 1)` }}>
            <ellipse cx={0} cy={4} rx={26} ry={48} fill="#000" opacity={0.2} />
            <image href={vehicleSrc("autoecole")} x={-26} y={-52} width={52} height={104} preserveAspectRatio="xMidYMid meet" />
          </g>
        </svg>
        <div className="space-y-3">
          <p className="min-h-[3.5rem] rounded-[16px] border-2 border-[#d92b2b]/30 bg-[#fdedec] p-3 text-[15px] font-[800] text-[#a81c1c]">{msg}</p>
          <ul className="space-y-2 text-[14px] font-[600]">
            {[
              ["Ralentis à l'approche d'une voie ferrée ou de tramway.", "خفف السرعة عند الاقتراب من سكة حديدية أو سكة الترامواي."],
              ["Jamais d'arrêt ni de stationnement sur la voie ferrée ; stationnement interdit à moins de 12 m.", "ممنوع الوقوف والتوقف فوق السكة؛ والوقوف ممنوع على أقل من 12 م."],
              ["Sans barrières : ne t'engage qu'après t'être assuré qu'aucun train n'arrive.", "بدون حواجز: لا تدخل إلا بعد التأكد من غياب القطار."],
              ["Bloqué sur les rails à l'approche d'un train : quitte immédiatement la voie.", "إذا علقت فوق السكة واقترب قطار: اخرج منها فورا."],
            ].map(([fr, ar]) => (
              <li key={fr} className="rounded-[14px] border-2 border-line bg-white p-3">
                {lang === "ar" ? ar : fr}
              </li>
            ))}
          </ul>
          <button className="btn btn-primary !py-2 text-sm" onClick={() => restart()}>
            <Play className="size-4" /> {t("Rejouer la scène", "أعد المشهد")}
          </button>
        </div>
      </div>
      <Tip>
        {t(
          "Un train ne peut ni s'arrêter ni t'éviter : au passage à niveau, c'est toujours lui qui passe.",
          "القطار لا يستطيع التوقف ولا تفاديك: عند الممر السككي، هو الذي يمر دائما.",
        )}
      </Tip>
    </div>
  );
}
