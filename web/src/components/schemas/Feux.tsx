"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Tip } from "./ui";

type Light = "veilleuses" | "croisement" | "route" | "brouillardAv" | "brouillardAr" | "warning";

const LIGHTS: Record<Light, { ar: string; fr: string; d: string; color: string }> = {
  veilleuses: { ar: "أضواء الوضع", fr: "Veilleuses (position)", d: "visibles à 150 m", color: "#fde68a" },
  croisement: { ar: "أضواء التقابل", fr: "Feux de croisement", d: "éclairent ≥ 30 m", color: "#fef9c3" },
  route: { ar: "أضواء الطريق", fr: "Feux de route", d: "éclairent ≥ 100 m", color: "#ffffff" },
  brouillardAv: { ar: "أضواء الضباب الأمامية", fr: "Antibrouillard avant", d: "jaune ou blanc", color: "#facc15" },
  brouillardAr: { ar: "ضوء الضباب الخلفي", fr: "Antibrouillard arrière", d: "rouge", color: "#ef4444" },
  warning: { ar: "أضواء الإغاثة", fr: "Feux de détresse", d: "tous les clignotants", color: "#fb923c" },
};

const SITUATIONS: { id: string; label: string; labelAr: string; on: Light[]; why: string; whyAr: string }[] = [
  {
    id: "ville",
    label: "Nuit, en ville bien éclairée",
    labelAr: "ليلا، داخل مدينة جيدة الإنارة",
    on: ["veilleuses"],
    why: "En agglomération suffisamment éclairée, les feux de position suffisent (ou le croisement).",
    whyAr: "داخل التجمعات العمرانية المضاءة بما فيه الكفاية، تكفي أضواء الوضع (أو أضواء التقابل).",
  },
  {
    id: "horsville",
    label: "Nuit, route non éclairée, personne en face",
    labelAr: "ليلا، طريق غير مضاءة، ولا أحد في الاتجاه المقابل",
    on: ["route"],
    why: "Feux de route pour voir loin (≥ 100 m)… à condition de ne gêner personne.",
    whyAr: "أضواء الطريق للرؤية بعيدا (100 م أو أكثر)… بشرط ألا تزعج أحدا.",
  },
  {
    id: "croise",
    label: "Nuit, une voiture arrive en face",
    labelAr: "ليلا، سيارة قادمة من الاتجاه المقابل",
    on: ["croisement"],
    why: "On passe en feux de croisement « à distance suffisante » pour ne pas éblouir l'autre conducteur.",
    whyAr: "ننتقل إلى أضواء التقابل « على مسافة كافية » حتى لا نبهر السائق الآخر.",
  },
  {
    id: "suivre",
    label: "Nuit, je suis une voiture de près",
    labelAr: "ليلا، أسير خلف سيارة عن قرب",
    on: ["croisement"],
    why: "Derrière un véhicule proche : croisement. On peut faire de brefs appels (route/croisement) pour annoncer un dépassement.",
    whyAr: "خلف مركبة قريبة: أضواء التقابل. يمكن القيام بإشارات ضوئية قصيرة (طريق/تقابل) للإعلان عن التجاوز.",
  },
  {
    id: "pluie",
    label: "Jour, forte pluie",
    labelAr: "نهارا، أمطار غزيرة",
    on: ["croisement", "brouillardAv"],
    why: "Pluie : croisement obligatoire ; si pluie forte, on peut y ajouter (ou les remplacer par) les antibrouillards avant.",
    whyAr: "المطر: أضواء التقابل إجبارية؛ وإذا كان المطر غزيرا، يمكن إضافة أضواء الضباب الأمامية (أو تعويضها بها).",
  },
  {
    id: "brouillard",
    label: "Brouillard épais",
    labelAr: "ضباب كثيف",
    on: ["croisement", "brouillardAv", "brouillardAr"],
    why: "Brouillard : croisement + antibrouillards. L'antibrouillard arrière seulement par brouillard, neige ou forte pluie (sinon il éblouit).",
    whyAr: "الضباب: أضواء التقابل + أضواء الضباب. ضوء الضباب الخلفي فقط في حالة الضباب أو الثلج أو المطر الغزير (وإلا فإنه يبهر).",
  },
  {
    id: "tunnel",
    label: "Entrée dans un tunnel",
    labelAr: "الدخول إلى نفق",
    on: ["croisement"],
    why: "Le panneau d'entrée de tunnel impose les feux de croisement (et interdit demi-tour, arrêt et stationnement).",
    whyAr: "علامة مدخل النفق تفرض أضواء التقابل (وتمنع الدوران والوقوف والتوقف).",
  },
  {
    id: "panne",
    label: "Bouchon soudain / panne sur autoroute",
    labelAr: "ازدحام مفاجئ / عطب على الطريق السيار",
    on: ["warning"],
    why: "Feux de détresse pour avertir ceux qui arrivent derrière (dernier véhicule d'une file arrêtée, panne, vitesse anormalement lente).",
    whyAr: "أضواء الإغاثة لتنبيه القادمين من الخلف (آخر مركبة في صف متوقف، عطب، سرعة بطيئة بشكل غير عادي).",
  },
  {
    id: "arret",
    label: "Véhicule arrêté la nuit",
    labelAr: "مركبة متوقفة ليلا",
    on: ["veilleuses"],
    why: "À l'arrêt, les feux de route doivent être éteints ; les feux de position signalent le véhicule.",
    whyAr: "عند التوقف، يجب إطفاء أضواء الطريق؛ وأضواء الوضع تُشير إلى وجود المركبة.",
  },
];

