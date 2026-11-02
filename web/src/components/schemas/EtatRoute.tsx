"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Stat, Tip, Toggle, vehicleSrc } from "./ui";

/**
 * État de la route : la même voiture freine sur différents revêtements.
 * Chiffres du cours : réaction = (V/10) × 3, freinage = (V/10)², sur route mouillée freinage × 2.
 * Pour la neige, le verglas, les gravillons… le cours ne donne pas de coefficient : le schéma
 * montre seulement que le freinage est beaucoup plus long (illustration, sans chiffre).
 */
type Surface = "sec" | "pluie" | "neige" | "gravillons" | "terre" | "eboulement";

const SURFACES: Record<Surface, { tile: string; k: number | null; fr: string; ar: string; tips: [string, string][] }> = {
  sec: {
    tile: "ligne-continue-jaune",
    k: 1,
    fr: "Route sèche",
    ar: "طريق جافة",
    tips: [["Adhérence normale : la distance d'arrêt suit les formules du cours.", "التحام عادي: مسافة التوقف تتبع صيغ الدرس."]],
  },
  pluie: {
    tile: "flaques",
    k: 2,
    fr: "Pluie et flaques",
    ar: "مطر وبرك ماء",
    tips: [
      ["Dès les premières gouttes, l'adhérence baisse de moitié : la distance de freinage double.", "مع أولى قطرات المطر ينخفض الالتحام إلى النصف: مسافة الحصر تتضاعف."],
      ["Aquaplaning : le volant devient léger → lève le pied, ne freine pas.", "الانزلاق المائي: المقود يصبح خفيفا ← ارفع القدم ولا تفرمل."],
      ["Feux de croisement obligatoires, double la distance de sécurité.", "أضواء التقابل إجبارية، وضاعف مسافة الأمان."],
    ],
  },
  neige: {
    tile: "neige",
    k: null,
    fr: "Neige et verglas",
    ar: "ثلج وجليد",
    tips: [
      ["Freinage beaucoup plus long : roule bien plus lentement et laisse beaucoup plus d'espace.", "الحصر أطول بكثير: سر ببطء أكبر واترك مسافة أكبر بكثير."],
      ["Si tu glisses : pas de frein, utilise le frein moteur.", "إذا انزلقت: لا تضغط على الفرامل، استعمل حصار المحرك."],
      ["Aucun coup de volant ni freinage brusque.", "لا تحريك مفاجئ للمقود ولا حصر مفاجئ."],
    ],
  },
  gravillons: {
    tile: "gravillons",
    k: null,
    fr: "Gravillons",
    ar: "حصى",
    tips: [
      ["Les gravillons font glisser les pneus et sont projetés sur les autres : ralentis.", "الحصى يجعل العجلات تنزلق ويُقذف على الآخرين: خفف السرعة."],
      ["Augmente la distance avec le véhicule de devant.", "زد المسافة مع المركبة التي أمامك."],
    ],
  },
  terre: {
    tile: "terre",
    k: null,
    fr: "Piste en terre",
    ar: "طريق ترابية",
    tips: [
      ["Revêtement meuble : adhérence faible, poussière qui gêne la visibilité.", "طريق غير معبدة: التحام ضعيف وغبار يحجب الرؤية."],
      ["Vitesse réduite, freinages doux, regard loin devant.", "سرعة منخفضة، حصر لطيف، ونظر بعيد إلى الأمام."],
    ],
  },
  eboulement: {
    tile: "eboulement",
    k: null,
    fr: "Chute de pierres",
    ar: "تساقط الأحجار",
    tips: [
      ["Pierres sur la chaussée dans les virages de montagne : ralentis et reste maître de ta vitesse.", "أحجار على القارعة في منعرجات الجبال: خفف وابق متحكما في سرعتك."],
      ["Ne t'arrête pas dans la zone signalée, sauf nécessité.", "لا تتوقف في المنطقة المشار إليها إلا للضرورة."],
    ],
  },
};

const SPEEDS = [40, 60, 80, 100] as const;

