"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, ChevronDown, ClipboardCheck, Gauge, Globe, Home, Lightbulb, Menu, NotebookPen, Search, Shapes, Target, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { CHAPTERS, MODULES, altNameOf, nameOf } from "@/lib/courses";
import { LangSync, useLang } from "@/lib/i18n";
import { ButtonLink, CountDot, IconButton, ModuleIcon, cx } from "./ui";
import { ImageZoom } from "./ImageZoom";

function useDueCount() {
  const srs = useStore((s) => s.srs);
  const [now] = useState(() => Date.now());
  return useMemo(() => Object.values(srs).filter((i) => i.box < 5 && i.due <= now).length, [srs, now]);
}

/** Logo textuel de l'application. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span dir="ltr" className={cx("inline-flex items-baseline gap-1 font-[family-name:var(--font-source)] text-[26px] font-semibold leading-none tracking-[-0.02em] text-brand", className)}>
      codemaroc
      <span className="rounded-[3px] bg-brand px-1 py-0.5 text-[11px] font-bold leading-none tracking-normal text-white">B</span>
    </span>
  );
}

/** Bouton de changement de langue (FR ⇄ AR). */
export function LangSwitch({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const { lang, setLang } = useLang();
  const next = lang === "ar" ? "fr" : "ar";
  return (
    <button
      onClick={() => setLang(next)}
      aria-label={next === "ar" ? "Afficher le site en arabe" : "عرض الموقع بالفرنسية"}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[4px] text-sm font-semibold",
        tone === "dark" ? "text-white/85 hover:text-white" : "h-10 px-2 text-ink-2 hover:text-brand",
        className,
      )}
    >
      <Globe className="size-4" />
      <span lang={next} className={next === "ar" ? "font-[family-name:var(--font-arabic)]" : "font-[family-name:var(--font-source)]"}>
        {next === "ar" ? "العربية" : "Français"}
      </span>
    </button>
  );
}

