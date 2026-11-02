"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Tip, vehicleSrc } from "./ui";

/**
 * Tunnel : mini-jeu. La voiture roule vers le tunnel ; il faut allumer les feux de croisement avant
 * d'y entrer. Repères du cours : dans un tunnel, feux de croisement obligatoires ; demi-tour, arrêt
 * et stationnement interdits ; vent latéral plus fort à la sortie d'un tunnel.
 */
const DRIVE = 6; // secondes jusqu'à l'entrée du tunnel

export default function Tunnel() {
  const { lang, t } = useLang();
  const [run, setRun] = useState(0);
  const [moving, setMoving] = useState(false);
  const [lights, setLights] = useState(false);
  const [result, setResult] = useState<"ok" | "ko" | null>(null);

  useEffect(() => {
    const start = setTimeout(() => setMoving(true), 80);
    const end = setTimeout(() => setResult((r) => r ?? "ko"), DRIVE * 1000 + 80);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [run]);

  // Remise à zéro AVANT le nouveau rendu : la voiture repart bien du bas.
  const restart = () => {
    setMoving(false);
    setLights(false);
    setResult(null);
    setRun((n) => n + 1);
  };

  const switchOn = () => {
    if (result || lights) return;
    setLights(true);
    setResult("ok");
  };

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,340px)_1fr]">
        <svg key={run} viewBox="0 0 640 648" className="w-full overflow-hidden rounded-[20px] border-2 border-line bg-[#6f7f5f]" direction="ltr">
          <image href={asset("/tiles/tunnel.webp")} x={0} y={0} width={640} height={648} />
          <g
            style={{
              transform: `translate(372px, ${moving ? 300 : 720}px)`,
              opacity: moving && result ? 0.25 : 1,
              transition: `transform ${DRIVE}s linear, opacity 1.2s ease ${DRIVE - 0.6}s`,
            }}
          >
            {/* Faisceau des feux de croisement devant la voiture */}
            <polygon points="-22,-50 22,-50 60,-190 -60,-190" fill="#fff6b0" opacity={lights ? 0.55 : 0} style={{ transition: "opacity 0.3s" }} />
            <ellipse cx={0} cy={4} rx={24} ry={46} fill="#000" opacity={0.2} />
            <image href={vehicleSrc("autoecole")} x={-25} y={-50} width={50} height={100} preserveAspectRatio="xMidYMid meet" />
            {lights && (
              <>
                <circle cx={-13} cy={-44} r={6} fill="#fff6b0" className="schema-blink" />
                <circle cx={13} cy={-44} r={6} fill="#fff6b0" className="schema-blink" />
              </>
            )}
          </g>
        </svg>
        <div className="space-y-3">
          <button
            onClick={switchOn}
            disabled={!!result}
            className={`btn w-full !min-h-14 text-[15px] ${lights ? "!bg-[#f5b041] !text-[#1e2328]" : "btn-primary"}`}
          >
            <Lightbulb className="size-5" /> {lights ? t("Feux de croisement allumés", "أضواء التقابل مشتعلة") : t("Allumer les feux de croisement", "شغّل أضواء التقابل")}
          </button>
          {result && (
            <p className={`animate-pop rounded-[16px] border-2 p-3 text-[15px] font-[800] ${result === "ok" ? "border-[#2ecc71] bg-[#eafaf1] text-[#198754]" : "border-[#e74c3c] bg-[#fdedec] text-[#c0392b]"}`}>
              {result === "ok"
                ? t("Bravo : dans un tunnel, les feux de croisement sont obligatoires.", "أحسنت: داخل النفق، أضواء التقابل إجبارية.")
                : t("Trop tard ! Les feux de croisement doivent être allumés avant d'entrer dans le tunnel.", "متأخر ! يجب تشغيل أضواء التقابل قبل الدخول إلى النفق.")}
            </p>
          )}
          <ul className="space-y-2 text-[14px] font-[600]">
            {[
              ["Feux de croisement obligatoires dans le tunnel.", "أضواء التقابل إجبارية داخل النفق."],
              ["Interdits dans le tunnel : demi-tour, arrêt et stationnement.", "ممنوع داخل النفق: نصف الدورة والوقوف والتوقف."],
              ["À la sortie, attention au vent latéral : tiens bien le volant.", "عند الخروج، انتبه للرياح الجانبية: أمسك المقود بإحكام."],
            ].map(([fr, ar]) => (
              <li key={fr} className="rounded-[14px] border-2 border-line bg-white p-3">
                {lang === "ar" ? ar : fr}
              </li>
            ))}
          </ul>
          <button className="btn btn-ghost !py-2 text-sm" onClick={restart}>
            <Play className="size-4" /> {t("Rejouer", "أعد")}
          </button>
        </div>
      </div>
      <Tip>
        {t(
          "Panneau « entrée de tunnel » = feux de croisement + ni demi-tour, ni arrêt, ni stationnement.",
          "علامة « الدخول إلى النفق » = أضواء التقابل + لا نصف دورة ولا وقوف ولا توقف.",
        )}
      </Tip>
    </div>
  );
}
