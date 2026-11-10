"use client";

import { useMemo, useState } from "react";
import { BookOpen, Check, ClipboardCheck, CircleUserRound, Eye, Gauge, LayoutDashboard, Lightbulb, Map as MapIcon, NotebookPen, RotateCcw, Shapes, Target, X, type LucideIcon } from "lucide-react";
import { asset } from "@/lib/base";
import { useLang } from "@/lib/i18n";
import { RANKS } from "@/lib/game";
import { MEMO_ITEMS, memoText } from "@/lib/memo";
import { cx } from "@/components/ui";
import { BADGES } from "@/components/game/GameShell";
import { GameIcon } from "@/components/game/GameIcon";
import { Mascot, type Pose } from "@/components/game/Mascot";
import type { DemoId, L } from "./content";

/** Exercices du guide : tout reste local, rien n'est écrit dans la progression de l'apprenti. */

function usePick() {
  const { lang } = useLang();
  return (x: L) => (lang === "ar" ? x[1] : x[0]);
}

/* ───────────── Langue ───────────── */
function LangDemo() {
  const { lang, setLang } = useLang();
  const opts = [
    { id: "fr" as const, name: "Français", pose: "wave" as Pose },
    { id: "ar" as const, name: "العربية", pose: "welcome" as Pose },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {opts.map((o) => (
        <button key={o.id} onClick={() => setLang(o.id)} aria-pressed={lang === o.id} className="duo-tile flex flex-col items-center gap-2 p-4" data-state={lang === o.id ? "selected" : undefined}>
          <Mascot pose={o.pose} size={90} />
          <span lang={o.id} className="text-[20px] font-[800]">
            {o.name}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ───────────── Score ───────────── */
function ScoreDemo() {
  const { t } = useLang();
  const [n, setN] = useState(30);
  const pass = n >= 32;
  const errors = 40 - n;
  return (
    <div className="duo-card p-5 text-center">
      <Mascot pose={pass ? "permis" : n >= 26 ? "thinking" : "worried"} size={100} className="mx-auto" />
      <p className="duo-h mt-2 text-[40px] leading-none" dir="ltr">
        {n} <span className="text-[22px] text-[var(--duo-muted)]">/ 40</span>
      </p>
      <p className={cx("mt-2 text-[18px] font-[800]", pass ? "text-[var(--duo-green)]" : "text-[var(--duo-red)]")}>{pass ? t("Examen réussi !", "نجحت في الامتحان !") : t("Examen non réussi", "لم تنجح في الامتحان")}</p>
      <div dir="ltr" className="mt-4">
        <input type="range" min={0} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label={t("Bonnes réponses", "الأجوبة الصحيحة")} className="w-full accent-[#d92b2b]" />
      </div>
      <p className="mt-2 text-[15px] font-[600] text-[var(--duo-muted)]">
        {errors} {t(errors > 1 ? "erreurs" : "erreur", "خطأ")} · {t("8 erreurs au maximum", "8 أخطاء على الأكثر")}
      </p>
    </div>
  );
}

/* ───────────── Carte de l'application ───────────── */
const MAP: { ic: LucideIcon; ch: string; t: L; d: L }[] = [
  { ic: MapIcon, ch: "path", t: ["Parcours", "المسار"], d: ["La route, étape par étape", "الطريق، مرحلة بعد مرحلة"] },
  { ic: BookOpen, ch: "courses", t: ["Cours", "الدروس"], d: ["54 chapitres complets", "54 درسا كاملا"] },
  { ic: Target, ch: "practice", t: ["S'entraîner", "التمرن"], d: ["Des questions à volonté", "أسئلة بلا حدود"] },
  { ic: ClipboardCheck, ch: "exam", t: ["Examen blanc", "امتحان تجريبي"], d: ["40 questions au chrono", "40 سؤالا بتوقيت"] },
  { ic: NotebookPen, ch: "errors", t: ["Mes erreurs", "أخطائي"], d: ["Révisées au bon moment", "تُراجع في الوقت المناسب"] },
  { ic: Shapes, ch: "tools", t: ["Schémas", "الرسوم"], d: ["20 situations animées", "20 وضعية متحركة"] },
  { ic: Lightbulb, ch: "tools", t: ["Mémo", "المذكرة"], d: ["Les chiffres à retenir", "الأرقام التي يجب حفظها"] },
  { ic: LayoutDashboard, ch: "follow", t: ["Tableau de bord", "لوحة القيادة"], d: ["Ton programme du jour", "برنامجك اليوم"] },
  { ic: Gauge, ch: "follow", t: ["Progression", "التقدم"], d: ["Tes statistiques", "إحصائياتك"] },
  { ic: CircleUserRound, ch: "account", t: ["Mon profil", "ملفي"], d: ["Grade et compte", "الرتبة والحساب"] },
];

function MapDemo({ go }: { go: (ch: string) => void }) {
  const p = usePick();
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {MAP.map(({ ic: Icon, ch, t, d }) => (
        <button key={t[0]} onClick={() => go(ch)} className="duo-card flex items-start gap-2.5 p-3 text-start transition-transform active:translate-y-0.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--duo-blue-50)] text-[var(--duo-blue)]">
            <Icon className="size-5" strokeWidth={2.3} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-[800] leading-tight text-[var(--duo-ink)]">{p(t)}</span>
            <span className="mt-0.5 block text-[12px] font-[600] leading-snug text-[var(--duo-muted)]">{p(d)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ───────────── Visuels de la route ───────────── */
const NODES: { img: string; t: L; d: L }[] = [
  { img: "current", t: ["L'étape en cours", "المرحلة الحالية"], d: ["C'est la prochaine à faire. Touche-la pour commencer.", "إنها التالية. المسها لتبدأ."] },
  { img: "done", t: ["Étape validée", "مرحلة مكتملة"], d: ["Réussie. Tu peux la refaire pour réviser et gagner 5 XP.", "ناجحة. يمكنك إعادتها للمراجعة وربح 5 نقاط XP."] },
  { img: "review", t: ["Étape à revoir", "مرحلة للمراجعة"], d: ["Validée, mais des erreurs de cette étape t'attendent dans ton carnet.", "مكتملة، لكن أخطاء من هذه المرحلة تنتظرك في دفترك."] },
  { img: "locked", t: ["Étape verrouillée", "مرحلة مقفلة"], d: ["Termine d'abord toutes les étapes qui la précèdent.", "أكمل أولا كل المراحل التي قبلها."] },
  { img: "chest", t: ["Le coffre : défi d'unité", "الصندوق: تحدي الوحدة"], d: ["10 questions au chrono pour terminer l'unité. +20 XP.", "10 أسئلة بتوقيت لإنهاء الوحدة. ‎+20 XP."] },
  { img: "summit", t: ["Le Sommet", "القمة"], d: ["L'examen final de 40 questions, au bout de la route. +100 XP.", "الامتحان النهائي من 40 سؤالا في نهاية الطريق. ‎+100 XP."] },
];

function NodesDemo() {
  const p = usePick();
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {NODES.map((n, k) => (
          <button key={n.img} onClick={() => setI(k)} aria-pressed={i === k} className="duo-tile grid h-[92px] place-items-center p-2" data-state={i === k ? "selected" : undefined}>
            <img src={asset(`/nodes/${n.img}.webp`)} alt={p(n.t)} className="max-h-[72px] w-auto" />
          </button>
        ))}
      </div>
      <div key={i} className="duo-card animate-pop mt-3 p-4">
        <p className="text-[17px] font-[800] text-[var(--duo-ink)]">{p(NODES[i].t)}</p>
        <p className="mt-1 text-[15px] font-[500] leading-relaxed text-[var(--duo-muted)]">{p(NODES[i].d)}</p>
      </div>
    </div>
  );
}

/* ───────────── Mini-étape ───────────── */
const SIGN = {
  stop: "/media/01_la_route/02_dangers_priorites/1681901900516.png",
  noEntry: "/media/01_la_route/03_interdictions/1682406244008.png",
  giveWay: "/media/01_la_route/02_dangers_priorites/1689673393547.png",
};

const LESSON: { img: string; q: L; o: L[]; a: number; e: L }[] = [
  {
    img: SIGN.stop,
    q: ["Que t'oblige à faire ce panneau ?", "ماذا تلزمك هذه العلامة بفعله ؟"],
    o: [["Ralentir seulement", "تخفيف السرعة فقط"], ["M'arrêter, puis céder le passage", "التوقف ثم إعطاء حق الأسبقية"], ["Klaxonner avant de passer", "استعمال المنبه قبل المرور"]],
    a: 1,
    e: ["Au panneau STOP, l'arrêt est obligatoire, même si la route semble libre.", "عند علامة قف، التوقف إجباري حتى لو بدا الطريق خاليا."],
  },
  {
    img: SIGN.noEntry,
    q: ["Que signifie ce panneau ?", "ماذا تعني هذه العلامة ؟"],
    o: [["Stationnement interdit", "الوقوف ممنوع"], ["Route à sens unique", "طريق ذو اتجاه واحد"], ["Sens interdit", "اتجاه ممنوع"]],
    a: 2,
    e: ["Tu ne peux pas t'engager dans cette voie dans ce sens.", "لا يمكنك الدخول إلى هذا الطريق في هذا الاتجاه."],
  },
  {
    img: SIGN.giveWay,
    q: ["Que dois-tu faire à ce panneau ?", "ماذا يجب أن تفعل عند هذه العلامة ؟"],
    o: [["Céder le passage à l'intersection", "إعطاء حق الأسبقية عند ملتقى الطرق"], ["Passer en priorité", "المرور بالأسبقية"], ["M'arrêter dans tous les cas", "التوقف في كل الحالات"]],
    a: 0,
    e: ["Tu ralentis et tu laisses passer. Si la voie est libre, l'arrêt n'est pas obligatoire.", "تخفف السرعة وتترك الآخرين يمرون. إذا كان الطريق خاليا، فالتوقف غير إجباري."],
  },
];

function LessonDemo() {
  const { t } = useLang();
  const p = usePick();
  const [queue, setQueue] = useState([0, 1, 2]);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [good, setGood] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const reset = () => {
    setQueue([0, 1, 2]);
    setPos(0);
    setPicked(null);
    setChecked(false);
    setHearts(3);
    setGood(0);
    setMistakes(0);
  };
  const qi = queue[pos];
  const finished = pos >= queue.length;
  const suspended = hearts <= 0 && !checked;

  if (finished || suspended) {
    return (
      <div className="duo-card animate-pop p-5 text-center">
        <Mascot pose={finished ? (mistakes ? "cheer" : "excellent") : "tired"} size={120} className="mx-auto" />
        <p className={cx("duo-h mt-2 text-[24px]", !finished && "!text-[var(--duo-red)]")}>
          {finished ? (mistakes ? t("Étape terminée !", "اكتملت المرحلة !") : t("Étape parfaite !", "مرحلة مثالية !")) : t("Permis suspendu !", "الرخصة موقوفة !")}
        </p>
        <p className="mt-1 text-[15px] font-[600] text-[var(--duo-muted)]">
          {finished
            ? t(`Dans une vraie étape, tu gagnerais ${mistakes ? 10 : 15} XP et la suivante s'ouvrirait.`, `في مرحلة حقيقية، كنت ستربح ${mistakes ? 10 : 15} نقطة XP وتُفتح المرحلة الموالية.`)
            : t("Plus de points : il faut relire le cours express et recommencer l'étape.", "لم تبق لك نقط: يجب إعادة قراءة الدرس السريع وإعادة المرحلة.")}
        </p>
        <button onClick={reset} className="duo-btn duo-btn-ghost mt-4 w-full !min-h-12">
          <RotateCcw className="size-4" /> {t("Rejouer", "إعادة")}
        </button>
      </div>
    );
  }

  const q = LESSON[qi];
  const ok = picked === q.a;
  const retry = queue.slice(0, pos).includes(qi);
  const next = () => {
    setPos(pos + 1);
    setPicked(null);
    setChecked(false);
  };
  const check = () => {
    if (picked === null) return;
    setChecked(true);
    if (picked === q.a) setGood((g) => g + 1);
    else {
      setHearts((h) => h - 1);
      setMistakes((m) => m + 1);
      setQueue((x) => [...x, qi]);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3" dir="ltr">
        <div className="duo-progress flex-1">
          <span style={{ width: `${Math.max(3, (good / 3) * 100)}%` }} />
        </div>
        <span className="flex items-center gap-1 text-[17px] font-[800] text-[var(--duo-brand)]">
          <GameIcon name="permis" size={30} /> <span className="duo-mono">{hearts}</span>
        </span>
      </div>
      <div key={`${qi}-${pos}`} className="animate-pop mt-3">
        {retry && <p className="mb-1 text-[13px] font-[800] uppercase tracking-wide text-[var(--duo-orange)]">{t("Erreur précédente", "خطأ سابق")}</p>}
        <div className="flex items-center gap-3">
          <img src={asset(q.img)} alt="" data-zoom className="h-[72px] w-auto shrink-0 rounded-[10px]" />
          <p className="text-[17px] font-[800] leading-snug text-[var(--duo-ink)]">{p(q.q)}</p>
        </div>
        <div className="mt-3 space-y-2">
          {q.o.map((o, k) => {
            const st = !checked ? (picked === k ? "selected" : undefined) : k === q.a ? (picked === k ? "correct" : "missed") : picked === k ? "wrong" : undefined;
            return (
              <button key={k} className="duo-tile flex min-h-[50px] w-full items-center px-3 py-2 text-start text-[15px] font-[700] leading-snug" data-state={st} disabled={checked} onClick={() => setPicked(k)}>
                {p(o)}
              </button>
            );
          })}
        </div>
      </div>
      {checked ? (
        <div className={cx("animate-pop mt-3 rounded-[16px] p-3.5", ok ? "bg-[var(--duo-green-50)]" : "bg-[var(--duo-red-50)]")}>
          <p className={cx("text-[16px] font-[800]", ok ? "text-[var(--duo-green)]" : "text-[var(--duo-red-d)]")}>{ok ? t("Bravo !", "أحسنت !") : t("Tu perds un point de permis", "فقدت نقطة من رخصتك")}</p>
          <p className="mt-0.5 text-[14px] font-[500] leading-relaxed text-[var(--duo-ink)]">{p(q.e)}</p>
          {!ok && <p className="mt-1 text-[13px] font-[800] text-[var(--duo-red-d)]">{t("Cette question reviendra à la fin de l'étape.", "سيعود هذا السؤال في نهاية المرحلة.")}</p>}
          <button onClick={next} className={cx("duo-btn mt-3 w-full !min-h-11", ok ? "duo-btn-green" : "duo-btn-red")}>
            {hearts <= 0 ? t("Voir le résultat", "عرض النتيجة") : t("Suivant", "التالي")}
          </button>
        </div>
      ) : (
        <button onClick={check} disabled={picked === null} className="duo-btn duo-btn-blue mt-3 w-full !min-h-11">
          {t("Vérifier", "تحقق")}
        </button>
      )}
    </div>
  );
}

/* ───────────── Zoom ───────────── */
function ZoomDemo() {
  const { t } = useLang();
  return (
    <div className="duo-card mx-auto w-fit overflow-hidden !p-0">
      <img src={asset(SIGN.stop)} alt={t("Panneau STOP", "علامة قف")} data-zoom data-caption={t("STOP : arrêt obligatoire", "قف: توقف إجباري")} className="block h-44 w-auto cursor-zoom-in" />
    </div>
  );
}

/* ───────────── Mode test des panneaux ───────────── */
const REVEAL: { img: string; t: L }[] = [
  { img: SIGN.stop, t: ["STOP", "قف"] },
  { img: SIGN.noEntry, t: ["Sens interdit", "اتجاه ممنوع"] },
  { img: SIGN.giveWay, t: ["Cédez le passage à l'intersection", "إعطاء حق الأسبقية عند ملتقى الطرق"] },
];

function RevealDemo() {
  const p = usePick();
  const [open, setOpen] = useState<number[]>([]);
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {REVEAL.map((r, i) => {
        const show = open.includes(i);
        return (
          <button key={r.img} onClick={() => setOpen((o) => [...o, i])} className="overflow-hidden rounded-[16px] border-2 border-[var(--duo-grey)] bg-white text-center">
            <img src={asset(r.img)} alt="" className="block h-auto w-full" />
            <span className={cx("block min-h-[52px] p-1.5 text-[13px] font-[700] leading-snug text-[var(--duo-ink)]", !show && "select-none blur-sm")}>{show ? p(r.t) : "••••••••"}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Quel mode choisir ───────────── */
const PICKER: { s: L; pose: Pose; mode: L; why: L }[] = [
  { s: ["Je ne sais pas quoi faire", "لا أعرف ماذا أفعل"], pose: "directions", mode: ["Session du jour", "حصة اليوم"], why: ["Elle choisit pour toi 20 questions parmi celles que tu n'as jamais vues ou que tu rates.", "تختار لك 20 سؤالا مما لم تره أو تخطئ فيه."] },
  { s: ["Je rate toujours les mêmes questions", "أخطئ دائما في الأسئلة نفسها"], pose: "worried", mode: ["Mes points faibles", "نقاط ضعفي"], why: ["Tu retravailles uniquement les questions qui te posent problème.", "تعيد العمل فقط على الأسئلة التي تصعب عليك."] },
  { s: ["Je veux m'habituer aux vraies questions", "أريد التعود على الأسئلة الحقيقية"], pose: "study", mode: ["Questions officielles", "الأسئلة الرسمية"], why: ["Le format exact de l'examen, avec une correction après chaque question.", "صيغة الامتحان بالضبط، مع تصحيح بعد كل سؤال."] },
  { s: ["Les chiffres ne rentrent pas", "لا أستطيع حفظ الأرقام"], pose: "thinking", mode: ["Règles et chiffres, puis Mémo", "القواعد والأرقام، ثم المذكرة"], why: ["Entraîne-toi sur les vitesses, distances et amendes, puis retiens-les avec les astuces.", "تمرن على السرعات والمسافات والغرامات، ثم احفظها بالحيل."] },
  { s: ["Je veux réviser un seul chapitre", "أريد مراجعة درس واحد"], pose: "reading", mode: ["Cours, puis onglet Quiz", "الدروس، ثم تبويب الاختبار"], why: ["Ouvre le chapitre : son onglet Quiz regroupe uniquement ses questions.", "افتح الدرس: يجمع تبويب الاختبار أسئلته فقط."] },
  { s: ["Je veux connaître mon niveau", "أريد معرفة مستواي"], pose: "timer", mode: ["Examen blanc", "امتحان تجريبي"], why: ["40 questions au chrono, sans correction avant la fin : ton vrai score.", "40 سؤالا بتوقيت، بدون تصحيح قبل النهاية: نتيجتك الحقيقية."] },
];

function PickerDemo() {
  const { t } = useLang();
  const p = usePick();
  const [i, setI] = useState<number | null>(null);
  const r = i === null ? null : PICKER[i];
  return (
    <div>
      <div className="space-y-2">
        {PICKER.map((x, k) => (
          <button key={x.s[0]} onClick={() => setI(k)} className="duo-tile flex min-h-[46px] w-full items-center px-3 py-2 text-start text-[15px] font-[700]" data-state={i === k ? "selected" : undefined} aria-pressed={i === k}>
            {p(x.s)}
          </button>
        ))}
      </div>
      {r && (
        <div key={i} className="duo-card animate-pop mt-3 flex items-center gap-3 p-3.5">
          <Mascot pose={r.pose} size={70} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-[800] uppercase tracking-wide text-[var(--duo-blue)]">{t("Ouvre", "افتح")}</p>
            <p className="text-[17px] font-[800] leading-tight text-[var(--duo-ink)]">{p(r.mode)}</p>
            <p className="mt-1 text-[14px] font-[500] leading-snug text-[var(--duo-muted)]">{p(r.why)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Boîtes de Leitner ───────────── */
const WHEN: L[] = [
  ["", ""],
  ["Elle revient demain.", "يعود غدا."],
  ["Elle revient dans 2 jours.", "يعود بعد يومين."],
  ["Elle revient dans 4 jours.", "يعود بعد 4 أيام."],
  ["Elle revient dans 8 jours.", "يعود بعد 8 أيام."],
  ["Maîtrisée : elle ne revient plus.", "متقن: لن يعود بعد الآن."],
];

function LeitnerDemo() {
  const { t } = useLang();
  const p = usePick();
  const [box, setBox] = useState(1);
  const [last, setLast] = useState<boolean | null>(null);
  return (
    <div className="duo-card p-4">
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((b) => (
          <div key={b} className={cx("relative grid h-[76px] place-items-center rounded-[12px] border-2 transition-colors", b === box ? (b === 5 ? "border-[var(--duo-green)] bg-[var(--duo-green-50)]" : "border-[var(--duo-blue)] bg-[var(--duo-blue-50)]") : "border-[var(--duo-grey)] bg-white")}>
            <span className="absolute top-1 text-[11px] font-[800] text-[var(--duo-muted)]">{b === 5 ? "★" : b}</span>
            {b === box && <img src={asset("/icons/first-step.webp")} alt="" className="duo-pop-in mt-3 size-9" />}
          </div>
        ))}
      </div>
      <p key={`${box}-${last}`} className="animate-pop mt-3 text-center text-[17px] font-[800] text-[var(--duo-ink)]">
        {p(WHEN[box])}
      </p>
      {box === 5 ? (
        <button onClick={() => { setBox(1); setLast(null); }} className="duo-btn duo-btn-ghost mt-3 w-full !min-h-12">
          <RotateCcw className="size-4" /> {t("Recommencer", "إعادة")}
        </button>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => { setBox(1); setLast(false); }} className="duo-btn duo-btn-red !min-h-12 !px-2">
            <X className="size-5" /> {t("Erreur", "خطأ")}
          </button>
          <button onClick={() => { setBox(Math.min(5, box + 1)); setLast(true); }} className="duo-btn duo-btn-green !min-h-12 !px-2">
            <Check className="size-5" /> {t("Bonne réponse", "جواب صحيح")}
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-[13px] font-[600] text-[var(--duo-muted)]">
        {last === false ? t("Une erreur la renvoie toujours à la boîte 1.", "الخطأ يعيده دائما إلى العلبة 1.") : t("Chaque bonne réponse la fait monter d'une boîte.", "كل جواب صحيح يرفعه علبة واحدة.")}
      </p>
    </div>
  );
}

/* ───────────── Carte mémo ───────────── */
function FlipDemo() {
  const { lang, t } = useLang();
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const it = memoText(MEMO_ITEMS[i], lang);
  return (
    <div>
      <button onClick={() => setFlip((f) => !f)} aria-pressed={flip} className={cx("flex min-h-52 w-full flex-col rounded-[20px] border-2 bg-white p-5 text-start transition-transform active:translate-y-0.5", flip ? "border-[#2980b9]" : "border-[var(--duo-grey)]")}>
        <span className="text-[13px] font-[700] text-[var(--duo-muted)]">{flip ? t("Réponse", "الجواب") : t("Question", "السؤال")}</span>
        <span className="mt-1 text-[18px] font-[800] leading-snug text-[var(--duo-ink)]">{it.q}</span>
        {flip ? (
          <span className="animate-pop mt-3 block space-y-2">
            <span className="block text-[16px] font-[700] leading-relaxed text-[var(--duo-ink)]">{it.a}</span>
            <span className="block rounded-[12px] bg-[#fef9e7] px-3 py-2 text-[14px] font-[600] leading-relaxed text-[#8a5808]">{it.hook}</span>
          </span>
        ) : (
          <span className="mt-auto flex items-center gap-1.5 pt-4 text-[14px] font-[800] text-[var(--duo-blue)]">
            <Eye className="size-4" /> {t("Réfléchis, puis touche pour vérifier", "فكّر، ثم المس للتحقق")}
          </span>
        )}
      </button>
      <button
        onClick={() => {
          setI((i + 7) % MEMO_ITEMS.length);
          setFlip(false);
        }}
        className="duo-btn duo-btn-ghost mt-3 w-full !min-h-12"
      >
        {t("Une autre carte", "بطاقة أخرى")}
      </button>
    </div>
  );
}

/* ───────────── Grades et badges ───────────── */
function BadgesDemo() {
  const { lang, t } = useLang();
  const [i, setI] = useState(0);
  const b = BADGES[i];
  return (
    <div>
      <div className="grid grid-cols-5 gap-1 rounded-[16px] bg-[var(--duo-snow)] p-2">
        {RANKS.map((r) => (
          <div key={r.min} className="text-center">
            <GameIcon name={r.icon} size={38} className="mx-auto" />
            <p className="mt-0.5 text-[11px] font-[800] leading-tight text-[var(--duo-ink)]">{lang === "ar" ? r.ar : r.fr}</p>
            <p className="duo-mono text-[11px] text-[var(--duo-muted)]" dir="ltr">
              {r.min}+
            </p>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[13px] font-[600] text-[var(--duo-muted)]">{t("Ton grade dépend du nombre d'étapes validées.", "تعتمد رتبتك على عدد المراحل المكتملة.")}</p>
      <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-9">
        {BADGES.map((x, k) => (
          <button key={x.id} onClick={() => setI(k)} aria-pressed={i === k} aria-label={lang === "ar" ? x.ar : x.fr} className={cx("grid aspect-square place-items-center rounded-[12px] border-2", i === k ? "border-[#84d8ff] bg-[var(--duo-blue-50)]" : "border-transparent")}>
            <GameIcon name={x.icon} size={46} />
          </button>
        ))}
      </div>
      <div key={i} className="duo-card animate-pop mt-2 p-3.5 text-center">
        <p className="text-[17px] font-[800] text-[var(--duo-ink)]">{lang === "ar" ? b.ar : b.fr}</p>
        <p className="text-[15px] font-[500] text-[var(--duo-muted)]">{lang === "ar" ? b.har : b.hfr}</p>
      </div>
    </div>
  );
}

/* ───────────── Journée type ───────────── */
const DAY: { ic: LucideIcon; t: L; d: L; m: string }[] = [
  { ic: NotebookPen, t: ["Vide tes erreurs du jour", "راجع أخطاء اليوم"], d: ["Mes erreurs, puis Réviser maintenant", "أخطائي، ثم راجع الآن"], m: "5" },
  { ic: MapIcon, t: ["Avance sur le Parcours", "تقدم في المسار"], d: ["2 ou 3 étapes, en lisant le cours express", "مرحلتان أو ثلاث، مع قراءة الدرس السريع"], m: "20" },
  { ic: BookOpen, t: ["Ouvre la fiche si ça coince", "افتح الملخص عند الصعوبة"], d: ["Le bouton livre, en haut de l'unité", "زر الكتاب، في أعلى الوحدة"], m: "5" },
  { ic: Lightbulb, t: ["Fais un test éclair", "أنجز اختبارا سريعا"], d: ["Mémo, 6 cartes au hasard", "المذكرة، 6 بطاقات عشوائية"], m: "3" },
  { ic: ClipboardCheck, t: ["Passe un examen blanc", "اجتز امتحانا تجريبيا"], d: ["De temps en temps, puis chaque jour la dernière semaine", "من حين لآخر، ثم كل يوم في الأسبوع الأخير"], m: "20" },
];

function DayDemo() {
  const { t } = useLang();
  const p = usePick();
  const [done, setDone] = useState<number[]>([]);
  return (
    <ul className="space-y-2">
      {DAY.map(({ ic: Icon, t: title, d, m }, i) => {
        const ok = done.includes(i);
        return (
          <li key={title[0]}>
            <button onClick={() => setDone((x) => (ok ? x.filter((k) => k !== i) : [...x, i]))} aria-pressed={ok} className={cx("flex w-full items-center gap-3 rounded-[16px] border-2 p-3 text-start transition-colors", ok ? "border-[var(--duo-green)] bg-[var(--duo-green-50)]" : "border-[var(--duo-grey)] bg-white")}>
              <span className={cx("grid size-10 shrink-0 place-items-center rounded-[11px]", ok ? "bg-[var(--duo-green)] text-white" : "bg-[var(--duo-blue-50)] text-[var(--duo-blue)]")}>{ok ? <Check className="size-6" strokeWidth={3} /> : <Icon className="size-5" strokeWidth={2.3} />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-[800] leading-tight text-[var(--duo-ink)]">{p(title)}</span>
                <span className="mt-0.5 block text-[13px] font-[500] leading-snug text-[var(--duo-muted)]">{p(d)}</span>
              </span>
              <span className="shrink-0 text-[13px] font-[800] text-[var(--duo-muted)]">{t(`${m} min`, `${m} د`)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ───────────── Contrôle final ───────────── */
const QUIZ: { q: L; o: L[]; a: number }[] = [
  { q: ["Combien de bonnes réponses faut-il à l'examen ?", "كم جوابا صحيحا يجب في الامتحان ؟"], o: [["20 sur 40", "20 من 40"], ["32 sur 40", "32 من 40"], ["40 sur 40", "40 من 40"]], a: 1 },
  { q: ["Dans une étape, si tu te trompes…", "في مرحلة ما، إذا أخطأت…"], o: [["Tu perds un point et la question revient à la fin", "تفقد نقطة ويعود السؤال في النهاية"], ["L'étape s'arrête tout de suite", "تتوقف المرحلة فورا"], ["Il ne se passe rien", "لا يحدث شيء"]], a: 0 },
  { q: ["Où retrouver les questions ratées ?", "أين تجد الأسئلة التي أخطأت فيها ؟"], o: [["Dans le Mémo", "في المذكرة"], ["Dans les Schémas", "في الرسوم"], ["Dans Mes erreurs", "في أخطائي"]], a: 2 },
  { q: ["Une image est trop petite. Que fais-tu ?", "صورة صغيرة جدا. ماذا تفعل ؟"], o: [["Je passe la question", "أتجاوز السؤال"], ["Je la touche pour l'agrandir", "ألمسها لتكبيرها"], ["Je recharge la page", "أعيد تحميل الصفحة"]], a: 1 },
];

function QuizDemo() {
  const { t } = useLang();
  const p = usePick();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  if (i >= QUIZ.length) {
    return (
      <div className="duo-card animate-pop p-5 text-center">
        <Mascot pose={score === QUIZ.length ? "excellent" : "thumbs"} size={120} className="mx-auto" />
        <p className="duo-h mt-2 text-[34px] leading-none" dir="ltr">
          {score} / {QUIZ.length}
        </p>
        <p className="mt-2 text-[16px] font-[700] text-[var(--duo-muted)]">{score === QUIZ.length ? t("Parfait, tu es prêt à prendre la route !", "ممتاز، أنت مستعد للانطلاق !") : t("C'est bien ! Tu peux revoir un chapitre depuis le Sommaire.", "جيد ! يمكنك مراجعة أي فصل من المحتوى.")}</p>
        <button
          onClick={() => {
            setI(0);
            setPicked(null);
            setScore(0);
          }}
          className="duo-btn duo-btn-ghost mt-4 w-full !min-h-12"
        >
          <RotateCcw className="size-4" /> {t("Rejouer", "إعادة")}
        </button>
      </div>
    );
  }
  const q = QUIZ[i];
  return (
    <div key={i} className="animate-pop">
      <p className="text-[13px] font-[800] uppercase tracking-wide text-[var(--duo-muted)]">
        {t("Question", "السؤال")} {i + 1} / {QUIZ.length}
      </p>
      <p className="mt-1 text-[18px] font-[800] leading-snug text-[var(--duo-ink)]">{p(q.q)}</p>
      <div className="mt-3 space-y-2">
        {q.o.map((o, k) => {
          const st = picked === null ? undefined : k === q.a ? (picked === k ? "correct" : "missed") : picked === k ? "wrong" : undefined;
          return (
            <button
              key={k}
              disabled={picked !== null}
              data-state={st}
              className="duo-tile flex min-h-[50px] w-full items-center px-3 py-2 text-start text-[15px] font-[700] leading-snug"
              onClick={() => {
                setPicked(k);
                if (k === q.a) setScore((s) => s + 1);
              }}
            >
              {p(o)}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button
          onClick={() => {
            setI(i + 1);
            setPicked(null);
          }}
          className="duo-btn duo-btn-blue mt-3 w-full !min-h-11"
        >
          {t("Suivant", "التالي")}
        </button>
      )}
    </div>
  );
}

export function Demo({ id, go }: { id: DemoId; go: (ch: string) => void }) {
  const view = useMemo(() => {
    switch (id) {
      case "lang": return <LangDemo />;
      case "score": return <ScoreDemo />;
      case "map": return <MapDemo go={go} />;
      case "nodes": return <NodesDemo />;
      case "lesson": return <LessonDemo />;
      case "zoom": return <ZoomDemo />;
      case "reveal": return <RevealDemo />;
      case "picker": return <PickerDemo />;
      case "leitner": return <LeitnerDemo />;
      case "flip": return <FlipDemo />;
      case "badges": return <BadgesDemo />;
      case "day": return <DayDemo />;
      case "quiz": return <QuizDemo />;
    }
  }, [id, go]);
  return view;
}
