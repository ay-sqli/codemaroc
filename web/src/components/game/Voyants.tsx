"use client";

import { asset } from "@/lib/base";
import { useLang } from "@/lib/i18n";
import { cx } from "@/components/ui";

/**
 * Voyants du tableau de bord (public/voyants). La couleur dit l'urgence :
 * rouge = arrêt / danger, orange = anomalie à faire vérifier, vert ou bleu = simple information.
 */
type Tone = "red" | "orange" | "info";
interface Voyant {
  id: string;
  tone: Tone;
  fr: string;
  ar: string;
  dfr: string;
  dar: string;
  lights?: boolean;
}

export const VOYANTS: Voyant[] = [
  { id: "huile", tone: "red", fr: "Pression d'huile", ar: "ضغط الزيت", dfr: "Pression d'huile insuffisante : arrête-toi vite et coupe le moteur.", dar: "ضغط الزيت غير كاف: توقف بسرعة وأطفئ المحرك." },
  { id: "temperature", tone: "red", fr: "Température moteur", ar: "حرارة المحرك", dfr: "Liquide de refroidissement trop chaud : arrête-toi, le moteur surchauffe.", dar: "سائل التبريد ساخن جدا: توقف، المحرك يسخن أكثر من اللازم." },
  { id: "frein", tone: "red", fr: "Freinage", ar: "الفرامل", dfr: "Frein de stationnement serré ou niveau de liquide de frein trop bas.", dar: "فرامل الوقوف مشدودة أو مستوى سائل الفرامل منخفض." },
  { id: "batterie", tone: "red", fr: "Charge batterie", ar: "شحن البطارية", dfr: "La batterie ne se recharge plus (alternateur, courroie) : fais vérifier.", dar: "البطارية لم تعد تُشحن (المولد، الحزام): يجب الفحص." },
  { id: "airbag", tone: "red", fr: "Airbag", ar: "الوسادة الهوائية", dfr: "Défaut d'airbag : il risque de ne pas se déclencher en cas de choc.", dar: "خلل في الوسادة الهوائية: قد لا تنفتح عند الاصطدام." },
  { id: "ceinture", tone: "red", fr: "Ceinture", ar: "حزام السلامة", dfr: "Une ceinture n'est pas bouclée.", dar: "حزام سلامة غير مربوط." },
  { id: "moteur", tone: "orange", fr: "Moteur / antipollution", ar: "المحرك / مكافحة التلوث", dfr: "Anomalie du moteur ou du système antipollution : à faire contrôler.", dar: "خلل في المحرك أو نظام مكافحة التلوث: يجب المراقبة." },
  { id: "abs", tone: "orange", fr: "ABS", ar: "ABS", dfr: "ABS hors service : tu freines encore, mais les roues peuvent se bloquer.", dar: "نظام ABS معطل: الفرامل تعمل، لكن العجلات قد تنغلق." },
  { id: "pneus", tone: "orange", fr: "Pression des pneus", ar: "ضغط العجلات", dfr: "Un pneu est sous-gonflé : vérifie la pression.", dar: "عجلة ناقصة الضغط: تحقق من الضغط." },
  { id: "carburant", tone: "orange", fr: "Réserve de carburant", ar: "احتياطي الوقود", dfr: "Tu roules sur la réserve : fais le plein.", dar: "تسير بالاحتياطي: املأ الخزان." },
  { id: "prechauffage", tone: "orange", fr: "Préchauffage (diesel)", ar: "التسخين المسبق (ديزل)", dfr: "Attends qu'il s'éteigne avant de démarrer un moteur diesel.", dar: "انتظر انطفاءه قبل تشغيل محرك الديزل." },
  { id: "detresse", tone: "red", fr: "Feux de détresse", ar: "أضواء الخطر", dfr: "Les quatre clignotants sont allumés : arrêt d'urgence ou danger.", dar: "الأضواء الأربعة مشتعلة: توقف اضطراري أو خطر.", lights: true },
  { id: "feux-route", tone: "info", fr: "Feux de route", ar: "أضواء الطريق", dfr: "Pleins phares (bleu) : à couper dès que tu croises ou suis un véhicule.", dar: "الأضواء الكاشفة (أزرق): أطفئها عند التقابل أو التتبع.", lights: true },
  { id: "feux-croisement", tone: "info", fr: "Feux de croisement", ar: "أضواء التقاطع", dfr: "Codes allumés (vert) : la nuit, en ville, ou quand tu croises.", dar: "الأضواء المنخفضة مشتعلة (أخضر): ليلا، في المدينة، أو عند التقابل.", lights: true },
  { id: "feux-position", tone: "info", fr: "Feux de position", ar: "أضواء الوضعية", dfr: "Veilleuses allumées (vert) : pour être vu, à l'arrêt ou au crépuscule.", dar: "أضواء الوضعية مشتعلة (أخضر): للظهور، عند التوقف أو عند الغسق.", lights: true },
];

/** Chapitres où le cours express affiche les voyants (tous, ou seulement ceux des feux). */
export const VOYANT_UNITS: Record<string, "all" | "lights"> = {
  "02_elements_mecaniques": "all",
  "03_aides_conduite": "all",
  "14_conditions_eclairage": "lights",
  "15_panne_accident": "lights",
};

const TONE: Record<Tone, { ring: string; fr: string; ar: string }> = {
  red: { ring: "#e74c3c", fr: "Rouge : arrêt", ar: "أحمر: توقف" },
  orange: { ring: "#f39c12", fr: "Orange : à vérifier", ar: "برتقالي: يجب الفحص" },
  info: { ring: "#2980b9", fr: "Vert / bleu : information", ar: "أخضر / أزرق: معلومة" },
};

export function Voyants({ only }: { only?: "all" | "lights" }) {
  const { lang, t } = useLang();
  const list = only === "lights" ? VOYANTS.filter((v) => v.lights) : VOYANTS;
  return (
    <section className="mt-8">
      <h2 className="duo-h mb-1 text-xl">{t("Les voyants du tableau de bord", "أضواء لوحة القيادة")}</h2>
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-[700]">
        {(Object.keys(TONE) as Tone[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5" style={{ color: TONE[k].ring }}>
            <span className="size-2.5 rounded-full" style={{ background: TONE[k].ring }} /> {lang === "ar" ? TONE[k].ar : TONE[k].fr}
          </span>
        ))}
      </p>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {list.map((v) => (
          <li key={v.id} className="duo-card flex items-center gap-3 !rounded-[18px] p-3" style={{ borderInlineStartColor: TONE[v.tone].ring, borderInlineStartWidth: 5 }}>
            <img src={asset(`/voyants/${v.id}.webp`)} alt="" className="size-14 shrink-0 rounded-[12px] bg-[var(--duo-snow)] object-cover" />
            <span className="min-w-0">
              <span className={cx("block text-[15px] font-[800] text-[var(--duo-ink)]")}>{lang === "ar" ? v.ar : v.fr}</span>
              <span className="block text-[13px] font-[500] leading-snug text-[var(--duo-muted)]">{lang === "ar" ? v.dar : v.dfr}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
