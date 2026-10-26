"use client";

import { useState } from "react";
import { Baby, CarFront } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Slider, Stat, Tip, Toggle } from "./ui";

/**
 * Distances selon les formules du cours NARSA :
 *   réaction = (V/10) × 3   ·  sécurité (2 s) = (V/10) × 6
 *   arrêt = (V/10)²         ·  freinage = arrêt − réaction (× 2 sur route mouillée)
 * Pour V < 50 km/h le cours donne un tableau (20→2 m, 30→4 m, 40→8 m de freinage).
 */
function compute(v: number, wet: boolean, tired: boolean) {
  const d = v / 10;
  const reaction = d * 3 * (tired ? 2 : 1);
  let braking = v >= 50 ? d * d - d * 3 : v <= 20 ? 2 * (v / 20) ** 2 : v <= 30 ? 2 + ((v - 20) / 10) * 2 : 4 + ((v - 30) / 10) * 4;
  if (wet) braking *= 2;
  return { reaction: Math.round(reaction), braking: Math.round(braking), stop: Math.round(reaction + braking), safety: Math.round(d * 6) };
}

export default function Distance() {
  const { t } = useLang();
  const [v, setV] = useState(90);
  const [road, setRoad] = useState<"sec" | "mouille">("sec");
  const [driver, setDriver] = useState<"normal" | "fatigue">("normal");
  const r = compute(v, road === "mouille", driver === "fatigue");
  const max = 330;
  const px = (m: number) => `${Math.min(100, (m / max) * 100)}%`;
  const m = t("m", "م");
  const d = v / 10;

  return (
    <div className="space-y-5">
      <Slider label={t("Vitesse", "السرعة")} value={v} min={20} max={130} step={10} unit={t("km/h", "كلم/س")} onChange={setV} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          options={[
            { id: "sec", label: t("Route sèche", "طريق جافة") },
            { id: "mouille", label: t("Route mouillée", "طريق مبللة") },
          ]}
          value={road}
          onChange={setRoad}
        />
        <Toggle
          options={[
            { id: "normal", label: t("Conducteur en forme", "سائق في حالة جيدة") },
            { id: "fatigue", label: t("Fatigué / alcool", "متعب / تحت تأثير الكحول") },
          ]}
          value={driver}
          onChange={setDriver}
        />
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        <div className="relative h-24 overflow-hidden rounded-xl bg-slate-700">
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-white/40" />
          <div className="absolute inset-y-2 start-0 rounded-s-lg bg-amber-400/80 transition-all duration-500" style={{ width: px(r.reaction) }} />
          <div
            className="absolute inset-y-2 rounded-e-lg bg-rose-500/80 transition-all duration-500"
            style={{ insetInlineStart: px(r.reaction), width: px(r.braking) }}
          />
          <span className="absolute top-1/2 -translate-y-1/2 text-3xl transition-all duration-500" style={{ insetInlineStart: `calc(${px(r.stop)} - 18px)` }}>
            <CarFront className="size-8 text-white" />
          </span>
          <span className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-warn-500 text-white">
            <Baby className="size-5" />
          </span>
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-bold text-white/70">
          <span>{t("Je vois le danger", "أرى الخطر")}</span>
          <span>
            0 — {max} {m}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-white">
          <span className="flex items-center gap-1">
            <i className="size-3 rounded bg-amber-400" /> {t("Réaction : je n'ai pas encore freiné", "رد الفعل: لم أضغط على الفرامل بعد")}
          </span>
          <span className="flex items-center gap-1">
            <i className="size-3 rounded bg-rose-500" /> {t("Freinage", "الفرملة")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label={t("Réaction (V/10 × 3)", "رد الفعل (س/10 × 3)")}
          value={`${r.reaction} ${m}`}
          tone="accent"
          sub={driver === "fatigue" ? t("temps ×2", "الزمن × 2") : t("≈ 1 seconde", "≈ ثانية واحدة")}
        />
        <Stat
          label={t("Freinage", "الفرملة")}
          value={`${r.braking} ${m}`}
          tone="ko"
          sub={road === "mouille" ? t("× 2 sur mouillé", "× 2 على طريق مبللة") : t("arrêt − réaction", "التوقف − رد الفعل")}
        />
        <Stat label={t("Arrêt total (V/10)²", "التوقف الكلي (س/10)²")} value={`${r.stop} ${m}`} tone="brand" />
        <Stat label={t("Sécurité 2 s (V/10 × 6)", "الأمان ثانيتان (س/10 × 6)")} value={`${r.safety} ${m}`} tone="ok" sub={t("avec le véhicule devant", "مع المركبة التي أمامك")} />
      </div>

      <Tip>
        {t(
          `Astuce de calcul : prends le chiffre des dizaines (${d}). × 3 = réaction (${d * 3} m), × 6 = sécurité (${d * 6} m), × lui-même = arrêt (${d ** 2} m). Doubler la vitesse ≈ quadrupler la distance d'arrêt.`,
          `حيلة الحساب: خذ رقم العشرات (${d}). × 3 = رد الفعل (${d * 3} م)، × 6 = الأمان (${d * 6} م)، مضروبا في نفسه = التوقف (${d ** 2} م). مضاعفة السرعة ≈ مضاعفة مسافة التوقف 4 مرات.`,
        )}
      </Tip>
    </div>
  );
}
