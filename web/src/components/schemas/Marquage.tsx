"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Tip, vehicleSrc } from "./ui";

const LINES = [
  {
    id: "continue",
    ar: "خط متصل",
    fr: "Ligne continue",
    cross: false,
    d: "Interdit de la franchir ou chevaucher : pas de dépassement, pas de demi-tour.",
    dAr: "يُمنع تجاوزه أو السير فوقه: لا تجاوز ولا دوران.",
    dash: "",
    double: false,
  },
  {
    id: "discontinue",
    ar: "خط متقطع متباعد",
    fr: "Ligne discontinue",
    cross: true,
    d: "On peut la franchir pour dépasser ou changer de voie (si c'est sans danger).",
    dAr: "يمكن تجاوزه من أجل التجاوز أو تغيير الممر (إذا لم يكن في ذلك خطر).",
    dash: "30 100",
    double: false,
  },
  {
    id: "annonce",
    ar: "خط متقطع متقارب",
    fr: "Ligne d'annonce",
    cross: true,
    d: "Traits rapprochés : une ligne continue approche. Termine ton dépassement, n'en commence pas.",
    dAr: "خطوط متقاربة: خط متصل يقترب. أنهِ تجاوزك ولا تبدأ تجاوزا جديدا.",
    dash: "30 25",
    double: false,
  },
  {
    id: "fleches",
    ar: "خط بأسهم الانحياز",
    fr: "Flèches de rabattement",
    cross: false,
    d: "Flèches de rabattement : ligne continue imminente → rabats-toi à droite, pas de dépassement.",
    dAr: "أسهم الرجوع: خط متصل وشيك ← ارجع إلى اليمين، ولا تجاوز.",
    dash: "30 25",
    double: false,
  },
  {
    id: "mixte",
    ar: "خط مزدوج",
    fr: "Ligne mixte",
    cross: true,
    d: "Regarde la ligne de TON côté : continue de ton côté = interdit ; discontinue de ton côté = autorisé.",
    dAr: "انظر إلى الخط الذي في جهتك: متصل في جهتك = ممنوع؛ متقطع في جهتك = مسموح.",
    dash: "",
    double: true,
  },
] as const;

export default function Marquage() {
  const { lang, t } = useLang();
  const [id, setId] = useState<(typeof LINES)[number]["id"]>("continue");
  const [side, setSide] = useState<1 | 2>(1);
  const l = LINES.find((x) => x.id === id)!;
  const allowed = l.double ? side === 2 : l.cross;
  const low = side === 1 || !l.double;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-5">
        {LINES.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className={`rounded-xl px-2 py-2 text-sm font-bold ring-1 ${id === x.id ? "bg-brand text-white ring-brand" : "bg-surface-2 ring-line"}`}>
            {lang === "ar" ? x.ar : x.fr}
            <span className={`block text-xs opacity-80 ${lang === "ar" ? "" : "ar"}`}>{lang === "ar" ? x.fr : x.ar}</span>
          </button>
        ))}
      </div>
      <svg viewBox="0 0 400 180" className="w-full rounded-2xl bg-slate-700" direction="ltr">
        <rect x={0} y={20} width={400} height={140} fill="#374151" />
        <line x1={0} y1={22} x2={400} y2={22} stroke="#fff" strokeWidth={3} />
        <line x1={0} y1={158} x2={400} y2={158} stroke="#fff" strokeWidth={3} />
        {l.double ? (
          <>
            <line x1={0} y1={86} x2={400} y2={86} stroke="#fff" strokeWidth={4} strokeDasharray="30 25" />
            <line x1={0} y1={94} x2={400} y2={94} stroke="#fff" strokeWidth={4} />
          </>
        ) : (
          <line x1={0} y1={90} x2={400} y2={90} stroke="#fff" strokeWidth={4} strokeDasharray={l.dash} />
        )}
        {l.id === "fleches" && [80, 200, 320].map((x) => <path key={x} d={`M${x} 98 l40 18 l-6 -14 l14 0 z`} fill="#fff" opacity={0.85} />)}
        <text x={20} y={50} fontSize={12} fill="#fff" opacity={0.7}>
          {t("Sens 2 ←", "← الاتجاه 2")}
        </text>
        <text x={20} y={140} fontSize={12} fill="#fff" opacity={0.7}>
          {t("Sens 1 →", "الاتجاه 1 →")}{" "}
          {l.double
            ? side === 1
              ? t("(voie n°1 : côté continu)", "(الممر 1: جهة الخط المتصل)")
              : t("(voie n°2 : côté discontinu)", "(الممر 2: جهة الخط المتقطع)")
            : ""}
        </text>
        <g transform={`translate(160 ${low ? 128 : 52}) rotate(${low ? 90 : -90})`}>
          <image href={vehicleSrc("autoecole")} x={-13} y={-26} width={26} height={52} preserveAspectRatio="xMidYMid meet" />
        </g>
        <path
          d={`M200 ${low ? 128 : 52} C 240 ${low ? 128 : 52}, 250 ${low ? 60 : 128}, 300 ${low ? 60 : 128}`}
          stroke={allowed ? "#22c55e" : "#ef4444"}
          strokeWidth={4}
          fill="none"
          strokeDasharray="8 6"
        />
        <text x={310} y={low ? 64 : 132} fontSize={13} fontWeight={700} fill={allowed ? "#7ee2a8" : "#ff8a8a"}>
          {allowed ? t("AUTORISÉ", "مسموح") : t("INTERDIT", "ممنوع")}
        </text>
      </svg>
      {l.double && (
        <div className="flex gap-2">
          <button onClick={() => setSide(1)} className={`btn flex-1 !py-2 text-sm ${side === 1 ? "btn-primary" : "btn-ghost"}`}>
            {t("Je roule côté ligne continue", "أسير في جهة الخط المتصل")}
          </button>
          <button onClick={() => setSide(2)} className={`btn flex-1 !py-2 text-sm ${side === 2 ? "btn-primary" : "btn-ghost"}`}>
            {t("Je roule côté ligne discontinue", "أسير في جهة الخط المتقطع")}
          </button>
        </div>
      )}
      <p className={`rounded-2xl p-3 text-sm font-bold ${allowed ? "bg-ok/10 text-ok" : "bg-ko/10 text-ko"}`}>
        {allowed ? t("Franchissement autorisé (avec prudence).", "التجاوز مسموح (بحذر).") : t("Franchissement INTERDIT.", "التجاوز ممنوع.")}{" "}
        <span className="font-semibold text-ink">{lang === "ar" ? l.dAr : l.d}</span>
      </p>
      <Tip>
        {t(
          "Plus les traits se rapprochent, plus le danger approche. Couleurs : blanc = normal, jaune = provisoire (travaux) ou arrêt interdit, bleu = zone disque. Longueurs : axe 3 m de trait / 10 m d'espace.",
          "كلما تقاربت الخطوط، اقترب الخطر. الألوان: أبيض = عادي، أصفر = مؤقت (أشغال) أو منع الوقوف، أزرق = منطقة القرص. الأطوال: خط المحور 3 م خط / 10 م فراغ.",
        )}
      </Tip>
    </div>
  );
}
