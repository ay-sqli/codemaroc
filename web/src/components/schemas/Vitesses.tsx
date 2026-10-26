"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Stat, Tip, Toggle } from "./ui";

const ROWS = [
  { id: "voiture", label: "Voiture ≤ 3,5 t / moto", labelAr: "سيارة ≤ 3,5 طن / دراجة نارية", v: [60, 100, 120] },
  { id: "taxi", label: "Taxi", labelAr: "سيارة أجرة", v: [60, 90, 120] },
  { id: "bus", label: "Transport de personnes 3,5–10 t", labelAr: "نقل الأشخاص 3,5 – 10 طن", v: [60, 90, 100] },
  { id: "pl12", label: "Marchandises 3,5–12 t", labelAr: "نقل البضائع 3,5 – 12 طن", v: [60, 90, 100] },
  { id: "pl19", label: "Marchandises 12–19 t", labelAr: "نقل البضائع 12 – 19 طن", v: [60, 80, 90] },
  { id: "pl", label: "Marchandises > 19 t", labelAr: "نقل البضائع > 19 طن", v: [60, 70, 80] },
  { id: "cyclo", label: "Cyclomoteur", labelAr: "دراجة نارية صغيرة", v: [40, 60, 0] },
] as const;

const ROADS: [string, string][] = [
  ["En agglomération", "داخل التجمعات العمرانية"],
  ["Hors agglomération", "خارج التجمعات العمرانية"],
  ["Autoroute", "الطريق السيار"],
];

export default function Vitesses() {
  const { lang, t } = useLang();
  const [veh, setVeh] = useState<(typeof ROWS)[number]["id"]>("voiture");
  const [road, setRoad] = useState<"0" | "1" | "2">("1");
  const [prob, setProb] = useState<"non" | "oui">("non");
  const row = ROWS.find((r) => r.id === veh)!;
  let limit: number = row.v[Number(road)];
  if (prob === "oui" && limit > 90) limit = 90;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {ROWS.map((r) => (
          <button
            key={r.id}
            onClick={() => setVeh(r.id)}
            className={`rounded-xl px-3 py-2 text-start text-sm font-bold ring-1 transition ${veh === r.id ? "bg-brand text-white ring-brand" : "bg-surface-2 ring-line hover:ring-brand"}`}
          >
            {lang === "ar" ? r.labelAr : r.label}
          </button>
        ))}
      </div>
      <Toggle options={ROADS.map((l, i) => ({ id: String(i) as "0" | "1" | "2", label: lang === "ar" ? l[1] : l[0] }))} value={road} onChange={setRoad} />
      <Toggle
        options={[
          { id: "non", label: t("Permis confirmé", "رخصة نهائية") },
          { id: "oui", label: t("Période probatoire (2 ans)", "الفترة الاختبارية (سنتان)") },
        ]}
        value={prob}
        onChange={setProb}
      />

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 p-6 ring-1 ring-line">
        {limit ? (
          <div className="grid size-36 place-items-center rounded-full border-[14px] border-red-600 bg-white text-5xl font-black text-black shadow-xl">{limit}</div>
        ) : (
          <div className="text-center text-lg font-black text-ko">{t("Interdit sur autoroute", "ممنوع على الطريق السيار")}</div>
        )}
        {prob === "oui" && row.v[Number(road)] > 90 && (
          <p className="text-sm font-bold text-accent">
            {t(
              `Limité à 90 km/h en période probatoire (au lieu de ${row.v[Number(road)]})`,
              `محددة في 90 كلم/س خلال الفترة الاختبارية (بدل ${row.v[Number(road)]})`,
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("Agglomération", "داخل المدينة")} value={`${row.v[0]}`} />
        <Stat label={t("Hors agglo.", "خارج المدينة")} value={`${row.v[1]}`} />
        <Stat label={t("Autoroute", "الطريق السيار")} value={row.v[2] ? `${row.v[2]}` : "—"} />
      </div>
      <Tip>
        {t(
          "Retiens « 60 – 100 – 120 » pour la voiture. Débutant = 90 maximum partout. Autoroute : minimum 60 km/h. Groupe de piétons, engins agricoles : 30 km/h. Véhicule de plus de 2,60 m de large : 60 km/h.",
          "احفظ « 60 – 100 – 120 » بالنسبة للسيارة. السائق المبتدئ = 90 كحد أقصى في كل مكان. الطريق السيار: 60 كلم/س كحد أدنى. مجموعة من الراجلين أو الآليات الفلاحية: 30 كلم/س. مركبة يفوق عرضها 2,60 م: 60 كلم/س.",
        )}
      </Tip>
    </div>
  );
}
