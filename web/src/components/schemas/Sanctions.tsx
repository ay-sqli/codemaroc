"use client";

import { useState } from "react";
import { useLang, type TFn } from "@/lib/i18n";
import { Slider, Stat, Tip, Toggle } from "./ui";

/** Échelle des excès de vitesse + barème des amendes transactionnelles (ATF) selon le délai. */
function overspeed(x: number, t: TFn) {
  if (x <= 0) return { cls: t("Aucune", "لا شيء"), fine: "—", pts: 0, extra: t("Vitesse respectée", "السرعة محترمة"), tone: "ok" as const };
  if (x < 20)
    return {
      cls: t("3ᵉ classe", "الصنف 3"),
      fine: t("300 à 600 DH", "300 إلى 600 درهم"),
      pts: 0,
      extra: t("Moins de 20 km/h de trop : 0 point retiré", "أقل من 20 كلم/س زيادة: لا تُسحب أي نقطة"),
      tone: "brand" as const,
    };
  if (x === 20)
    return {
      cls: t("2ᵉ classe", "الصنف 2"),
      fine: t("500 à 1 000 DH", "500 إلى 1000 درهم"),
      pts: 0,
      extra: t("Exactement +20 : 2ᵉ classe, 0 point", "بالضبط + 20: الصنف 2، بدون سحب نقط"),
      tone: "accent" as const,
    };
  if (x < 30)
    return {
      cls: t("2ᵉ classe", "الصنف 2"),
      fine: t("500 à 1 000 DH", "500 إلى 1000 درهم"),
      pts: 2,
      extra: t("Plus de 20 et moins de 30 : −2 points", "أكثر من 20 وأقل من 30: ناقص نقطتين"),
      tone: "accent" as const,
    };
  if (x === 30)
    return {
      cls: t("1ʳᵉ classe", "الصنف 1"),
      fine: t("700 à 1 400 DH", "700 إلى 1400 درهم"),
      pts: 2,
      extra: t("Exactement +30 : 1ʳᵉ classe, −2 points", "بالضبط + 30: الصنف 1، ناقص نقطتين"),
      tone: "ko" as const,
    };
  if (x < 50)
    return {
      cls: t("1ʳᵉ classe", "الصنف 1"),
      fine: t("700 à 1 400 DH", "700 إلى 1400 درهم"),
      pts: 4,
      extra: t("Plus de 30 et moins de 50 : −4 points", "أكثر من 30 وأقل من 50: ناقص 4 نقط"),
      tone: "ko" as const,
    };
  return {
    cls: t("DÉLIT (tribunal)", "جنحة (المحكمة)"),
    fine: t("4 000 à 8 000 DH", "4000 إلى 8000 درهم"),
    pts: 6,
    extra: t("−6 points + suspension du permis 1 à 3 mois", "ناقص 6 نقط + توقيف الرخصة من شهر إلى 3 أشهر"),
    tone: "ko" as const,
  };
}

const DELAY = [
  { id: "0", label: "Payée sur place / le jour même", labelAr: "الأداء في عين المكان / في نفس اليوم", v: [400, 300, 150, 25] },
  { id: "15", label: "Sous 15 jours", labelAr: "داخل 15 يوما", v: [500, 350, 200, 25] },
  { id: "30", label: "Sous 30 jours", labelAr: "داخل 30 يوما", v: [700, 500, 300, 25] },
] as const;

const POINTS: [number, string, string][] = [
  [6, "Excès ≥ 50 km/h · alcool / drogue · délit de fuite", "تجاوز السرعة بـ 50 كلم/س أو أكثر · الكحول / المخدرات · الفرار بعد حادثة"],
  [4, "Feu rouge / STOP · sens interdit · dépassement dangereux · excès +30 à +50", "الضوء الأحمر / قف · الاتجاه الممنوع · التجاوز الخطير · تجاوز السرعة من 30 إلى 50"],
  [
    3,
    "Sans contrôle technique · de nuit sans éclairage · bande d'arrêt d'urgence · marche arrière/demi-tour sur autoroute (délit)",
    "بدون فحص تقني · ليلا بدون إنارة · شريط التوقف الاستعجالي · الرجوع إلى الخلف / الدوران في الطريق السيار (جنحة)",
  ],
  [2, "Refus de priorité · excès +20 à +30 · moto sans casque", "عدم احترام الأسبقية · تجاوز السرعة من 20 إلى 30 · دراجة نارية بدون خوذة"],
  [1, "Ceinture · enfant < 10 ans à l'avant · téléphone tenu en main", "حزام السلامة · طفل أقل من 10 سنوات في الأمام · الهاتف باليد"],
];

