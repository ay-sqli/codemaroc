"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { Tip, Toggle, vehicleSrc, type Vehicle } from "./ui";

/**
 * Autoroute : (1) insertion par la voie d'accélération, (2) passage au péage.
 * Pas de voiture d'auto-école ici : les cours de conduite sont interdits sur autoroute.
 * Chiffres du cours : 120 km/h (motos, voitures ≤ 3,5 t, taxis), 100 (marchandises 3,5–12 t,
 * transport en commun > 3,5 t), 90 (12–19 t), 80 (> 19 t) ; vitesse minimale 60 km/h.
 */

/** Tuile tournée de 180° : la chaussée du bas roule vers la droite, la bretelle arrive par la gauche. */
const MERGE = "M -60 540 C 40 530, 110 470, 180 400 L 300 392 C 360 388, 380 330, 460 325 L 720 325";
const TRUCK = "M -120 325 L 760 325";
const ONCOMING = "M 760 132 L -120 132";

function Mover({ path, v, dur, begin = 0, size = 34, points }: { path: string; v: Vehicle; dur: number; begin?: number; size?: number; points?: string }) {
  return (
    <g>
      <animateMotion
        dur={`${dur}s`}
        begin={`${begin}s`}
        repeatCount="indefinite"
        rotate="auto"
        path={path}
        {...(points ? { keyPoints: points, keyTimes: "0;0.45;1", calcMode: "linear" } : {})}
      />
      <g transform="rotate(90)">
        <image href={vehicleSrc(v)} x={-size / 2} y={-size} width={size} height={size * 2} preserveAspectRatio="xMidYMid meet" />
      </g>
    </g>
  );
}

const BANNED: { v: Vehicle; fr: string; ar: string }[] = [
  { v: "velo", fr: "Vélos", ar: "الدراجات" },
  { v: "scooter", fr: "Cyclomoteurs", ar: "الدراجات بمحرك" },
  { v: "triporteur", fr: "Tri et quadricycles", ar: "ثلاثية ورباعية العجلات" },
  { v: "charrette", fr: "Traction animale", ar: "المجرورة بالدواب" },
  { v: "tracteur", fr: "Tracteurs agricoles", ar: "الجرارات الفلاحية" },
  { v: "bulldozer", fr: "Engins de travaux", ar: "معدات الأشغال" },
  { v: "autoecole", fr: "Cours de conduite", ar: "دروس السياقة" },
];

const LIMITS: [string, string, string][] = [
  ["120", "Motos, voitures ≤ 3,5 t, taxis", "الدراجات النارية، السيارات ≤ 3.5 طن، سيارات الأجرة"],
  ["100", "Marchandises 3,5–12 t, transport en commun > 3,5 t", "البضائع 3.5–12 طن، النقل الجماعي > 3.5 طن"],
  ["90", "Marchandises 12–19 t", "البضائع 12–19 طن"],
  ["80", "Marchandises > 19 t", "البضائع > 19 طن"],
];

function Peage() {
  const { t } = useLang();
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const timers = [0, 2.4, 3.6, 4.6].map((s, i) => setTimeout(() => setStep(i), s * 1000 + 60));
    return () => timers.forEach(clearTimeout);
  }, [run]);
  const carY = step < 0 ? 680 : step < 3 ? 372 : -120;
  const open = step >= 2;
  return (
    <div className="space-y-3">
      <svg key={run} viewBox="0 0 640 600" className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[20px] border-2 border-line bg-[#eadfc6]" direction="ltr">
        <image href={asset("/tiles/peage-barrieres.webp")} x={0} y={0} width={640} height={600} />
        {/* Barrière de droite redessinée pour pouvoir s'ouvrir */}
        <rect x={376} y={258} width={136} height={20} fill="#434a55" />
        <rect x={486} y={258} width={7} height={20} fill="#f5b041" />
        <g style={{ transform: `translate(512px, 268px) rotate(${open ? 80 : 0}deg)`, transition: "transform 0.9s ease-in-out" }}>
          <rect x={-136} y={-8} width={136} height={16} rx={8} fill="#fff" stroke="#1e2328" strokeWidth={3} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-126 + i * 32} y={-6} width={16} height={12} fill="#e74c3c" />
          ))}
        </g>
        <g style={{ transform: `translate(440px, ${carY}px)`, transition: step < 0 ? "none" : step < 3 ? "transform 2.2s cubic-bezier(0.2, 0.7, 0.3, 1)" : "transform 2s ease-in" }}>
          <ellipse cx={0} cy={4} rx={26} ry={48} fill="#000" opacity={0.2} />
          <image href={vehicleSrc("voiture-bleue")} x={-26} y={-52} width={52} height={104} preserveAspectRatio="xMidYMid meet" />
        </g>
        {step === 1 && (
          <g transform="translate(470 330)">
            <rect x={-6} y={-30} width={150} height={40} rx={12} fill="#fff" stroke="#1e2328" strokeWidth={3} />
            <text x={69} y={-4} textAnchor="middle" fontSize={20} fontWeight={800} fill="#1e2328">
              {t("Je paie", "أؤدي")}
            </text>
          </g>
        )}
      </svg>
      <button
        className="btn btn-primary !py-2 text-sm"
        onClick={() => {
          setStep(-1);
          setRun((n) => n + 1);
        }}
      >
        <Play className="size-4" /> {t("Rejouer", "أعد")}
      </button>
    </div>
  );
}

