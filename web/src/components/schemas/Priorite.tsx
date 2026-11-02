"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Car, Tip } from "./ui";

type Pos = "me" | "right" | "left" | "front";

interface Scenario {
  title: string;
  titleAr: string;
  /** Panneau / signal pour moi (en bas), et pour les autres. */
  mine: "none" | "stop" | "cedez" | "prio" | "agent";
  others: { pos: Exclude<Pos, "me">; sign?: "stop" | "cedez"; special?: "ambulance"; turn?: "left" | "straight" }[];
  myTurn?: "left" | "straight" | "right";
  order: Pos[];
  why: string;
  whyAr: string;
}

const SCENARIOS: Scenario[] = [
  {
    title: "Aucun panneau, une voiture arrive à ma droite",
    titleAr: "لا توجد أي علامة، وسيارة قادمة من يميني",
    mine: "none",
    others: [{ pos: "right" }],
    order: ["right", "me"],
    why: "Sans signalisation, la règle générale s'applique : priorité à droite (الأسبقية للقادم من اليمين). La voiture de droite passe d'abord.",
    whyAr: "في غياب التشوير، تُطبَّق القاعدة العامة: الأسبقية للقادم من اليمين. السيارة التي على اليمين تمر أولا.",
  },
  {
    title: "Aucun panneau, une voiture arrive à ma gauche",
    titleAr: "لا توجد أي علامة، وسيارة قادمة من يساري",
    mine: "none",
    others: [{ pos: "left" }],
    order: ["me", "left"],
    why: "Je suis à la droite de cette voiture : c'est elle qui doit me céder le passage. Je passe en premier, prudemment.",
    whyAr: "أنا على يمين هذه السيارة: هي التي يجب أن تفسح لي المجال. أمر أولا، بحذر.",
  },
  {
    title: "J'ai un STOP, une voiture arrive à ma gauche",
    titleAr: "أمامي علامة قف، وسيارة قادمة من يساري",
    mine: "stop",
    others: [{ pos: "left" }],
    order: ["left", "me"],
    why: "STOP (قف) = arrêt complet obligatoire à la limite de la chaussée, puis je cède le passage à droite ET à gauche. La voiture de gauche passe d'abord.",
    whyAr: "علامة قف = وقوف تام إجباري عند حافة الطريق، ثم أفسح المجال لليمين ولليسار معا. السيارة التي على اليسار تمر أولا.",
  },
  {
    title: "Je suis sur une route prioritaire (losange jaune), une voiture à droite a un « cédez le passage »",
    titleAr: "أسير على طريق ذات أولوية (المعين الأصفر)، وسيارة على اليمين أمامها علامة « فسح المجال »",
    mine: "prio",
    others: [{ pos: "right", sign: "cedez" }],
    order: ["me", "right"],
    why: "Le losange jaune (الطابع الأولوي) me donne la priorité à toutes les intersections jusqu'au panneau de fin. La voiture de droite doit me céder le passage.",
    whyAr: "المعين الأصفر (الطابع الأولوي) يمنحني الأسبقية في جميع ملتقيات الطرق إلى غاية علامة النهاية. السيارة التي على اليمين يجب أن تفسح لي المجال.",
  },
  {
    title: "J'ai « cédez le passage », des voitures à gauche et à droite",
    titleAr: "أمامي علامة « فسح المجال »، وسيارات على اليسار وعلى اليمين",
    mine: "cedez",
    others: [{ pos: "left" }, { pos: "right" }],
    order: ["left", "right", "me"],
    why: "Cédez le passage (أترك الأسبقية) : je laisse passer TOUTES les voitures de la route que je croise (gauche et droite), sans obligation de m'arrêter si c'est libre. Je passe en dernier.",
    whyAr: "فسح المجال (أترك الأسبقية): أترك جميع السيارات التي تسير على الطريق التي أقطعها تمر (من اليسار واليمين)، دون إلزامية التوقف إذا كانت الطريق فارغة. أمر في الأخير.",
  },
  {
    title: "Aucun panneau : je tourne à gauche, une voiture arrive en face tout droit",
    titleAr: "لا توجد أي علامة: أنعطف نحو اليسار، وسيارة قادمة من الأمام تسير مستقيمة",
    mine: "none",
    myTurn: "left",
    others: [{ pos: "front", turn: "straight" }],
    order: ["front", "me"],
    why: "Pour tourner à gauche, je dois céder le passage aux véhicules venant en sens inverse (المركبات القادمة من الاتجاه المعاكس). La voiture d'en face passe d'abord.",
    whyAr: "للانعطاف نحو اليسار، يجب أن أفسح المجال للمركبات القادمة من الاتجاه المعاكس. السيارة المقابلة تمر أولا.",
  },
  {
    title: "J'ai la priorité, mais une ambulance arrive à gauche avec gyrophare et sirène",
    titleAr: "لي الأسبقية، لكن سيارة إسعاف قادمة من اليسار بالضوء الدوار والمنبه الصوتي",
    mine: "prio",
    others: [{ pos: "left", special: "ambulance" }],
    order: ["left", "me"],
    why: "Un véhicule prioritaire qui utilise son gyrophare ou sa sirène passe toujours en premier, quels que soient les panneaux. Sans gyrophare ni sirène, ce serait un véhicule ordinaire.",
    whyAr: "المركبة ذات الأولوية التي تستعمل ضوءها الدوار أو منبهها الصوتي تمر دائما أولا، مهما كانت العلامات. بدون ضوء دوار ولا منبه، تُعتبر مركبة عادية.",
  },
  {
    title: "Mon feu est vert, mais l'agent me fait signe de m'arrêter (bras tendus)",
    titleAr: "الضوء أخضر بالنسبة لي، لكن عون المرور يشير إلي بالتوقف (ذراعان ممدودتان)",
    mine: "agent",
    others: [{ pos: "right" }],
    order: ["right", "me"],
    why: "Hiérarchie : Agent > Feux > Panneaux > Règles. Les gestes de l'agent l'emportent sur le feu vert : je m'arrête, la voiture de droite passe.",
    whyAr: "التسلسل: عون المرور > الأضواء > العلامات > القواعد. إشارات العون مقدَّمة على الضوء الأخضر: أتوقف، والسيارة التي على اليمين تمر.",
  },
  {
    title: "Une voiture à ma droite a un STOP, moi aucun panneau",
    titleAr: "سيارة على يميني أمامها علامة قف، وأنا بدون أي علامة",
    mine: "none",
    others: [{ pos: "right", sign: "stop" }],
    order: ["me", "right"],
    why: "Le STOP s'adresse à la voiture de droite : elle doit s'arrêter et me laisser passer, même si elle vient de ma droite. La signalisation prime sur la règle de priorité à droite.",
    whyAr: "علامة قف موجهة للسيارة التي على اليمين: يجب أن تتوقف وتتركني أمر، حتى لو كانت قادمة من يميني. التشوير مقدَّم على قاعدة الأسبقية لليمين.",
  },
];

