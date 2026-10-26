"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Car, Tip, Toggle } from "./ui";

/** Différence ممر دائري (sens giratoire, priorité à droite) / ملتقى طرق دوراني (giratoire avec « cédez »). */
export default function Giratoire() {
  const { t } = useLang();
  const [type, setType] = useState<"carrefour" | "passage">("carrefour");
  const [dest, setDest] = useState<"droite" | "face" | "gauche" | "demi">("face");
  const prioInside = type === "carrefour";
  const lane = dest === "droite" || dest === "face" ? "droite" : "gauche";
  const blinkIn =
    dest === "droite"
      ? t("Clignotant droit AVANT d'entrer", "الإشارة الضوئية اليمنى قبل الدخول")
      : dest === "face"
        ? t("Pas de clignotant à l'entrée", "لا إشارة ضوئية عند الدخول")
        : t("Clignotant gauche AVANT d'entrer", "الإشارة الضوئية اليسرى قبل الدخول");

  return (
    <div className="space-y-4">
      <Toggle
        options={[
          { id: "carrefour", label: t("ملتقى طرق دوراني (avec « cédez »)", "ملتقى طرق دوراني (مع علامة « فسح المجال »)") },
          { id: "passage", label: t("ممر دائري (sans panneau)", "ممر دائري (بدون علامة)") },
        ]}
        value={type}
        onChange={setType}
      />
      <div className="grid items-center gap-4 md:grid-cols-[1fr_1.1fr]">
        <svg viewBox="0 0 300 300" className="w-full rounded-2xl bg-emerald-700/80" direction="ltr">
          <rect x={110} y={0} width={80} height={300} fill="#374151" />
          <rect x={0} y={110} width={300} height={80} fill="#374151" />
          <circle cx={150} cy={150} r={88} fill="#374151" />
          <circle cx={150} cy={150} r={40} fill="#16a34a" stroke="#fff" strokeWidth={3} />
          <circle cx={150} cy={150} r={64} fill="none" stroke="#fff" strokeDasharray="8 7" strokeWidth={1.5} opacity={0.6} />
          {/* Sens de rotation : inverse des aiguilles d'une montre */}
          <path d="M 205 95 A 78 78 0 0 0 95 95" fill="none" stroke="#facc15" strokeWidth={3} markerEnd="url(#g)" />
          <defs>
            <marker id="g" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#facc15" />
            </marker>
          </defs>
          {prioInside && (
            <g transform="translate(205 262)">
              <polygon points="-16,-11 16,-11 0,16" fill="#fff" stroke="#dc2626" strokeWidth={4} strokeLinejoin="round" />
            </g>
          )}
          <Car x={170} y={262} label={t("Moi", "أنا")} color="#ff7a00" />
          <Car x={226} y={196} rot={-45} color="#2563eb" />
          <text x={262} y={168} fontSize={12} fontWeight={700} fill="#fff">
            {prioInside ? t("1er", "1") : t("2e", "2")}
          </text>
          <text x={122} y={258} fontSize={12} fontWeight={700} fill="#fff">
            {prioInside ? t("2e", "2") : t("1er", "1")}
          </text>
        </svg>
        <div className="space-y-3">
          <div className={`rounded-2xl p-4 ${prioInside ? "bg-brand/10" : "bg-accent/10"}`}>
            <p className="ar text-lg font-black">{prioInside ? "ملتقى طرق دوراني" : "ممر دائري"}</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed">
              {prioInside
                ? t(
                    "3 panneaux : danger « carrefour giratoire » + « cédez le passage » à chaque entrée + « sens giratoire obligatoire ». → La voiture DANS l'anneau (bleue) a la priorité. Moi, j'attends.",
                    "3 علامات: خطر « ملتقى طرق دوراني » + « فسح المجال » عند كل مدخل + « اتجاه دوراني إجباري ». ← السيارة الموجودة داخل المدار (الزرقاء) لها الأسبقية. أما أنا فأنتظر.",
                  )
                : t(
                    "Aucun « cédez le passage » à l'entrée : la priorité à droite s'applique. → Celui qui VEUT ENTRER (moi) a la priorité ; la voiture dans l'anneau ralentit ou s'arrête.",
                    "لا توجد علامة « فسح المجال » عند المدخل: تُطبَّق الأسبقية لليمين. ← من يريد الدخول (أنا) له الأسبقية؛ والسيارة داخل المدار تخفف السرعة أو تتوقف.",
                  )}
            </p>
          </div>
          <p className="text-sm font-bold">{t("Où vas-tu ?", "إلى أين تتجه ؟")}</p>
          <Toggle
            options={[
              { id: "droite", label: t("↱ Droite", "↱ اليمين") },
              { id: "face", label: t("↑ En face", "↑ إلى الأمام") },
              { id: "gauche", label: t("↰ Gauche", "↰ اليسار") },
              { id: "demi", label: t("↶ Demi-tour", "↶ الدوران") },
            ]}
            value={dest}
            onChange={setDest}
          />
          <ul className="space-y-1.5 text-sm font-semibold">
            <li>
              {t("Voie :", "الممر:")}{" "}
              <b>
                {lane === "droite"
                  ? t("anneau de droite (extérieur)", "الممر الأيمن (الخارجي)")
                  : t("anneau de gauche (intérieur)", "الممر الأيسر (الداخلي)")}
              </b>
            </li>
            <li>{blinkIn}</li>
            <li>{t("Clignotant droit avant de sortir + regard angle mort (deux-roues à droite !)", "الإشارة اليمنى قبل الخروج + النظر إلى الزاوية الميتة (انتبه للدراجات على اليمين!)")}</li>
            <li>{t("Sortie ratée ? On refait un tour : jamais de marche arrière ni de freinage brusque.", "فاتك المخرج؟ قم بدورة أخرى: لا رجوع إلى الخلف ولا فرملة مفاجئة أبدا.")}</li>
          </ul>
        </div>
      </div>
      <Tip>
        {t(
          "Repère : « cédez » à l'entrée = ceux qui sont DEDANS passent. Pas de panneau = priorité à droite, donc ceux qui ENTRENT passent.",
          "قاعدة للتذكر: علامة « فسح المجال » عند المدخل = من هم داخل المدار يمرون. بدون علامة = الأسبقية لليمين، إذن من يدخلون يمرون.",
        )}
      </Tip>
    </div>
  );
}