/* ─────────────────────────── Recherche de chapitres ─────────────────────────── */
function HeaderSearch({ onDone }: { onDone?: () => void }) {
  const { lang, t } = useLang();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return CHAPTERS.filter((c) => c.fr.toLowerCase().includes(n) || c.ar.includes(q.trim()) || c.slug.includes(n)).slice(0, 7);
  }, [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const go = (slug: string) => {
    router.push(`/cours/${slug}/`);
    setQ("");
    setOpen(false);
    onDone?.();
  };
  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) go(results[0].slug);
          else router.push("/cours/");
        }}
        className="flex h-11 items-center rounded-full border border-line-strong bg-white ps-4 pe-1 focus-within:border-brand"
      >
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("Que veux-tu réviser ?", "ماذا تريد أن تراجع ؟")}
          aria-label={t("Rechercher un chapitre", "البحث عن درس")}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button type="submit" aria-label={t("Rechercher", "بحث")} className="grid size-9 place-items-center rounded-full bg-brand text-white hover:bg-brand-2">
          <Search className="size-4" />
        </button>
      </form>
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-[8px] border border-line bg-white shadow-lg">
          {results.length ? (
            results.map((c) => (
              <button key={c.slug} onClick={() => go(c.slug)} className="flex w-full items-center gap-3 px-4 py-2.5 text-start hover:bg-panel">
                <ModuleIcon id={c.module} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-ink">{nameOf(c, lang)}</span>
                  <span className="block truncate text-xs text-muted">{altNameOf(c, lang)}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted">
              {t("Aucun chapitre trouvé. Essaie « priorité », « vitesse », « points »…", "لم يتم العثور على أي درس. جرّب « الأسبقية »، « السرعة »، « النقط »…")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Menu « Explorer » ─────────────────────────── */
function ExploreMenu() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [mod, setMod] = useState(MODULES[0].id);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const [seenPath, setSeenPath] = useState(path);
  if (seenPath !== path) {
    setSeenPath(path);
    setOpen(false);
  }
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const m = MODULES.find((x) => x.id === mod)!;
  return (
    <div ref={ref} className="relative">
      <button
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx("inline-flex h-10 items-center gap-1 rounded-[4px] px-2 text-[15px] text-ink-2 hover:text-brand", open && "text-brand")}
      >
        {t("Explorer", "استكشف")} <ChevronDown className={cx("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute start-0 top-12 z-50 flex w-[760px] overflow-hidden rounded-[8px] border border-line bg-white shadow-lg">
          <div className="w-64 shrink-0 border-e border-line bg-white py-3">
            <p className="t-overline px-4 pb-2">{t("Axes de formation", "محاور التكوين")}</p>
            {MODULES.map((x) => (
              <button
                key={x.id}
                onMouseEnter={() => setMod(x.id)}
                onClick={() => setMod(x.id)}
                className={cx("flex w-full items-center gap-3 px-4 py-2 text-start text-[15px]", x.id === mod ? "bg-panel text-brand" : "text-ink-2 hover:bg-panel")}
              >
                <ModuleIcon id={x.id} />
                {nameOf(x, lang)}
              </button>
            ))}
            <div className="mx-4 my-3 border-t border-line" />
            <p className="t-overline px-4 pb-2">{t("Outils", "أدوات")}</p>
            {[
              { href: "/schemas/", label: t("Schémas interactifs", "رسوم تفاعلية") },
              { href: "/memo/", label: t("Mémo & astuces", "مذكرة وحيل للحفظ") },
              { href: "/examen/", label: t("Examen blanc", "امتحان تجريبي") },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="block px-4 py-2 text-[15px] text-ink-2 hover:bg-panel hover:text-brand">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="t-h4">{nameOf(m, lang)}</p>
              <Link href={`/cours/?axe=${m.id}`} className="link text-sm">
                {t("Voir l'axe", "عرض المحور")}
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {m.chapters.map((c) => (
                <li key={c.slug}>
                  <Link href={`/cours/${c.slug}/`} className="block truncate py-1.5 text-sm text-ink-2 hover:text-brand hover:underline">
                    {nameOf(c, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Pied de page ─────────────────────────── */
function Footer() {
  const { lang, t } = useLang();
  return (
    <footer className="mt-16 border-t border-line bg-foot">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="mb-3 text-base font-semibold">{t("Axes de formation", "محاور التكوين")}</p>
          <ul className="space-y-2 text-sm">
            {MODULES.map((m) => (
              <li key={m.id}>
                <Link href={`/cours/?axe=${m.id}`} className="text-ink-2 hover:text-brand hover:underline">
                  {nameOf(m, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-base font-semibold">{t("S'entraîner", "التمرن")}</p>
          <ul className="space-y-2 text-sm">
            {[
              ["/entrainement/session/?mode=mix", t("Session du jour", "حصة اليوم")],
              ["/entrainement/session/?mode=official", t("Questions officielles", "الأسئلة الرسمية")],
              ["/entrainement/session/?mode=rules", t("Règles et chiffres", "القواعد والأرقام")],
              ["/entrainement/session/?mode=signs", t("Panneaux", "العلامات")],
              ["/examen/", t("Examen blanc", "امتحان تجريبي")],
            ].map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="text-ink-2 hover:text-brand hover:underline">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-base font-semibold">{t("Outils", "أدوات")}</p>
          <ul className="space-y-2 text-sm">
            {[
              ["/erreurs/", t("Carnet d'erreurs", "دفتر الأخطاء")],
              ["/schemas/", t("Schémas interactifs", "رسوم تفاعلية")],
              ["/memo/", t("Mémo & astuces", "مذكرة وحيل للحفظ")],
              ["/progression/", t("Progression et sauvegarde", "التقدم والحفظ")],
              ["/design-system/", t("Design system", "نظام التصميم")],
            ].map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="text-ink-2 hover:text-brand hover:underline">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-base font-semibold">{t("À propos", "حول الموقع")}</p>
          <p className="text-sm leading-relaxed text-ink-2">
            {t(
              "Outil de révision personnel construit à partir des cours de la plateforme Perminou-NARSA. Les corrigés des questions sont rédigés pour l'entraînement et peuvent être signalés en cas de doute.",
              "أداة مراجعة شخصية مبنية على دروس منصة Perminou التابعة للوكالة الوطنية للسلامة الطرقية (NARSA). تصحيحات الأسئلة محررة لغرض التمرن، ويمكن الإبلاغ عنها في حالة الشك.",
            )}
          </p>
          <LangSwitch className="mt-3 px-0" />
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-5 text-xs text-muted sm:px-6">
          © 2026 codemaroc · {t("Préparation à l'examen théorique du permis B", "التحضير للامتحان النظري لرخصة السياقة صنف ب")}
        </p>
      </div>
    </footer>
  );
}

/** « 3 jours » / « 3 أيام » */
export function daysLabel(n: number, lang: "fr" | "ar") {
  if (lang === "ar") return n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يوما`;
  return `${n} jour${n > 1 ? "s" : ""}`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, t } = useLang();
  const path = usePathname() || "/";
  const due = useDueCount();
  const examDate = useStore((s) => s.settings.examDate);
  const [drawer, setDrawer] = useState(false);
  const [seenPath, setSeenPath] = useState(path);
  if (seenPath !== path) {
    setSeenPath(path);
    setDrawer(false);
  }
  const [now] = useState(() => Date.now());
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));
  const days = examDate ? Math.ceil((new Date(examDate).getTime() - now) / 86_400_000) : null;
  const inQuiz = path.startsWith("/entrainement/session");

  const topLinks = [
    { href: "/", label: t("Accueil", "الرئيسية") },
    { href: "/cours/", label: t("Cours", "الدروس") },
    { href: "/entrainement/", label: t("S'entraîner", "التمرن") },
    { href: "/examen/", label: t("Examen blanc", "امتحان تجريبي") },
  ];
  const mobileTabs = [
    { href: "/", label: t("Accueil", "الرئيسية"), icon: Home },
    { href: "/cours/", label: t("Cours", "الدروس"), icon: BookOpen },
    { href: "/entrainement/", label: t("S'entraîner", "التمرن"), icon: Target },
    { href: "/examen/", label: t("Examen", "الامتحان"), icon: ClipboardCheck },
    { href: "/erreurs/", label: t("Erreurs", "الأخطاء"), icon: NotebookPen, badge: true },
  ];
  const drawerLinks: [string, string, typeof Home][] = [
    ["/", t("Accueil", "الرئيسية"), Home],
    ["/cours/", t("Tous les cours", "جميع الدروس"), BookOpen],
    ["/entrainement/", t("S'entraîner", "التمرن"), Target],
    ["/examen/", t("Examen blanc", "امتحان تجريبي"), ClipboardCheck],
    ["/erreurs/", t("Carnet d'erreurs", "دفتر الأخطاء"), NotebookPen],
    ["/schemas/", t("Schémas interactifs", "رسوم تفاعلية"), Shapes],
    ["/memo/", t("Mémo & astuces", "مذكرة وحيل للحفظ"), Lightbulb],
    ["/progression/", t("Progression", "التقدم"), Gauge],
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <LangSync />
      <ImageZoom />
      {/* Bandeau supérieur sombre */}
      <div className="hidden bg-[#1f1f1f] text-white md:block">
        <div className="mx-auto flex h-9 max-w-[1200px] items-stretch justify-between px-4 sm:px-6">
          <nav className="flex items-stretch gap-6 text-sm">
            {topLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cx(
                  "flex items-center border-b-[3px] pt-[3px] transition-colors",
                  active(l.href) ? "border-white font-semibold text-white" : "border-transparent text-white/75 hover:text-white",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 text-sm text-white/75">
            {days !== null && days >= 0 ? (
              <span>
                {t("Examen dans", "الامتحان بعد")} <b className="font-semibold text-white">{daysLabel(days, lang)}</b>
              </span>
            ) : (
              <Link href="/progression/" className="hover:text-white">
                {t("Fixer la date de mon examen", "حدد تاريخ امتحاني")}
              </Link>
            )}
            <LangSwitch tone="dark" />
          </div>
        </div>
      </div>

      {/* En-tête principal */}
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          <IconButton label={t("Menu", "القائمة")} className="-ms-2 lg:hidden" onClick={() => setDrawer(true)}>
            <Menu className="size-6" />
          </IconButton>
          <Link href="/" aria-label={t("Accueil", "الرئيسية")} className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden lg:block">
            <ExploreMenu />
          </div>
          <Link href="/schemas/" className="hidden h-10 items-center rounded-[4px] px-2 text-[15px] text-ink-2 hover:text-brand xl:inline-flex">
            {t("Schémas", "الرسوم")}
          </Link>
          <div className="hidden max-w-[440px] flex-1 md:block">
            <HeaderSearch />
          </div>
          <div className="ms-auto flex items-center gap-1 sm:gap-3">
            <Link href="/memo/" className="hidden h-10 items-center gap-1.5 rounded-[4px] px-2 text-[15px] text-ink-2 hover:text-brand lg:inline-flex">
              <Lightbulb className="size-4" /> {t("Mémo", "المذكرة")}
            </Link>
            <Link
              href="/erreurs/"
              className="relative hidden h-10 items-center gap-1.5 rounded-[4px] px-2 text-[15px] text-ink-2 hover:text-brand sm:inline-flex"
            >
              <NotebookPen className="size-4" /> {t("Mes erreurs", "أخطائي")}
              <CountDot n={due} />
            </Link>
            <Link href="/progression/" className="hidden h-10 items-center gap-1.5 rounded-[4px] px-2 text-[15px] text-brand hover:underline lg:inline-flex">
              <Gauge className="size-4" /> {t("Progression", "التقدم")}
            </Link>
            <LangSwitch className="md:hidden" />
            <ButtonLink href="/examen/" variant="secondary" size="md" className="max-sm:hidden">
              {t("Examen blanc", "امتحان تجريبي")}
            </ButtonLink>
          </div>
        </div>
      </header>
      {/* Recherche mobile hors de l'en-tête collant : il garde 68 px de haut (onglets collants dessous) et libère l'écran au défilement. */}
      <div className="relative z-30 border-b border-line bg-white px-4 py-2 md:hidden">
        <HeaderSearch />
      </div>

      {/* Tiroir mobile */}
      {drawer && (
        <div className="fixed inset-0 z-[60] bg-[#1f1f1f]/50 lg:hidden" onClick={() => setDrawer(false)}>
          <aside className="animate-pop h-full w-[85%] max-w-sm overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-[68px] items-center justify-between border-b border-line px-4">
              <Wordmark />
              <IconButton label={t("Fermer le menu", "إغلاق القائمة")} onClick={() => setDrawer(false)}>
                <X className="size-6" />
              </IconButton>
            </div>
            <nav className="py-2">
              {drawerLinks.map(([h, l, Icon]) => (
                <Link
                  key={h}
                  href={h}
                  className={cx("flex items-center gap-3 px-5 py-3 text-[15px]", active(h) ? "bg-panel font-semibold text-brand" : "text-ink-2")}
                >
                  <Icon className="size-5" /> {l}
                  {h === "/erreurs/" && <CountDot n={due} className="ms-auto" />}
                </Link>
              ))}
            </nav>
            <div className="border-t border-line px-5 py-4">
              <p className="t-overline mb-2">{t("Axes de formation", "محاور التكوين")}</p>
              {MODULES.map((m) => (
                <Link key={m.id} href={`/cours/?axe=${m.id}`} className="flex items-center gap-3 py-2 text-[15px] text-ink-2">
                  <ModuleIcon id={m.id} /> {nameOf(m, lang)}
                </Link>
              ))}
            </div>
            <div className="border-t border-line px-5 py-3">
              <LangSwitch className="px-0" />
            </div>
          </aside>
        </div>
      )}

      <main className={cx("mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 sm:px-6 lg:pt-8", inQuiz ? "pb-32" : "pb-24 lg:pb-8")}>{children}</main>

      <div className={cx(inQuiz && "hidden lg:block")}>
        <Footer />
      </div>

      {/* Barre d'onglets mobile */}
      <nav className={cx("fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden", inQuiz && "hidden")}>
        {mobileTabs.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cx("relative flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-semibold", active(href) ? "text-brand" : "text-muted")}
          >
            {active(href) && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b bg-brand" />}
            <Icon className="size-5" />
            {label}
            {badge && <CountDot n={due} className="absolute end-[18%] top-1" />}
          </Link>
        ))}
      </nav>
    </div>
  );
}