export default function Autoroute() {
  const { lang, t } = useLang();
  const [tab, setTab] = useState<"entree" | "peage">("entree");
  return (
    <div className="space-y-4">
      <Toggle
        options={[
          { id: "entree", label: t("Entrer sur l'autoroute", "الدخول إلى الطريق السيار") },
          { id: "peage", label: t("Le péage", "محطة الأداء") },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,360px)_1fr]">
        {tab === "entree" ? (
          <svg viewBox="0 0 640 607" className="w-full overflow-hidden rounded-[20px] border-2 border-line bg-[#eadfc6]" direction="ltr">
            <image href={asset("/tiles/insertion.webp")} x={0} y={0} width={640} height={607} transform="rotate(180 320 303.5)" />
            {/* Chaussée d'en face (vers la gauche) */}
            <Mover path={ONCOMING} v="grand-taxi" dur={5} begin={0.5} />
            <Mover path={ONCOMING} v="autocar" dur={6} begin={3} size={38} />
            {/* Camion sur la voie de droite, puis moi qui m'insère derrière lui */}
            <Mover path={TRUCK} v="camion" dur={8} begin={0} size={44} />
            <Mover path={MERGE} v="voiture-bleue" dur={8} begin={0} points="0;0.42;1" />
          </svg>
        ) : (
          <Peage />
        )}
        <div className="space-y-3">
          {tab === "entree" ? (
            <ul className="space-y-2 text-[14px] font-[600]">
              {[
                ["Sur la voie d'accélération, atteins la vitesse des véhicules de l'autoroute.", "في مسلك التسريع، اِبلغ سرعة المركبات في الطريق السيار."],
                ["Clignotant, et cède le passage aux véhicules déjà sur l'autoroute : ne les force pas à freiner.", "شغّل المؤشر وأعط الأسبقية للمركبات الموجودة في الطريق السيار: لا تجبرها على الفرملة."],
                ["Roule toujours sur la voie de droite ; les autres voies servent à dépasser.", "سر دائما في المسلك الأيمن؛ المسالك الأخرى للتجاوز فقط."],
                ["Interdits : demi-tour, marche arrière, rouler sur la bande d'arrêt d'urgence.", "ممنوع: نصف الدورة، الرجوع إلى الخلف، السير على شريط التوقف العاجل."],
              ].map(([fr, ar]) => (
                <li key={fr} className="rounded-[14px] border-2 border-line bg-white p-3">
                  {lang === "ar" ? ar : fr}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2 text-[14px] font-[600]">
              {[
                ["Un panneau annonce à l'avance l'endroit où retirer le ticket.", "علامة تعلن مسبقا عن مكان سحب تذكرة الأداء."],
                ["Ralentis, choisis ta voie, arrête-toi à la barrière et attends qu'elle se lève.", "خفف السرعة، اختر مسلكك، توقف عند الحاجز وانتظر حتى يرتفع."],
                ["Repars doucement : d'autres véhicules sortent des voies voisines.", "انطلق بهدوء: مركبات أخرى تخرج من المسالك المجاورة."],
              ].map(([fr, ar]) => (
                <li key={fr} className="rounded-[14px] border-2 border-line bg-white p-3">
                  {lang === "ar" ? ar : fr}
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-[16px] border-2 border-line bg-white p-3">
            <p className="mb-2 text-[14px] font-[800]">{t("Vitesses maximales", "السرعات القصوى")}</p>
            <ul className="space-y-1.5">
              {LIMITS.map(([v, fr, ar]) => (
                <li key={v} className="flex items-center gap-3 text-[13px] font-[600]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border-[5px] border-[#e74c3c] bg-white font-[900] text-[#1e2328]">{v}</span>
                  {lang === "ar" ? ar : fr}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] font-[800] text-[#2980b9]">{t("Vitesse minimale : 60 km/h", "السرعة الدنيا: 60 كلم/س")}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[16px] border-2 border-line bg-white p-3">
        <p className="mb-2 text-[14px] font-[800] text-[#e74c3c]">{t("Interdits sur l'autoroute", "ممنوعون من الطريق السيار")}</p>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {BANNED.map((b) => (
            <li key={b.v} className="text-center">
              <span className="relative mx-auto block w-fit">
                <img src={vehicleSrc(b.v)} alt="" className="h-14 w-auto" />
                <span className="absolute inset-0 m-auto h-[3px] w-[130%] -translate-x-[12%] rotate-[-35deg] self-center rounded bg-[#e74c3c]" style={{ top: "50%" }} />
              </span>
              <span className="mt-1 block text-[11px] font-[700] leading-tight text-muted">{lang === "ar" ? b.ar : b.fr}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] font-[600] text-muted">
          {t("Aussi : piétons, animaux, véhicules non immatriculés ou incapables de dépasser 60 km/h.", "وأيضا: الراجلون، الحيوانات، والمركبات غير المسجلة أو التي لا تستطيع تجاوز 60 كلم/س.")}
        </p>
      </div>
      <Tip>
        {t(
          "Insertion réussie = vitesse prise sur la voie d'accélération + clignotant + priorité aux véhicules déjà sur l'autoroute.",
          "اندماج ناجح = سرعة كافية في مسلك التسريع + المؤشر + الأسبقية للمركبات الموجودة في الطريق السيار.",
        )}
      </Tip>
    </div>
  );
}
