"use client";

import { useState } from "react";
import { BookOpen, CircleDot, Hand, Signpost, type LucideIcon } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Slider, Stat, Tip, Toggle } from "./ui";

/** Paire [français, arabe]. */
type FA = [string, string];

/* ------------------------------------------------------------------ Alcool */
export function Alcool() {
  const { t } = useLang();
  const [mode, setMode] = useState<"sang" | "air">("sang");
  const [v, setV] = useState(0.3);
  const blood = mode === "sang" ? v : v * 2;
  const air = mode === "air" ? v : v / 2;
  const over = blood >= 0.2;
  return (
    <div className="space-y-4">
      <Toggle
        options={[
          { id: "sang", label: t("Mesure dans le sang (g/l)", "القياس في الدم (غ/ل)") },
          { id: "air", label: t("Éthylotest – air expiré (mg/l)", "جهاز قياس الكحول – الهواء المنبعث (ملغ/ل)") },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Slider
        label={t("Taux mesuré", "النسبة المقاسة")}
        value={v}
        min={0}
        max={mode === "sang" ? 1.2 : 0.6}
        step={0.05}
        unit={mode === "sang" ? t("g/l de sang", "غ/ل من الدم") : t("mg/l d'air", "ملغ/ل من الهواء")}
        onChange={(x) => setV(Math.round(x * 100) / 100)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("Équivalent sang", "ما يعادله في الدم")} value={`${blood.toFixed(2)} ${t("g/l", "غ/ل")}`} tone={over ? "ko" : "ok"} />
        <Stat label={t("Équivalent air", "ما يعادله في الهواء")} value={`${air.toFixed(2)} ${t("mg/l", "ملغ/ل")}`} tone={over ? "ko" : "ok"} />
      </div>
      <div className={`rounded-2xl p-4 text-center text-lg font-black ${over ? "bg-ko/10 text-ko" : "bg-ok/10 text-ok"}`}>
        {over
          ? t("Interdit de conduire : délit (−6 points, immobilisation du véhicule)", "ممنوع السياقة: جنحة (ناقص 6 نقط، وتوقيف المركبة)")
          : t("Sous le seuil légal… mais la seule règle sûre : 0 alcool au volant.", "تحت العتبة القانونية… لكن القاعدة الآمنة الوحيدة: صفر كحول أثناء السياقة.")}
      </div>
      <Tip>
        {t(
          "Seuil marocain : 0,20 g/l dans le sang = 0,10 mg/l dans l'air (l'air = la moitié du sang). « Égal ou supérieur » est déjà interdit. Café, eau froide : inutiles, seul le temps fait baisser le taux.",
          "العتبة في المغرب: 0,20 غ/ل في الدم = 0,10 ملغ/ل في الهواء (الهواء = نصف الدم). « يساوي أو يفوق » ممنوع. القهوة والماء البارد لا ينفعان، الوقت وحده يخفض النسبة.",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Énergie cinétique */
export function Energie() {
  const { lang, t } = useLang();
  const [v, setV] = useState(60);
  const [mass, setMass] = useState(1250);
  const ms = v / 3.6;
  const kj = (0.5 * mass * ms * ms) / 1000;
  const ref = (0.5 * mass * (50 / 3.6) ** 2) / 1000;
  const floors = Math.round((ms * ms) / (2 * 9.81) / 3);
  return (
    <div className="space-y-4">
      <Slider label={t("Vitesse", "السرعة")} value={v} min={10} max={130} step={10} unit={t("km/h", "كلم/س")} onChange={setV} />
      <Toggle
        options={[
          { id: "275", label: t("Moto 275 kg", "دراجة نارية 275 كلغ") },
          { id: "1250", label: t("Voiture 1,25 t", "سيارة 1,25 طن") },
          { id: "9000", label: t("Camion 9 t", "شاحنة 9 طن") },
        ]}
        value={String(mass) as "275" | "1250" | "9000"}
        onChange={(x) => setMass(Number(x))}
      />
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("Énergie", "الطاقة")} value={`${Math.round(kj)} ${t("kJ", "كيلوجول")}`} tone="ko" />
        <Stat label={t("vs. 50 km/h", "مقارنة بـ 50 كلم/س")} value={`× ${(kj / ref).toFixed(1)}`} tone="accent" />
        <Stat
          label={t("Chute équivalente", "سقوط مماثل")}
          value={lang === "ar" ? `≈ ${floors} طابق` : `≈ ${floors} étage${floors > 1 ? "s" : ""}`}
          tone="brand"
        />
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-600 transition-all"
          style={{ width: `${Math.min(100, (kj / ((0.5 * 9000 * (130 / 3.6) ** 2) / 1000)) * 100)}%` }}
        />
      </div>
      <Tip>
        {t(
          "L'énergie dépend du CARRÉ de la vitesse : 60 → 120 km/h = énergie × 4 (277 kJ → 1 111 kJ pour 2 t, chiffres du cours). Elle augmente aussi avec la masse : un camion à 30 km/h « frappe » plus fort qu'une voiture à 60.",
          "الطاقة مرتبطة بمربع السرعة: من 60 إلى 120 كلم/س = الطاقة × 4 (من 277 إلى 1111 كيلوجول بالنسبة لـ 2 طن، أرقام الدرس). وتزداد أيضا مع الكتلة: شاحنة بسرعة 30 كلم/س « تصطدم » بقوة أكبر من سيارة بسرعة 60.",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Formes et couleurs */
const SHAPES: { s: string; c: string; t: FA; m: FA; d: FA }[] = [
  { s: "triangle", c: "#dc2626", t: ["Triangle rouge", "مثلث أحمر"], m: ["DANGER (علامة الخطر)", "علامة الخطر"], d: ["Placé à 150 m hors agglomération, 50 m en agglomération.", "يوضع على بعد 150 م خارج التجمعات العمرانية، و50 م داخلها."] },
  { s: "circle-red", c: "#dc2626", t: ["Rond à bord rouge", "دائرة بإطار أحمر"], m: ["INTERDICTION (المنع)", "المنع"], d: ["S'applique dès le panneau, jusqu'à la prochaine intersection ou la fin.", "يُطبَّق ابتداء من العلامة إلى غاية ملتقى الطرق الموالي أو علامة النهاية."] },
  { s: "circle-blue", c: "#2563eb", t: ["Rond bleu", "دائرة زرقاء"], m: ["OBLIGATION (الإجبار)", "الإجبار"], d: ["Ce qu'il faut faire : direction, chemin obligatoire, vitesse minimale…", "ما يجب فعله: الاتجاه، المسلك الإجباري، السرعة الدنيا…"] },
  { s: "square", c: "#2563eb", t: ["Carré / rectangle bleu", "مربع / مستطيل أزرق"], m: ["INDICATION (الإرشاد)", "الإرشاد"], d: ["Information : parking, hôpital, sens unique, voie sans issue…", "معلومة: موقف، مستشفى، اتجاه وحيد، طريق مسدود…"] },
  { s: "end-black", c: "#111827", t: ["Barre noire sur fond blanc", "شريط أسود على خلفية بيضاء"], m: ["FIN D'INTERDICTION", "نهاية المنع"], d: ["Fin d'une limitation, d'une interdiction de dépasser…", "نهاية تحديد أو منع التجاوز…"] },
  { s: "end-red", c: "#dc2626", t: ["Barre rouge sur fond bleu", "شريط أحمر على خلفية زرقاء"], m: ["FIN D'OBLIGATION", "نهاية الإجبار"], d: ["Fin de vitesse minimale, fin de piste cyclable…", "نهاية السرعة الدنيا، نهاية مسلك الدراجات…"] },
  { s: "yellow", c: "#facc15", t: ["Fond jaune", "خلفية صفراء"], m: ["TEMPORAIRE (المؤقت)", "التشوير المؤقت"], d: ["Travaux, déviation : il prime sur la signalisation permanente.", "أشغال، تحويلة: مقدَّم على التشوير الدائم."] },
  { s: "octagon", c: "#dc2626", t: ["Octogone rouge", "مثمن أحمر"], m: ["STOP (قف)", "قف"], d: ["Arrêt absolu puis céder le passage à droite et à gauche.", "وقوف تام، ثم فسح المجال لليمين ولليسار."] },
  { s: "inv-triangle", c: "#dc2626", t: ["Triangle pointe en bas", "مثلث رأسه إلى الأسفل"], m: ["CÉDEZ LE PASSAGE", "فسح المجال"], d: ["Laisser passer sans obligation de s'arrêter si c'est libre.", "ترك الآخرين يمرون دون إلزامية التوقف إذا كانت الطريق فارغة."] },
  { s: "losange", c: "#facc15", t: ["Losange jaune", "معين أصفر"], m: ["ROUTE PRIORITAIRE", "طريق ذات أولوية"], d: ["Priorité à toutes les intersections jusqu'au losange barré.", "الأسبقية في جميع ملتقيات الطرق إلى غاية المعين المشطوب."] },
];

function ShapeSvg({ s, c }: { s: string; c: string }) {
  return (
    <svg viewBox="0 0 60 60" className="size-14">
      {s === "triangle" && <polygon points="30,5 56,52 4,52" fill="#fff" stroke={c} strokeWidth={6} strokeLinejoin="round" />}
      {s === "inv-triangle" && <polygon points="4,8 56,8 30,55" fill="#fff" stroke={c} strokeWidth={6} strokeLinejoin="round" />}
      {s === "circle-red" && <circle cx={30} cy={30} r={24} fill="#fff" stroke={c} strokeWidth={7} />}
      {s === "circle-blue" && <circle cx={30} cy={30} r={26} fill={c} />}
      {s === "square" && <rect x={6} y={6} width={48} height={48} rx={5} fill={c} />}
      {s === "end-black" && (
        <>
          <circle cx={30} cy={30} r={26} fill="#fff" stroke="#111" strokeWidth={1} />
          <line x1={12} y1={48} x2={48} y2={12} stroke={c} strokeWidth={5} />
        </>
      )}
      {s === "end-red" && (
        <>
          <circle cx={30} cy={30} r={26} fill="#2563eb" />
          <line x1={12} y1={48} x2={48} y2={12} stroke={c} strokeWidth={5} />
        </>
      )}
      {s === "yellow" && <polygon points="30,5 56,52 4,52" fill={c} stroke="#dc2626" strokeWidth={5} strokeLinejoin="round" />}
      {s === "octagon" && <polygon points="20,4 40,4 56,20 56,40 40,56 20,56 4,40 4,20" fill={c} />}
      {s === "losange" && (
        <>
          <rect x={13} y={13} width={34} height={34} transform="rotate(45 30 30)" fill="#fff" stroke="#111" strokeWidth={1} />
          <rect x={19} y={19} width={22} height={22} transform="rotate(45 30 30)" fill={c} />
        </>
      )}
    </svg>
  );
}

export function Formes() {
  const { lang, t } = useLang();
  const L = (p: FA) => (lang === "ar" ? p[1] : p[0]);
  const [hide, setHide] = useState(false);
  return (
    <div className="space-y-4">
      <button className={`btn ${hide ? "btn-accent" : "btn-ghost"}`} onClick={() => setHide((h) => !h)}>
        {hide ? t("Afficher les réponses", "إظهار الأجوبة") : t("Me tester : cacher les significations", "اختبر نفسي: إخفاء المعاني")}
      </button>
      <div className="grid gap-2 sm:grid-cols-2">
        {SHAPES.map((x) => (
          <div key={x.s} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 ring-1 ring-line">
            <ShapeSvg s={x.s} c={x.c} />
            <div>
              <p className="text-sm font-black">{L(x.t)}</p>
              <p className={`text-sm font-bold text-brand ${hide ? "blur-sm hover:blur-none" : ""}`}>{L(x.m)}</p>
              <p className={`text-xs text-muted ${hide ? "blur-sm hover:blur-none" : ""}`}>{L(x.d)}</p>
            </div>
          </div>
        ))}
      </div>
      <Tip>
        {t(
          "Forme = type de message (triangle danger, rond ordre, carré info). Couleur = nature (rouge interdit/danger, bleu obligation/indication, jaune temporaire).",
          "الشكل = نوع الرسالة (المثلث خطر، الدائرة أمر، المربع معلومة). اللون = الطبيعة (الأحمر منع/خطر، الأزرق إجبار/إرشاد، الأصفر مؤقت).",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Dépassement */
const CHECK: FA[] = [
  ["Aucun panneau ni ligne continue n'interdit de dépasser", "لا توجد علامة ولا خط متصل يمنع التجاوز"],
  ["Je pourrai me rabattre sans gêner", "سأتمكن من الرجوع إلى ممري دون عرقلة أحد"],
  ["La différence de vitesse permet un dépassement court", "فارق السرعة يسمح بتجاوز قصير"],
  ["Personne n'a commencé à me dépasser", "لم يبدأ أحد في تجاوزي"],
  ["La visibilité est suffisante (pas de virage ni sommet de côte)", "الرؤية كافية (لا منعرج ولا قمة عقبة)"],
];
const REVERSE: [FA, FA][] = [
  [
    ["Deux véhicules de même catégorie en montagne", "مركبتان من نفس الصنف في طريق جبلية"],
    ["Celui qui DESCEND recule (sauf si c'est plus facile pour celui qui monte, près d'un refuge)", "النازل هو الذي يرجع إلى الخلف (إلا إذا كان ذلك أسهل للصاعد، قرب مكان للتنحي)"],
  ],
  [
    ["Un véhicule seul face à un groupe", "مركبة واحدة أمام مجموعة من المركبات"],
    ["Le véhicule SEUL recule", "المركبة الوحيدة هي التي ترجع إلى الخلف"],
  ],
  [
    ["Voiture légère face à un poids lourd", "سيارة خفيفة أمام مركبة ثقيلة"],
    ["La voiture LÉGÈRE recule", "السيارة الخفيفة هي التي ترجع إلى الخلف"],
  ],
  [
    ["Camion face à un autocar", "شاحنة أمام حافلة"],
    ["Le CAMION recule", "الشاحنة هي التي ترجع إلى الخلف"],
  ],
];
export function Depassement() {
  const { lang, t } = useLang();
  const L = (p: FA) => (lang === "ar" ? p[1] : p[0]);
  const [c, setC] = useState<boolean[]>(CHECK.map(() => false));
  const all = c.every(Boolean);
  return (
    <div className="space-y-4">
      <p className="font-black">{t("Les 5 conditions avant de dépasser (toutes obligatoires)", "الشروط الخمسة قبل التجاوز (كلها إجبارية)")}</p>
      <div className="space-y-2">
        {CHECK.map((x, i) => (
          <label key={x[0]} className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 ${c[i] ? "bg-ok/10 ring-ok/40" : "bg-surface-2 ring-line"}`}>
            <input type="checkbox" checked={c[i]} onChange={() => setC(c.map((y, j) => (j === i ? !y : y)))} className="size-5 accent-[var(--ok)]" />
            <span className="text-sm font-semibold">{L(x)}</span>
          </label>
        ))}
      </div>
      <div className={`rounded-2xl p-3 text-center font-black ${all ? "bg-ok/10 text-ok" : "bg-ko/10 text-ko"}`}>
        {all
          ? t(
              "Dépassement possible : rétro → angle mort → clignotant gauche → dépasse → clignotant droit → rabats-toi.",
              "التجاوز ممكن: المرآة ← الزاوية الميتة ← الإشارة اليسرى ← تجاوز ← الإشارة اليمنى ← ارجع إلى ممرك.",
            )
          : t("Il manque une condition : NE DÉPASSE PAS.", "ينقص شرط: لا تتجاوز.")}
      </div>
      <p className="font-black">{t("Croisement impossible : qui fait marche arrière ?", "التقابل مستحيل: من يرجع إلى الخلف ؟")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {REVERSE.map(([a, b]) => (
          <div key={a[0]} className="rounded-2xl bg-surface-2 p-3 ring-1 ring-line">
            <p className="text-sm font-bold text-muted">{L(a)}</p>
            <p className="mt-1 font-black text-brand">{L(b)}</p>
          </div>
        ))}
      </div>
      <Tip>
        {t(
          "Dépassement à droite : uniquement si le véhicule devant a signalé qu'il tourne à gauche. Quand on te dépasse : serre à droite et n'accélère pas.",
          "التجاوز من اليمين: فقط إذا أشارت المركبة التي أمامك إلى أنها ستنعطف نحو اليسار. عندما يتجاوزك أحد: التزم أقصى اليمين ولا تزد في السرعة.",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Arrêt / stationnement */
const FORBIDDEN: FA[] = [
  ["Trottoir, passage piéton, piste cyclable", "الرصيف، ممر الراجلين، مسلك الدراجات"],
  ["Arrêt de bus / taxi", "محطة الحافلات / سيارات الأجرة"],
  ["Double file (sauf deux-roues)", "الصف الثاني (باستثناء الدراجات)"],
  ["Devant une entrée de garage", "أمام مدخل مرآب"],
  ["Virage, sommet de côte, intersection (visibilité)", "المنعرج، قمة العقبة، ملتقى الطرق (الرؤية)"],
  ["Passage à niveau, voie de tram, tunnel, pont", "الممر السككي، سكة الترامواي، النفق، القنطرة"],
  ["À gauche (sauf sens unique en ville)", "على اليسار (إلا في الاتجاه الوحيد داخل المدينة)"],
  ["Masquant un feu ou un panneau", "حجب ضوء أو علامة"],
];
export function Stationnement() {
  const { lang, t } = useLang();
  const [where, setWhere] = useState<"agglo-signal" | "agglo-sans" | "hors">("agglo-sans");
  const d = where === "agglo-sans" ? 5 : 12;
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-brand/10 p-4">
          <p className="ar text-lg font-black">{t("الوقوف = Arrêt", "الوقوف")}</p>
          <p className="text-sm font-semibold">
            {t(
              "Immobilisation brève (monter/descendre, charger). Le conducteur reste dans le véhicule ou tout près.",
              "توقف قصير (الصعود / النزول، الشحن). يبقى السائق داخل المركبة أو بالقرب منها.",
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-accent/10 p-4">
          <p className="ar text-lg font-black">{t("التوقف = Stationnement", "التوقف")}</p>
          <p className="text-sm font-semibold">{t("Moteur arrêté, le conducteur quitte le véhicule.", "المحرك متوقف، والسائق يغادر المركبة.")}</p>
        </div>
      </div>
      <Toggle
        options={[
          { id: "agglo-sans", label: t("Ville, carrefour sans signalisation", "داخل المدينة، ملتقى طرق بدون تشوير") },
          { id: "agglo-signal", label: t("Ville, carrefour signalisé / rail / tram", "داخل المدينة، ملتقى مشوّر / سكة / ترامواي") },
          { id: "hors", label: t("Hors agglomération", "خارج التجمعات العمرانية") },
        ]}
        value={where}
        onChange={setWhere}
      />
      <svg viewBox="0 0 400 140" className="w-full rounded-2xl bg-slate-700">
        <rect x={0} y={40} width={400} height={60} fill="#374151" />
        <rect x={300} y={0} width={60} height={140} fill="#374151" />
        <line x1={300 - d * 12} y1={30} x2={300 - d * 12} y2={110} stroke="#facc15" strokeWidth={3} strokeDasharray="6 4" />
        <rect x={300 - d * 12} y={80} width={d * 12} height={18} fill="#ef4444" opacity={0.35} />
        <text x={300 - (d * 12) / 2} y={124} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={900}>
          {t(`${d} m interdits`, `${d} م ممنوعة`)}
        </text>
        <rect x={300 - d * 12 - 54} y={78} width={44} height={22} rx={5} fill="#22c55e" />
      </svg>
      <ul className="grid gap-1.5 text-sm font-semibold sm:grid-cols-2">
        {FORBIDDEN.map((x) => (
          <li key={x[0]} className="rounded-xl bg-surface-2 p-2 ring-1 ring-line">
            {lang === "ar" ? x[1] : x[0]}
          </li>
        ))}
      </ul>
      <Tip>
        {t(
          "Retiens « 5 et 12 » : 5 m d'un carrefour non signalisé en ville, 12 m d'un carrefour signalisé, d'un passage à niveau ou hors agglomération. Panneau 1 barre = stationnement interdit, croix = arrêt ET stationnement interdits.",
          "احفظ « 5 و12 »: 5 م من ملتقى طرق غير مشوّر داخل المدينة، و12 م من ملتقى مشوّر أو ممر سككي أو خارج التجمعات العمرانية. العلامة بشريط واحد = منع التوقف، والعلامة بالعلامة × = منع الوقوف والتوقف معا.",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Permis à points */
export function Points() {
  const { t } = useLang();
  const [pro, setPro] = useState<"prob" | "conf">("prob");
  const cap = pro === "prob" ? 20 : 30;
  const [pts, setPts] = useState(cap);
  return (
    <div className="space-y-4">
      <Toggle
        options={[
          { id: "prob", label: t("Probatoire : 20 points (2 ans)", "اختبارية: 20 نقطة (سنتان)") },
          { id: "conf", label: t("Permis confirmé : 30 points", "رخصة نهائية: 30 نقطة") },
        ]}
        value={pro}
        onChange={(x) => {
          setPro(x);
          setPts(x === "prob" ? 20 : 30);
        }}
      />
      <Slider label={t("Points restants", "النقط المتبقية")} value={Math.min(pts, cap)} min={0} max={cap} onChange={setPts} />
      <div className="flex h-5 overflow-hidden rounded-full bg-line">
        <div className={`h-full transition-all ${pts / cap > 0.5 ? "bg-ok" : pts / cap > 1 / 3 ? "bg-amber-500" : "bg-ko"}`} style={{ width: `${(pts / cap) * 100}%` }} />
      </div>
      <div className="rounded-2xl bg-surface-2 p-3 text-sm font-semibold ring-1 ring-line">
        {pts === 0
          ? t(
              "Permis annulé : restitution sous 1 mois, nouvel examen après 6 mois minimum + stage. Nouveau permis = 20 points + 2 ans de probatoire.",
              "الرخصة ملغاة: إرجاعها داخل شهر، وامتحان جديد بعد 6 أشهر على الأقل + دورة تكوينية. الرخصة الجديدة = 20 نقطة + سنتان من الفترة الاختبارية.",
            )
          : pro === "prob" && pts < cap / 3
            ? t(
                "Plus des 2/3 des points perdus en probatoire : stage de sensibilisation OBLIGATOIRE pour obtenir les 30 points ensuite.",
                "فقدان أكثر من ثلثي النقط خلال الفترة الاختبارية: دورة التحسيس إجبارية للحصول على 30 نقطة بعد ذلك.",
              )
            : pts <= cap / 2
              ? t("La moitié des points ou plus est perdue : lettre recommandée de l'administration.", "فقدان نصف النقط أو أكثر: رسالة مضمونة من الإدارة.")
              : t(
                  "Situation correcte. Un stage volontaire rend +4 points (1 fois en probatoire, puis 1 fois tous les 3 ans).",
                  "وضعية جيدة. الدورة التكوينية الاختيارية تعيد 4 نقط (مرة واحدة في الفترة الاختبارية، ثم مرة كل 3 سنوات).",
                )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={t("1 an sans infraction", "سنة بدون مخالفة")} value={t("+4 pts", "+ 4 نقط")} tone="ok" />
        <Stat label={t("2 ans, solde < 8", "سنتان، رصيد أقل من 8")} value={t("→ 12 pts", "← 12 نقطة")} tone="ok" />
        <Stat label={t("3 ans sans infraction", "3 سنوات بدون مخالفة")} value={t("→ 30 pts", "← 30 نقطة")} tone="ok" />
      </div>
      <Tip>
        {t(
          "Retrait maximum en une fois : 8 (plusieurs contraventions) · 10 (plusieurs délits) · 14 (contraventions + 1 délit) · 16 (avec homicide/blessures aggravés).",
          "الحد الأقصى المسحوب دفعة واحدة: 8 (عدة مخالفات) · 10 (عدة جنح) · 14 (مخالفات + جنحة واحدة) · 16 (مع القتل أو الجروح مع ظروف التشديد).",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ P.A.S. */
const PAS_STEPS: { k: FA; t: FA; d: FA[] }[] = [
  {
    k: ["P", "1"],
    t: ["PROTÉGER — حماية", "الحماية"],
    d: [
      ["Warning + gilet jaune AVANT de descendre", "أضواء الإغاثة + السترة العاكسة قبل النزول"],
      ["Triangle à distance suffisante", "المثلث على مسافة كافية"],
      ["Lampe de poche / feux de route la nuit", "مصباح يدوي / أضواء الطريق ليلا"],
      ["Ne jamais rester sur la chaussée", "لا تبق أبدا على قارعة الطريق"],
    ],
  },
  {
    k: ["A", "2"],
    t: ["ALERTER — التبليغ", "الإخبار"],
    d: [
      ["15 ou 150 : pompiers (protection civile)", "15 أو 150: الوقاية المدنية"],
      ["19 : police · 177 : gendarmerie", "19: الشرطة · 177: الدرك الملكي"],
      ["5050 : autoroutes du Maroc", "5050: الطرق السيارة بالمغرب"],
      [
        "Dire : lieu, type d'accident, nombre de véhicules, nombre et état des victimes",
        "قل: المكان، نوع الحادثة، عدد المركبات، وعدد الضحايا وحالتهم",
      ],
    ],
  },
  {
    k: ["S", "3"],
    t: ["SECOURIR — الإغاثة", "الإسعاف"],
    d: [
      ["Libérer les voies respiratoires, couvrir, parler à la victime", "تحرير المسالك التنفسية، تغطية الضحية والتحدث إليها"],
      ["Ne pas déplacer la victime (sauf danger immédiat)", "لا تحرك الضحية (إلا في حالة خطر فوري)"],
      ["Formé : PLS ; arrêt cardiaque : 100–120 compressions/min", "إذا كنت مكوَّنا: وضعية الإفاقة الجانبية؛ توقف القلب: 100 – 120 ضغطة في الدقيقة"],
      ["Adulte 30 compressions / 2 insufflations · enfant 5 insufflations puis 15/2", "الراشد: 30 ضغطة / نفختان · الطفل: 5 نفخات ثم 15/2"],
    ],
  },
];
export function Pas() {
  const { lang, t } = useLang();
  const L = (p: FA) => (lang === "ar" ? p[1] : p[0]);
  const [step, setStep] = useState(0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {PAS_STEPS.map((s, i) => (
          <button key={s.k[0]} onClick={() => setStep(i)} className={`rounded-2xl p-4 text-center ring-1 ${step === i ? "bg-brand text-white ring-brand" : "bg-surface-2 ring-line"}`}>
            <span className="block text-4xl font-black">{L(s.k)}</span>
            <span className="text-xs font-bold">{L(s.t).split(" — ")[0]}</span>
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
        <p className="text-lg font-black">{L(PAS_STEPS[step].t)}</p>
        <ul className="mt-2 space-y-1.5 text-sm font-semibold">
          {PAS_STEPS[step].d.map((x) => (
            <li key={x[0]}>• {L(x)}</li>
          ))}
        </ul>
      </div>
      <Tip>
        {t(
          "Toujours dans l'ordre P → A → S : protéger d'abord pour éviter le sur-accident. Ne pas s'arrêter = délit de fuite (−6 points) ; ne pas alerter = non-assistance à personne en danger.",
          "دائما بالترتيب: الحماية ← الإخبار ← الإسعاف: احمِ أولا لتفادي حادثة ثانية. عدم التوقف = جنحة الفرار (ناقص 6 نقط)؛ وعدم الإخبار = عدم تقديم المساعدة لشخص في خطر.",
        )}
      </Tip>
    </div>
  );
}

/* ------------------------------------------------------------------ Hiérarchie */
const HIER: [LucideIcon, FA, FA][] = [
  [Hand, ["Agent de circulation", "عون المرور"], ["Prime sur tout, y compris les feux", "مقدَّم على كل شيء، بما في ذلك الأضواء"]],
  [CircleDot, ["Feux tricolores", "الأضواء الثلاثية الألوان"], ["Priment sur les panneaux et les règles", "مقدَّمة على العلامات والقواعد"]],
  [Signpost, ["Panneaux & marquages", "العلامات والخطوط الأرضية"], ["Priment sur les règles générales", "مقدَّمة على القواعد العامة"]],
  [BookOpen, ["Règles de circulation", "قواعد السير"], ["Ex. priorité à droite quand rien n'est indiqué", "مثال: الأسبقية لليمين عندما لا يوجد أي تشوير"]],
];
export function Hierarchie() {
  const { lang, t } = useLang();
  const L = (p: FA) => (lang === "ar" ? p[1] : p[0]);
  return (
    <div className="space-y-3">
      {HIER.map(([Icon, ti, d], i) => (
        <div key={ti[0]} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 ring-1 ring-line" style={{ marginInlineStart: i * 18 }}>
          <span className="grid size-12 place-items-center rounded-[8px] bg-brand text-white">
            <Icon className="size-6" />
          </span>
          <div>
            <p className="font-black">
              {i + 1}. {L(ti)}
            </p>
            <p className="text-sm text-muted">{L(d)}</p>
          </div>
        </div>
      ))}
      <Tip>
        {t(
          "Feu jaune clignotant ou feu en panne = on applique les panneaux, puis la priorité à droite. Feu orange fixe = arrêt obligatoire, sauf si s'arrêter serait dangereux.",
          "الضوء البرتقالي الوامض أو الضوء المعطل = نطبق العلامات، ثم الأسبقية لليمين. الضوء البرتقالي الثابت = التوقف إجباري، إلا إذا كان التوقف خطيرا.",
        )}
      </Tip>
    </div>
  );
}
