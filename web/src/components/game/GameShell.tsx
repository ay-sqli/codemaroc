"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BookOpen, ClipboardCheck, Gauge, LayoutDashboard, Lightbulb, Map as MapIcon, NotebookPen, Shapes, ShieldCheck, Target, CircleUserRound, CloudCheck, Download, Upload } from "lucide-react";
import { useSession } from "@/lib/session";
import { useSyncStatus } from "@/components/CloudSync";
import { downloadBackup, importState, streak, today, useStore } from "@/lib/store";
import { useBank } from "@/lib/questions";
import { buildPath, dailyQuests, type GamePath } from "@/lib/game";
import type { GameState } from "@/lib/store";
import { fmtDate, useLang } from "@/lib/i18n";
import { cx } from "@/components/ui";
import { LangSwitch, Wordmark } from "@/components/Chrome";
import { GameIcon, type IconName } from "./GameIcon";

function useDueCount() {
  const srs = useStore((s) => s.srs);
  const [now] = useState(() => Date.now());
  return useMemo(() => Object.values(srs).filter((i) => i.box < 5 && i.due <= now).length, [srs, now]);
}

/** Chiffres du joueur : série de jours, XP, étapes validées. */
export function useGameStats() {
  const days = useStore((s) => s.days);
  const game = useStore((s) => s.game);
  const { bank } = useBank();
  const path = bank ? buildPath(bank) : null;
  const done = path ? path.flat.filter((n) => game.done[n.id]).length : Object.keys(game.done).length;
  return { streak: streak(days), xp: game.xp, done, total: path?.flat.length ?? 0, game };
}

export function StatsRow({ className }: { className?: string }) {
  const { t } = useLang();
  const s = useGameStats();
  return (
    <div className={cx("flex items-center justify-between gap-2", className)} dir="ltr">
      <span className="flex items-center gap-1 text-[var(--duo-orange)]" title={t("Jours d'affilée", "أيام متتالية")}>
        <GameIcon name="flame" size={30} dim={!s.streak} />
        <span className={cx("duo-mono text-[17px] font-[700]", !s.streak && "text-[var(--duo-grey-d)]")}>{s.streak}</span>
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-yellow-d)]" title="XP">
        <GameIcon name="xp" size={30} />
        <span className="duo-mono text-[17px] font-[700]">{s.xp}</span>
      </span>
      <span className="flex items-center gap-1 text-[var(--duo-yellow-d)]" title={t("Étapes validées", "المراحل المكتملة")}>
        <GameIcon name="crown" size={30} />
        <span className="duo-mono text-[17px] font-[700]">
          {s.done}
          {s.total ? <span className="text-[13px] text-[var(--duo-grey-d)]">/{s.total}</span> : null}
        </span>
      </span>
    </div>
  );
}