export default function Sanctions() {
  const { lang, t } = useLang();
  const [x, setX] = useState(25);
  const [delay, setDelay] = useState<"0" | "15" | "30">("0");
  const r = overspeed(x, t);
  const d = DELAY.find((k) => k.id === delay)!;
  const dh = t("DH", "درهم");
  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
        <p className="font-black">{t("L'échelle de l'excès de vitesse", "سلّم تجاوز السرعة")}</p>
        <Slider label={t("Dépassement de la limite", "تجاوز الحد")} value={x} min={0} max={70} step={5} unit={t("km/h de trop", "كلم/س زيادة")} onChange={setX} />
        <div className="flex h-3 overflow-hidden rounded-full">
          <span className="w-[28%] bg-sky-500" />
          <span className="w-[14%] bg-amber-500" />
          <span className="w-[29%] bg-orange-600" />
          <span className="flex-1 bg-red-700" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t("Classe", "الصنف")} value={r.cls} tone={r.tone} />
          <Stat label={t("Amende", "الغرامة")} value={r.fine} tone={r.tone} />
          <Stat label={t("Points", "النقط")} value={r.pts ? `−${r.pts}` : "0"} tone={r.tone} />
        </div>
        <p className="text-center text-sm font-bold">{r.extra}</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
        <p className="font-black">{t("Combien je paie ? (amende transactionnelle)", "كم سأؤدي؟ (الغرامة التصالحية)")}</p>
        <Toggle options={DELAY.map((k) => ({ id: k.id, label: lang === "ar" ? k.labelAr : k.label }))} value={delay} onChange={setDelay} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            t("1ʳᵉ classe", "الصنف 1"),
            t("2ᵉ classe", "الصنف 2"),
            t("3ᵉ classe", "الصنف 3"),
            t("4ᵉ classe (piétons)", "الصنف 4 (الراجلون)"),
          ].map((c, i) => (
            <Stat key={c} label={c} value={`${d.v[i]} ${dh}`} tone={i === 0 ? "ko" : i === 1 ? "accent" : "brand"} />
          ))}
        </div>
        <p className="text-xs text-muted">
          {t(
            "Fourchettes légales : 1ʳᵉ 700–1 400 · 2ᵉ 500–1 000 · 3ᵉ 300–600 · 4ᵉ 20–50 DH. Payer = reconnaître l'infraction et accepter le retrait des points.",
            "الحدود القانونية: الصنف 1: 700 – 1400 · الصنف 2: 500 – 1000 · الصنف 3: 300 – 600 · الصنف 4: 20 – 50 درهم. الأداء = الاعتراف بالمخالفة وقبول سحب النقط.",
          )}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-black">{t("Les points qui tombent le plus souvent", "النقط التي تُسحب في أغلب الأحيان")}</p>
        {POINTS.map(([p, fr, ar]) => (
          <div key={p} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 ring-1 ring-line">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ko text-lg font-black text-white" dir="ltr">
              −{p}
            </span>
            <span className="text-sm font-semibold">{lang === "ar" ? ar : fr}</span>
          </div>
        ))}
      </div>
      <Tip>
        {t(
          "Moyen mnémotechnique « 20-30-50 » : sous +20 rien à perdre (0 pt), +20 → 2 pts, +30 → 4 pts, +50 → 6 pts et délit. Chaque palier = +2 points.",
          "حيلة « 20 - 30 - 50 »: أقل من + 20 لا تخسر شيئا (0 نقطة)، + 20 ← نقطتان، + 30 ← 4 نقط، + 50 ← 6 نقط وجنحة. كل درجة = نقطتان إضافيتان.",
        )}
      </Tip>
    </div>
  );
}