const POS: Record<Pos, { x: number; y: number; rot: number }> = {
  me: { x: 170, y: 262, rot: 0 },
  right: { x: 262, y: 130, rot: -90 },
  left: { x: 38, y: 170, rot: 90 },
  front: { x: 130, y: 38, rot: 180 },
};

/** Où va chaque véhicule une fois son tour venu (il traverse le carrefour puis sort du cadre). */
const EXIT: Record<Pos, { x: number; y: number; rot: number }> = {
  me: { x: 170, y: -70, rot: 0 },
  right: { x: -70, y: 130, rot: -90 },
  left: { x: 370, y: 170, rot: 90 },
  front: { x: 130, y: 370, rot: 180 },
};
const EXIT_LEFT_TURN = { x: -70, y: 130, rot: -90 };

const COLORS: Record<Pos, string> = { me: "#ff7a00", right: "#2563eb", left: "#7c3aed", front: "#059669" };
const NAMES: Record<Pos, [string, string]> = {
  me: ["Moi", "أنا"],
  right: ["Droite", "اليمين"],
  left: ["Gauche", "اليسار"],
  front: ["En face", "المقابل"],
};

function SignIcon({ kind, x, y }: { kind: string; x: number; y: number }) {
  if (kind === "stop")
    return (
      <g transform={`translate(${x} ${y})`}>
        <polygon points="-9,-22 9,-22 22,-9 22,9 9,22 -9,22 -22,9 -22,-9" fill="#dc2626" stroke="#fff" strokeWidth={2} />
        <text y={4} textAnchor="middle" fontSize={10} fontWeight={900} fill="#fff">
          STOP
        </text>
      </g>
    );
  if (kind === "cedez")
    return (
      <g transform={`translate(${x} ${y})`}>
        <polygon points="-20,-14 20,-14 0,20" fill="#fff" stroke="#dc2626" strokeWidth={5} strokeLinejoin="round" />
      </g>
    );
  if (kind === "prio")
    return (
      <g transform={`translate(${x} ${y}) rotate(45)`}>
        <rect x={-14} y={-14} width={28} height={28} fill="#fff" stroke="#111" strokeWidth={1} />
        <rect x={-9} y={-9} width={18} height={18} fill="#facc15" />
      </g>
    );
  if (kind === "agent")
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={16} fill="#0056d2" stroke="#fff" strokeWidth={2} />
        <text y={4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff">
          AGENT
        </text>
      </g>
    );
  return null;
}

