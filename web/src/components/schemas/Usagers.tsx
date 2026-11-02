"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Tip, vehicleSrc, type Vehicle } from "./ui";

/**
 * Usagers de la route (cours « Véhicules prioritaires et lents » + « Autres usagers ») :
 * un véhicule arrive, gyrophare allumé ou non → faut-il lui céder le passage ?
 */
type Kind = "prio" | "lent" | "fragile" | "normal";
interface User {
  v: Vehicle;
  kind: Kind;
  fr: string;
  ar: string;
}

const USERS: User[] = [
  { v: "ambulance", kind: "prio", fr: "Ambulance", ar: "سيارة الإسعاف" },
  { v: "pompiers", kind: "prio", fr: "Protection civile (pompiers)", ar: "الوقاية المدنية" },
  { v: "police", kind: "prio", fr: "Sûreté nationale (police)", ar: "الأمن الوطني" },
  { v: "moto-police", kind: "prio", fr: "Moto de police", ar: "دراجة الأمن الوطني" },
  { v: "gendarmerie", kind: "prio", fr: "Gendarmerie royale", ar: "الدرك الملكي" },
  { v: "benne-ordures", kind: "lent", fr: "Camion de collecte des ordures", ar: "شاحنة جمع النفايات" },
  { v: "tracteur", kind: "lent", fr: "Tracteur agricole", ar: "جرار فلاحي" },
  { v: "rouleau", kind: "lent", fr: "Engin d'entretien des routes", ar: "آلية صيانة الطرق" },
  { v: "bulldozer", kind: "lent", fr: "Engin de chantier", ar: "آلية الأشغال" },
  { v: "charrette", kind: "fragile", fr: "Charrette (traction animale)", ar: "عربة مجرورة بحيوان" },
  { v: "velo", kind: "fragile", fr: "Cycliste", ar: "راكب الدراجة الهوائية" },
  { v: "triporteur", kind: "fragile", fr: "Triporteur", ar: "دراجة ثلاثية العجلات" },
  { v: "moto-chargee", kind: "fragile", fr: "Deux-roues chargé", ar: "دراجة نارية محملة" },
  { v: "petit-taxi", kind: "normal", fr: "Petit taxi", ar: "سيارة أجرة صغيرة" },
  { v: "grand-taxi", kind: "normal", fr: "Grand taxi", ar: "سيارة أجرة كبيرة" },
  { v: "bus", kind: "normal", fr: "Bus", ar: "حافلة" },
  { v: "citerne", kind: "normal", fr: "Camion-citerne", ar: "شاحنة صهريج" },
  { v: "camion-moutons", kind: "normal", fr: "Camion de bétail", ar: "شاحنة نقل المواشي" },
];