export default function EtatRoute() {
  const { lang, t } = useLang();
  const [surface, setSurface] = useState<Surface>("pluie");
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(60);
  const [run, setRun] = useState(0);
  const [go, setGo] = useState<string | null>(null);
  const key = `${surface}-${speed}-${run}`;
  useEffect(() => {
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setGo(key))));
    return () => cancelAnimationFrame(id);
  }, [key]);

  const sf = SURFACES[surface];
  const v = speed / 10;
  const reaction = v * 3;
  const braking = v * v * (sf.k ?? 1);
  // Illustration : sans coefficient dans le cours, on montre un freinage nettement allongé (× 3).
  const drawnBraking = v * v * (sf.k ?? 3);
  const total = reaction + drawnBraking;
  // Échelle : la plus longue distance possible (100 km/h, × 3) tient dans le cadre.
  const scale = 250 / (10 * 3 + 100 * 3);
  const startY = 290;
  const stopY = startY - total * scale;
  const reactY = startY - reaction * scale;
  const moving = go === key;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(Object.keys(SURFACES) as Surface[]).map((id) => (
          <button
            key={id}
            onClick={() => setSurface(id)}
            className={`overflow-hidden rounded-[14px] border-2 text-start transition-transform active:translate-y-0.5 ${surface === id ? "border-[#d92b2b] shadow-[0_3px_0_#a81c1c]" : "border-line shadow-[0_3px_0_var(--c-grey-300)]"}`}
          >
            <img src={asset(`/tiles/${SURFACES[id].tile}.webp`)} alt="" className="h-14 w-full object-cover" />
            <span className="block px-2 py-1 text-[12px] font-[800] leading-tight">{lang === "ar" ? SURFACES[id].ar : SURFACES[id].fr}</span>
          </button>
        ))}
      </div>
      <Toggle options={SPEEDS.map((s) => ({ id: String(s), label: `${s} km/h` }))} value={String(speed)} onChange={(x) => setSpeed(Number(x) as (typeof SPEEDS)[number])} />

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
        <svg key={key} viewBox="0 0 300 320" className="w-full overflow-hidden rounded-[20px] border-2 border-line bg-[#3a414c]" direction="ltr">
          <image href={asset(`/tiles/${sf.tile}.webp`)} x={0} y={0} width={300} height={320} preserveAspectRatio="xMidYMid slice" />
          {/* Zone de réaction (jaune) puis de freinage (rouge), révélées pendant que la voiture avance */}
          <rect
            x={186}
            width={16}
            y={reactY}
            height={startY - reactY}
            rx={4}
            fill="#f5b041"
            opacity={0.85}
            style={{ transformOrigin: `0 ${startY}px`, transform: `scaleY(${moving ? 1 : 0})`, transition: `transform ${(reaction / total) * 2.4}s linear` }}
          />
          <rect
            x={186}
            width={16}
            y={stopY}
            height={reactY - stopY}
            rx={4}
            fill="#e74c3c"
            opacity={0.85}
            style={{
              transformOrigin: `0 ${reactY}px`,
              transform: `scaleY(${moving ? 1 : 0})`,
              transition: `transform ${(drawnBraking / total) * 2.4}s cubic-bezier(0.2, 0.7, 0.4, 1) ${(reaction / total) * 2.4}s`,
            }}
          />
          <g
            style={{
              transform: `translate(150px, ${moving ? stopY : startY}px)`,
              transition: "transform 2.4s cubic-bezier(0.25, 0.6, 0.4, 1)",
            }}
          >
            <ellipse cx={0} cy={2} rx={14} ry={26} fill="#000" opacity={0.25} />
            <image href={vehicleSrc("autoecole")} x={-14} y={-28} width={28} height={56} preserveAspectRatio="xMidYMid meet" />
          </g>
          <line x1={120} x2={230} y1={startY} y2={startY} stroke="#fff" strokeWidth={2} strokeDasharray="5 4" />
          <text x={236} y={startY + 4} fontSize={10} fontWeight={800} fill="#fff">
            {t("Danger !", "خطر !")}
          </text>
        </svg>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label={t("Réaction", "رد الفعل")} value={`${reaction.toFixed(0)} m`} tone="accent" />
            <Stat label={t("Freinage", "الحصر")} value={sf.k ? `${braking.toFixed(0)} m` : t("bien plus", "أطول بكثير")} tone="ko" />
            <Stat label={t("Arrêt", "التوقف")} value={sf.k ? `${(reaction + braking).toFixed(0)} m` : `> ${(reaction + v * v * 2).toFixed(0)} m`} />
          </div>
          {!sf.k && (
            <p className="text-[13px] font-[600] text-muted">
              {t(
                "Le cours ne donne pas de chiffre pour ce revêtement : le schéma montre seulement que le freinage s'allonge beaucoup (au moins autant que sous la pluie).",
                "الدرس لا يعطي رقما لهذا النوع من الطرق: الرسم يبين فقط أن الحصر يطول كثيرا (على الأقل مثل المطر).",
              )}
            </p>
          )}
          <ul className="space-y-2">
            {sf.tips.map(([fr, ar], i) => (
              <li key={i} className="rounded-[14px] border-2 border-line bg-white p-3 text-[14px] font-[600]">
                {lang === "ar" ? ar : fr}
              </li>
            ))}
          </ul>
          <button className="btn btn-primary !py-2 text-sm" onClick={() => setRun((n) => n + 1)}>
            <Play className="size-4" /> {t("Freiner encore", "افرمل مرة أخرى")}
          </button>
        </div>
      </div>
      <Tip>
        {t(
          "Règle d'or par mauvais temps : ralentis, éloigne-toi, pas de geste brusque. Sous la pluie, la distance de freinage est multipliée par 2.",
          "القاعدة الذهبية في الطقس السيئ: خفف، ابتعد، ولا حركات مفاجئة. في المطر، مسافة الحصر تتضاعف.",
        )}
      </Tip>
    </div>
  );
}