export function QuestsCard() {
  const { lang, t } = useLang();
  const game = useStore((s) => s.game);
  const [day] = useState(today);
  const quests = dailyQuests(game, day);
  return (
    <section className="duo-card p-5">
      <h2 className="duo-h mb-4 text-xl">{t("Défis du jour", "تحديات اليوم")}</h2>
      <ul className="space-y-5">
        {quests.map((q) => {
          const ok = q.value >= q.goal;
          return (
            <li key={q.id} className="flex items-center gap-3">
              <GameIcon name={q.id === "xp" ? "xp" : q.id === "combo" ? "flame" : "crown"} size={38} />
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[15px] font-[800]">{lang === "ar" ? q.ar : q.fr}</p>
                <div className="flex items-center gap-2">
                  <div className="duo-progress relative flex-1 !h-4">
                    <span style={{ width: `${Math.min(100, (q.value / q.goal) * 100)}%`, background: "var(--duo-yellow)" }} />
                    <em className="absolute inset-0 grid place-items-center text-[11px] not-italic text-[var(--duo-muted)]" dir="ltr">
                      {Math.min(q.value, q.goal)} / {q.goal}
                    </em>
                  </div>
                  <GameIcon name={ok ? "chest-open" : "chest"} size={32} dim={!ok && q.value === 0} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[13px] font-semibold text-[var(--duo-muted)]">{t("Les défis se renouvellent chaque jour.", "تتجدد التحديات كل يوم.")}</p>
    </section>
  );
}

/** Badges à débloquer le long de la route. */
interface BadgeDef {
  id: string;
  icon: IconName;
  fr: string;
  ar: string;
  hfr: string;
  har: string;
  ok: (g: GameState, p: GamePath, streakDays: number) => boolean;
}
const sectionDone = (g: GameState, p: GamePath, id: string) => !!p.sections.find((s) => s.id === id)?.units.every((u) => u.nodes.every((n) => g.done[n.id]));
const unitDone = (g: GameState, p: GamePath, slug: string) => !!p.sections.flatMap((s) => s.units).find((u) => u.chapter.slug === slug)?.nodes.every((n) => g.done[n.id]);
const nDone = (g: GameState) => Object.keys(g.done).length;
export const BADGES: BadgeDef[] = [
  { id: "first", icon: "first-step", fr: "Premier pas", ar: "الخطوة الأولى", hfr: "Valide ta première étape", har: "أكمل مرحلتك الأولى", ok: (g) => nDone(g) >= 1 },
  { id: "walker", icon: "walker-bronze", fr: "Bon marcheur", ar: "سائر جيد", hfr: "Valide 25 étapes", har: "أكمل 25 مرحلة", ok: (g) => nDone(g) >= 25 },
  { id: "learner", icon: "learner", fr: "Apprenti « L »", ar: "متعلم « L »", hfr: "Termine la section « La route »", har: "أكمل قسم « الطريق »", ok: (g, p) => sectionDone(g, p, "01") },
  { id: "speed", icon: "speed90", fr: "Maître de la vitesse", ar: "سيد السرعة", hfr: "Termine l'unité « La vitesse »", har: "أكمل وحدة « السرعة »", ok: (g, p) => unitDone(g, p, "03_vitesse") },
  { id: "mountain", icon: "mountain", fr: "Route de l'Atlas", ar: "طريق الأطلس", hfr: "Termine la section « Le conducteur »", har: "أكمل قسم « السائق »", ok: (g, p) => sectionDone(g, p, "03") },
  { id: "streak", icon: "flame", fr: "Une semaine de feu", ar: "أسبوع من النار", hfr: "Révise 7 jours d'affilée", har: "راجع 7 أيام متتالية", ok: (_g, _p, d) => d >= 7 },
  { id: "gold", icon: "walker-gold", fr: "Marathonien", ar: "عدّاء ماراثون", hfr: "Valide 100 étapes", har: "أكمل 100 مرحلة", ok: (g) => nDone(g) >= 100 },
  { id: "wheel", icon: "wheel", fr: "Volant d'or", ar: "المقود الذهبي", hfr: "Termine 3 sections", har: "أكمل 3 أقسام", ok: (g, p) => p.sections.filter((s) => sectionDone(g, p, s.id)).length >= 3 },
  { id: "champion", icon: "champion", fr: "Champion du code", ar: "بطل مدونة السير", hfr: "Atteins le sommet", har: "اصعد إلى القمة", ok: (g, p) => !!g.done[p.summit.id] },
];

export function BadgesCard() {
  const { lang, t } = useLang();
  const game = useStore((s) => s.game);
  const days = useStore((s) => s.days);
  const { bank } = useBank();
  if (!bank) return null;
  const p = buildPath(bank);
  const d = streak(days);
  const got = BADGES.filter((b) => b.ok(game, p, d)).length;
  return (
    <section className="duo-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="duo-h text-xl">{t("Mes badges", "شاراتي")}</h2>
        <span className="duo-mono text-[14px] font-[700] text-[var(--duo-muted)]">
          {got}/{BADGES.length}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const ok = b.ok(game, p, d);
          return (
            <li key={b.id} className="text-center" title={lang === "ar" ? b.har : b.hfr}>
              <GameIcon name={b.icon} size={60} dim={!ok} className="mx-auto" />
              <p className={cx("mt-1 text-[12px] font-[800] leading-tight", ok ? "text-[var(--duo-ink)]" : "text-[var(--duo-grey-d)]")}>{lang === "ar" ? b.ar : b.fr}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Sauvegarde : la progression est enregistrée automatiquement dans le navigateur à chaque réponse.
 * Le fichier de sauvegarde protège contre un nettoyage du navigateur et permet de changer d'appareil.
 */
export function BackupCard() {
  const { lang, t } = useLang();
  const sync = useSyncStatus();
  const last = useStore((s) => s.game.lastBackup);
  const nDone = useStore((s) => Object.keys(s.game.done).length);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section className="duo-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <CloudCheck className="size-7 text-[var(--duo-green)]" />
        <h2 className="duo-h text-xl">{t("Ta progression", "تقدمك")}</h2>
      </div>
      <p className="text-[14px] font-semibold text-[var(--duo-muted)]">
        {t(
          "Sauvegardée automatiquement dans ton compte après chaque réponse : tu la retrouves sur tous tes appareils.",
          "يُحفظ تلقائيا في حسابك بعد كل جواب: تجده على كل أجهزتك.",
        )}
      </p>
      <p className="mt-2 text-[13px] font-[800] text-[var(--duo-grey-d)]">
        {sync.s === "saved" && sync.at
          ? `${t("Dernière sauvegarde :", "آخر حفظ:")} ${fmtDate(sync.at, lang, { hour: "2-digit", minute: "2-digit" })}`
          : sync.s === "error" || sync.s === "offline"
            ? t("Hors ligne : sauvegarde dès le retour du réseau", "غير متصل: سيتم الحفظ عند عودة الشبكة")
            : last
              ? `${t("Dernière copie :", "آخر نسخة:")} ${fmtDate(last, lang, { day: "numeric", month: "long" })}`
              : nDone
                ? null
                : null}
      </p>
      <p className="mt-2 text-[12px] font-semibold text-[var(--duo-muted)]">{t("Copie de secours (fichier) :", "نسخة احتياطية (ملف):")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => downloadBackup()} className="duo-btn duo-btn-blue !min-h-11 !px-3 !text-[13px]">
          <Download className="size-4" /> {t("Copie", "نسخة")}
        </button>
        <button onClick={() => file.current?.click()} className="duo-btn duo-btn-ghost !min-h-11 !px-3 !text-[13px]">
          <Upload className="size-4" /> {t("Restaurer", "استرجاع")}
        </button>
      </div>
      {msg && <p className="mt-3 text-[14px] font-[800] text-[var(--duo-green)]">{msg}</p>}
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            importState(await f.text());
            setMsg(t("Progression restaurée !", "تم استرجاع التقدم !"));
          } catch {
            setMsg(t("Fichier invalide.", "ملف غير صالح."));
          }
        }}
      />
    </section>
  );
}

function ProgressCard() {
  const { t } = useLang();
  const s = useGameStats();
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  return (
    <section className="duo-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="duo-h text-xl">{t("Vers le sommet", "نحو القمة")}</h2>
        <span className="text-[15px] font-[800] text-[var(--duo-green)]" dir="ltr">
          {pct} %
        </span>
      </div>
      <div className="duo-progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[14px] font-semibold text-[var(--duo-muted)]">
        {t(
          "Chaque étape validée débloque la suivante. Au sommet : l'examen final de 40 questions.",
          "كل مرحلة تكملها تفتح التي بعدها. في القمة: الامتحان النهائي من 40 سؤالا.",
        )}
      </p>
    </section>
  );
}

function Avatar({ name, size = "size-10 text-[16px]" }: { name: string; size?: string }) {
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-full bg-[#d92b2b] font-[900] text-white shadow-[0_3px_0_#a81c1c]", size)} style={{ fontFamily: "var(--font-display)" }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Accès au profil en bas de la barre latérale : avatar, nom, grade. */
function ProfileChip({ active }: { active: boolean }) {
  const { t } = useLang();
  const { user } = useSession();
  const s = useGameStats();
  if (!user) return null;
  return (
    <Link
      href="/profil/"
      title={t("Mon profil", "ملفي")}
      className={cx(
        "flex items-center justify-center gap-3 rounded-[14px] border-2 p-2 lg:justify-start",
        active ? "border-[#84d8ff] bg-[var(--duo-blue-50)]" : "border-transparent hover:bg-[var(--duo-snow)]",
      )}
    >
      <Avatar name={user.name} />
      <span className="hidden min-w-0 flex-1 lg:block">
        <span className="block truncate text-[15px] font-[800] text-[var(--duo-ink)]">{user.name}</span>
        <span className="block truncate text-[12px] font-[700] text-[var(--duo-muted)]">
          {t("Mon profil", "ملفي")} · {s.done}/{s.total || "…"}
        </span>
      </span>
    </Link>
  );
}

export function GameShell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const session = useSession();
  const path = usePathname() || "/";
  const due = useDueCount();
  const nav = [
    { href: "/", label: t("Parcours", "المسار"), icon: MapIcon },
    { href: "/cours/", label: t("Cours", "الدروس"), icon: BookOpen },
    { href: "/entrainement/", label: t("S'entraîner", "التمرن"), icon: Target },
    { href: "/examen/", label: t("Examen blanc", "امتحان تجريبي"), icon: ClipboardCheck },
    { href: "/erreurs/", label: t("Mes erreurs", "أخطائي"), icon: NotebookPen, badge: due },
    { href: "/schemas/", label: t("Schémas", "الرسوم"), icon: Shapes },
    { href: "/memo/", label: t("Mémo", "المذكرة"), icon: Lightbulb },
    { href: "/tableau-de-bord/", label: t("Tableau de bord", "لوحة القيادة"), icon: LayoutDashboard },
    { href: "/progression/", label: t("Progression", "التقدم"), icon: Gauge },
    { href: "/profil/", label: t("Mon profil", "ملفي"), icon: CircleUserRound },
    ...(session.user?.role === "admin" ? [{ href: "/admin/", label: t("Back-office", "لوحة الإدارة"), icon: ShieldCheck }] : []),
  ];
  const mobile = [nav[0], nav[1], nav[3], nav[4], nav[9]];
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));
  // Le parcours a sa colonne de droite (chiffres, défis du jour) ; les autres pages prennent toute la largeur.
  const home = path === "/";
  // Pendant un quiz, la barre d'actions du quiz occupe le bas de l'écran mobile.
  const inQuiz = path.startsWith("/entrainement/session");

  return (
    <div className="duo min-h-dvh bg-[var(--duo-canvas)]">
      {/* Barre latérale (ordinateur / tablette) */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[88px] flex-col border-e-2 border-[var(--duo-grey)] bg-white px-3 py-6 md:flex lg:w-64 lg:px-4">
        <Link href="/" className="mb-6 px-2 lg:px-4" aria-label={t("Parcours", "المسار")}>
          <Wordmark compact className="lg:hidden" />
          <Wordmark className="max-lg:hidden" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={cx(
                "relative flex h-12 items-center justify-center gap-4 rounded-[12px] border-2 px-3 text-[15px] font-[800] uppercase tracking-wide lg:justify-start",
                active(href) ? "border-[#84d8ff] bg-[var(--duo-blue-50)] text-[var(--duo-blue)]" : "border-transparent text-[var(--duo-muted)] hover:bg-[var(--duo-snow)]",
              )}
            >
              <Icon className="size-7 shrink-0" strokeWidth={2.2} />
              <span className="hidden truncate lg:inline">{label}</span>
              {!!badge && (
                <span className="absolute end-2 top-1.5 grid min-w-5 place-items-center rounded-full bg-[var(--duo-red)] px-1 text-[11px] text-white lg:static lg:ms-auto">{badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-3 border-t-2 border-[var(--duo-grey)] pt-3">
          <ProfileChip active={active("/profil/")} />
          <div className="hidden px-3 pt-1 lg:block">
            <LangSwitch className="px-0" />
          </div>
        </div>
      </aside>

      <div className="md:ps-[88px] lg:ps-64">
        {/* Barre du haut (mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-2 border-[var(--duo-grey)] bg-white px-4 md:hidden">
          <StatsRow className="min-w-0 flex-1" />
          {/* Petits écrans : le globe seul, pour laisser la place à l'avatar. */}
          <LangSwitch className="!h-9 shrink-0 px-0 max-[480px]:[&>span]:hidden" />
          <Link href="/profil/" aria-label={t("Mon profil", "ملفي")} className="shrink-0">
            <Avatar name={session.user?.name ?? "?"} size="size-9 text-[15px]" />
          </Link>
        </header>
        {home ? (
          <div className="mx-auto flex max-w-[1060px] justify-center gap-12 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
            <main className="w-full max-w-[600px] min-w-0">{children}</main>
            <aside className="duo-side-scroll sticky top-0 hidden max-h-dvh w-[352px] shrink-0 space-y-6 self-start overflow-y-auto overscroll-contain px-1.5 pb-8 pt-6 xl:-mt-6 xl:block">
              <StatsRow className="px-2" />
              <ProgressCard />
              <QuestsCard />
              <BadgesCard />
              <BackupCard />
            </aside>
          </div>
        ) : (
          <main className={cx("mx-auto w-full max-w-[1100px] min-w-0 px-4 pt-6 sm:px-6 lg:pt-8", inQuiz ? "pb-32" : "pb-28 md:pb-12")}>{children}</main>
        )}
      </div>

      {/* Onglets (mobile) */}
      <nav className={cx("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-[var(--duo-grey)] bg-white pb-[env(safe-area-inset-bottom)] md:hidden", inQuiz && "hidden")}>
        {mobile.map(({ href, label, icon: Icon, badge }) => (
          <Link key={href} href={href} aria-label={label} className="relative grid place-items-center py-2.5">
            <span className={cx("grid size-11 place-items-center rounded-[12px] border-2", active(href) ? "border-[#84d8ff] bg-[var(--duo-blue-50)] text-[var(--duo-blue)]" : "border-transparent text-[var(--duo-muted)]")}>
              <Icon className="size-6" strokeWidth={2.2} />
            </span>
            {!!badge && <span className="absolute end-[22%] top-1.5 grid min-w-5 place-items-center rounded-full bg-[var(--duo-red)] px-1 text-[11px] text-white">{badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