const KIND: Record<Kind, { c: string; fr: string; ar: string; rule: [string, string] }> = {
  prio: {
    c: "#e74c3c",
    fr: "Véhicule prioritaire",
    ar: "مركبة ذات أولوية",
    rule: [
      "Prioritaire SEULEMENT avec gyrophare ou sirène : serre à droite et laisse-le passer. Sans signal, c'est un véhicule ordinaire.",
      "ذات أولوية فقط مع الضوء الدوار أو المنبه الخاص: التزم أقصى اليمين وافسح لها الطريق. بدون إشارة، هي مركبة عادية.",
    ],
  },
  lent: {
    c: "#f39c12",
    fr: "Véhicule lent",
    ar: "مركبة بطيئة",
    rule: [
      "Ne dépasse pas 60 km/h, interdit sur autoroute. Adapte ta vitesse, sois patient, dépasse prudemment si la signalisation le permet.",
      "لا تتجاوز 60 كلم/س، وممنوعة في الطريق السيار. لاءم سرعتك، كن صبورا، وتجاوزها بحذر إذا سمح التشوير.",
    ],
  },
  fragile: {
    c: "#2980b9",
    fr: "Usager vulnérable",
    ar: "مستعمل هش",
    rule: [
      "Pas de priorité particulière, mais très vulnérable et lent : ralentis, garde une large distance latérale pour le dépasser.",
      "ليست له أسبقية خاصة، لكنه هش وبطيء: خفف السرعة واترك مسافة جانبية كبيرة عند تجاوزه.",
    ],
  },
  normal: {
    c: "#198754",
    fr: "Usager ordinaire",
    ar: "مستعمل عادي",
    rule: ["Les règles de priorité habituelles s'appliquent.", "تُطبَّق قواعد الأسبقية العادية."],
  },
};

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function Usagers() {
  const { lang, t } = useLang();
  const [deck, setDeck] = useState<{ u: User; beacon: boolean }[]>([]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    // Tirage au hasard après le montage (évite un écart entre rendu serveur et navigateur).
    const id = requestAnimationFrame(() => setDeck(shuffle(USERS).map((u) => ({ u, beacon: u.kind === "prio" ? Math.random() < 0.65 : false }))));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setArrived(true))));
    return () => cancelAnimationFrame(id);
  }, [i, deck]);
  const cur = deck[i];
  const mustYield = !!cur && cur.u.kind === "prio" && cur.beacon;
  const ok = answer !== null && answer === mustYield;
  const k = cur ? KIND[cur.u.kind] : null;
  const byKind = useMemo(() => (["prio", "lent", "fragile"] as Kind[]).map((kd) => ({ kd, list: USERS.filter((u) => u.kind === kd) })), []);

  const choose = (yieldIt: boolean) => {
    if (answer !== null || !cur) return;
    setAnswer(yieldIt);
    if (yieldIt === mustYield) setScore((s) => s + 1);
  };
  const next = () => {
    setAnswer(null);
    setArrived(false);
    setI((n) => (n + 1) % deck.length);
  };

  return (
    <div className="space-y-5">
      {cur && k && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-[800] text-muted">
            <span>
              {t("Véhicule", "المركبة")} {i + 1} / {deck.length}
            </span>
            <span>
              {t("Score", "النتيجة")} : {score}
            </span>
          </div>
          <svg key={i} viewBox="0 0 400 200" className="w-full overflow-hidden rounded-[20px] border-2 border-line bg-[#3a414c]" direction="ltr">
            <image href={asset("/tiles/route-4-voies.webp")} x={0} y={0} width={400} height={200} preserveAspectRatio="xMidYMid slice" />
            {/* Ma voiture, à droite de la chaussée */}
            <g transform="translate(300 150) rotate(-90)">
              <image href={vehicleSrc("autoecole")} x={-13} y={-26} width={26} height={52} preserveAspectRatio="xMidYMid meet" />
            </g>
            {/* Le véhicule qui arrive derrière moi */}
            <g style={{ transform: `translate(${arrived ? 150 : -80}px, 150px) rotate(90deg)`, transition: "transform 1.6s cubic-bezier(0.2, 0.7, 0.3, 1)" }}>
              <ellipse cx={0} cy={2} rx={14} ry={26} fill="#000" opacity={0.25} />
              <image href={vehicleSrc(cur.u.v)} x={-16} y={-32} width={32} height={64} preserveAspectRatio="xMidYMid meet" />
              {cur.beacon && (
                <>
                  <circle cx={-6} cy={-4} r={6} className="schema-beacon-red" />
                  <circle cx={6} cy={-4} r={6} className="schema-beacon-blue" />
                </>
              )}
            </g>
            <text x={300} y={118} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
              {t("Moi", "أنا")}
            </text>
          </svg>
          <p className="text-[17px] font-[800]">
            {lang === "ar" ? cur.u.ar : cur.u.fr} {cur.beacon ? t("· gyrophare et sirène allumés", "· الضوء الدوار والمنبه مشغلان") : t("· sans signal", "· بدون إشارة")}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button disabled={answer !== null} onClick={() => choose(true)} className={`btn ${answer === true ? (ok ? "!bg-ok text-white" : "!bg-ko text-white") : "btn-ghost"}`}>
              {t("Je lui cède le passage", "أفسح له الطريق")}
            </button>
            <button disabled={answer !== null} onClick={() => choose(false)} className={`btn ${answer === false ? (ok ? "!bg-ok text-white" : "!bg-ko text-white") : "btn-ghost"}`}>
              {t("Règles normales", "القواعد العادية")}
            </button>
          </div>
          {answer !== null && (
            <div className="animate-pop rounded-[16px] border-2 p-4" style={{ borderColor: k.c }}>
              <p className="font-[800]" style={{ color: k.c }}>
                {ok ? t("Exact !", "صحيح !") : t("Pas tout à fait…", "ليس تماما…")} · {lang === "ar" ? k.ar : k.fr}
              </p>
              <p className="mt-1 text-[14px] font-[600]">{lang === "ar" ? k.rule[1] : k.rule[0]}</p>
              <button className="btn btn-primary mt-3 !py-2 text-sm" onClick={next}>
                {t("Véhicule suivant", "المركبة الموالية")} <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {byKind.map(({ kd, list }) => (
          <section key={kd} className="rounded-[16px] border-2 border-line bg-white p-3">
            <p className="mb-2 text-[14px] font-[800]" style={{ color: KIND[kd].c }}>
              {lang === "ar" ? KIND[kd].ar : KIND[kd].fr}
            </p>
            <ul className="grid grid-cols-3 gap-2">
              {list.map((u) => (
                <li key={u.v} className="text-center">
                  <img src={vehicleSrc(u.v)} alt="" className="mx-auto h-14 w-auto" />
                  <span className="mt-1 block text-[11px] font-[700] leading-tight text-muted">{lang === "ar" ? u.ar : u.fr}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Tip>
        {t(
          "Une ambulance ou une voiture de police sans gyrophare ni sirène est un véhicule ordinaire. Interdit de suivre une ambulance pour profiter du passage.",
          "سيارة الإسعاف أو الشرطة بدون ضوء دوار ولا منبه مركبة عادية. ممنوع أن تتبع سيارة إسعاف للاستفادة من الطريق المفتوحة.",
        )}
      </Tip>
    </div>
  );
}