export default function Feux() {
  const { lang, t } = useLang();
  const [s, setS] = useState(SITUATIONS[0].id);
  const sit = SITUATIONS.find((x) => x.id === s)!;
  const on = (l: Light) => sit.on.includes(l);
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {SITUATIONS.map((x) => (
          <button
            key={x.id}
            onClick={() => setS(x.id)}
            className={`rounded-xl px-3 py-2 text-start text-sm font-bold ring-1 ${s === x.id ? "bg-brand text-white ring-brand" : "bg-surface-2 ring-line hover:ring-brand"}`}
          >
            {lang === "ar" ? x.labelAr : x.label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 400 170" className="w-full rounded-2xl bg-slate-900">
        {on("route") && <polygon points="250,70 400,20 400,140" fill="#fff" opacity={0.35} />}
        {on("croisement") && <polygon points="250,78 340,60 340,120" fill="#fef9c3" opacity={0.45} />}
        {on("brouillardAv") && <polygon points="250,100 330,95 330,130" fill="#facc15" opacity={0.45} />}
        <rect x={60} y={55} width={190} height={60} rx={18} fill="#2563eb" />
        <rect x={110} y={40} width={90} height={30} rx={10} fill="#1e40af" />
        <circle cx={100} cy={118} r={14} fill="#111" />
        <circle cx={210} cy={118} r={14} fill="#111" />
        <circle cx={246} cy={78} r={7} fill={on("route") || on("croisement") ? "#fff" : "#475569"} />
        <circle cx={246} cy={96} r={5} fill={on("veilleuses") || on("croisement") || on("route") ? "#fde68a" : "#475569"} />
        <circle cx={246} cy={108} r={5} fill={on("brouillardAv") ? "#facc15" : "#475569"} />
        <circle cx={64} cy={80} r={6} fill={on("veilleuses") || on("croisement") || on("route") ? "#dc2626" : "#475569"} />
        <circle cx={64} cy={98} r={5} fill={on("brouillardAr") ? "#ef4444" : "#475569"} />
        {on("brouillardAr") && <polygon points="58,98 0,85 0,112" fill="#ef4444" opacity={0.35} />}
        {on("warning") && (
          <>
            <circle cx={246} cy={66} r={6} fill="#fb923c" className="animate-pulse" />
            <circle cx={64} cy={66} r={6} fill="#fb923c" className="animate-pulse" />
          </>
        )}
      </svg>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LIGHTS) as Light[]).map((l) => (
          <span key={l} className={`chip ring-1 ${on(l) ? "bg-ok/15 text-ok ring-ok/40" : "bg-surface-2 text-muted ring-line opacity-60"}`}>
            {on(l) ? "✓" : "✗"}{" "}
            {lang === "ar" ? LIGHTS[l].ar : LIGHTS[l].fr}
          </span>
        ))}
      </div>
      <p className="rounded-2xl bg-surface-2 p-3 text-sm font-semibold ring-1 ring-line">{lang === "ar" ? sit.whyAr : sit.why}</p>
      <Tip>
        {t(
          "Distances : position 150 m (être vu) · croisement 30 m · route 100 m (voir loin). Brouillard / pluie le jour : croisement, jamais les veilleuses seules.",
          "المسافات: أضواء الوضع 150 م (لكي تُرى) · أضواء التقابل 30 م · أضواء الطريق 100 م (لترى بعيدا). الضباب / المطر نهارا: أضواء التقابل، وليس أضواء الوضع وحدها أبدا.",
        )}
      </Tip>
    </div>
  );
}