export default function Priorite() {
  const { lang, t } = useLang();
  const [k, setK] = useState(0);
  const [pick, setPick] = useState<Pos | null>(null);
  // Animation : après la réponse, les véhicules passent un par un dans l'ordre de priorité.
  const [play, setPlay] = useState(0);
  const [go, setGo] = useState<string | null>(null);
  const run = `${k}-${play}-${pick}`;
  useEffect(() => {
    if (!pick) return;
    // Deux images plus tard : les véhicules sont affichés à leur place, puis partent (transition CSS).
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setGo(run))));
    return () => cancelAnimationFrame(id);
  }, [pick, run]);
  const s = SCENARIOS[k];
  const present: Pos[] = ["me", ...s.others.map((o) => o.pos)];
  const done = pick !== null;
  const ok = pick === s.order[0];
  const name = (p: Pos) => (lang === "ar" ? NAMES[p][1] : NAMES[p][0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-muted">
          {t("Situation", "الوضعية")} {k + 1} / {SCENARIOS.length}
        </p>
        <div className="flex gap-1">
          {SCENARIOS.map((_, j) => (
            <span key={j} className={`h-1.5 w-5 rounded-full ${j === k ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
      </div>
      <h4 className="text-lg font-black">{lang === "ar" ? s.titleAr : s.title}</h4>
      <p className="text-sm font-semibold text-muted">{t("Qui passe en premier ? Clique sur la voiture.", "من يمر أولا؟ انقر على السيارة.")}</p>

      <svg key={`${k}-${play}`} viewBox="0 0 300 300" className="mx-auto w-full max-w-sm overflow-hidden rounded-[20px] border-2 border-line bg-[#eadfc6]" direction="ltr">
        <image href={asset("/tiles/carrefour.webp")} x={-6} y={-6} width={312} height={312} preserveAspectRatio="none" />
        {s.mine !== "none" && <SignIcon kind={s.mine} x={228} y={240} />}
        {s.others.map(
          (o) =>
            o.sign && (
              <SignIcon
                key={o.pos}
                kind={o.sign}
                x={o.pos === "right" ? 240 : o.pos === "left" ? 60 : 72}
                y={o.pos === "right" ? 72 : o.pos === "left" ? 228 : 60}
              />
            ),
        )}
        {s.myTurn === "left" && <path d="M170 225 Q170 165 115 160" fill="none" stroke="#ff7a00" strokeWidth={4} markerEnd="url(#arr)" strokeDasharray="6 4" />}
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#ff7a00" />
          </marker>
        </defs>
        {present.map((p) => {
          const o = s.others.find((x) => x.pos === p);
          const rank = done ? s.order.indexOf(p) + 1 : 0;
          return (
            <g key={p} onClick={() => !done && setPick(p)} className={done ? "" : "cursor-pointer"}>
              <Car
                {...POS[p]}
                color={o?.special === "ambulance" ? "#f8fafc" : COLORS[p]}
                label={p === "me" ? name("me") : undefined}
                beacon={o?.special === "ambulance"}
                to={done && go === run ? (p === "me" && s.myTurn === "left" ? EXIT_LEFT_TURN : EXIT[p]) : null}
                delay={done ? 0.6 + (rank - 1) * 1.5 : 0}
              />
              {done && (
                <g transform={`translate(${POS[p].x + 20} ${POS[p].y - 22})`}>
                  <circle r={12} fill={rank === 1 ? "#059669" : "#0f172a"} />
                  <text y={4} textAnchor="middle" fontSize={12} fontWeight={900} fill="#fff">
                    {rank}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-2">
        {present.map((p) => (
          <button
            key={p}
            disabled={done}
            onClick={() => setPick(p)}
            className={`btn !py-2 text-sm ${done && p === s.order[0] ? "bg-ok text-white" : done && p === pick ? "bg-ko text-white" : "btn-ghost"}`}
          >
            <i className="size-3 rounded-full" style={{ background: COLORS[p] }} /> {name(p)}
          </button>
        ))}
      </div>

      {done && (
        <div className={`animate-pop rounded-2xl border-2 p-4 ${ok ? "border-ok/40 bg-ok/5" : "border-ko/40 bg-ko/5"}`}>
          <p className="font-black">
            {ok ? t("Exact !", "صحيح!") : t(`Non : c'est « ${name(s.order[0])} » qui passe d'abord.`, `لا: « ${name(s.order[0])} » هو الذي يمر أولا.`)}
          </p>
          <p className="mt-1 text-sm leading-relaxed">{lang === "ar" ? s.whyAr : s.why}</p>
          <p className="mt-2 text-xs font-bold text-muted">
            {t("Ordre :", "الترتيب:")} {s.order.map(name).join(lang === "ar" ? " ← " : " → ")}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex gap-2">
          <button className="btn btn-ghost !py-2 text-sm" onClick={() => setPick(null)}>
            <RotateCcw className="size-4" /> {t("Recommencer", "إعادة")}
          </button>
          {done && (
            <button className="btn btn-ghost !py-2 text-sm" onClick={() => setPlay((n) => n + 1)}>
              <Play className="size-4" /> {t("Revoir le passage", "أعد المشهد")}
            </button>
          )}
        </div>
        <button
          className="btn btn-primary !py-2 text-sm"
          onClick={() => {
            setK((k + 1) % SCENARIOS.length);
            setPick(null);
          }}
        >
          {t("Situation suivante", "الوضعية الموالية")} <ArrowRight className="size-4" />
        </button>
      </div>
      <Tip>
        {t(
          "Ordre de décision : 1) agent 2) feux 3) panneaux (STOP, cédez, losange) 4) règle de la priorité à droite. Un véhicule prioritaire avec gyrophare passe toujours.",
          "ترتيب القرار: 1) عون المرور 2) الأضواء 3) العلامات (قف، فسح المجال، المعين) 4) قاعدة الأسبقية لليمين. المركبة ذات الأولوية بضوئها الدوار تمر دائما.",
        )}
      </Tip>
    </div>
  );
}
