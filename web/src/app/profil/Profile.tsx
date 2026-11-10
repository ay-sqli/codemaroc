"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, CalendarDays, ChartNoAxesColumn, CircleHelp, ClipboardCheck, CloudCheck, CloudOff, Loader2, Lock, LogOut,
  RefreshCw, ShieldCheck, Target, Trash2, User, UserCog,
} from "lucide-react";
import { api, logout, updateSessionUser, useSession, type SessionUser } from "@/lib/session";
import { fmtDate, useLang } from "@/lib/i18n";
import { streak, useStore } from "@/lib/store";
import { useBank } from "@/lib/questions";
import { buildPath, currentIndex, RANKS, SECTION_COLORS } from "@/lib/game";
import { openGuide } from "@/lib/guide";
import { nameOf } from "@/lib/courses";
import { flushProgress, useSyncStatus } from "@/components/CloudSync";
import { BadgesCard } from "@/components/game/GameShell";
import { GameIcon, type IconName } from "@/components/game/GameIcon";
import { AuthField } from "@/components/auth/AuthScreen";
import { cx } from "@/components/ui";

/* ───────────── Petits composants ───────────── */

function Card({ title, icon: Icon, aside, children, className }: { title?: string; icon?: typeof User; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[20px] border-2 border-line bg-white p-4 shadow-[0_4px_0_var(--c-grey-300)] sm:rounded-[24px] sm:p-6", className)}>
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {Icon && <Icon className="size-5 shrink-0 text-[var(--c-grey-500)]" strokeWidth={2.4} />}
          <h2 className="min-w-0 flex-1 text-[17px] font-[800] text-[var(--c-grey-975)] sm:text-[18px]">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

function Bar({ value, max, color = "#198754", h = "h-2.5" }: { value: number; max: number; color?: string; h?: string }) {
  return (
    <div className={cx("w-full overflow-hidden rounded-full bg-[var(--c-grey-200)]", h)}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, background: color }} />
    </div>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <p className={cx("rounded-[12px] px-3 py-2 text-[14px] font-[700]", ok ? "bg-[#eafaf1] text-[#198754]" : "bg-[#fdedec] text-[#c0392b]")}>{text}</p>;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/* ───────────── Page ───────────── */

export function Profile() {
  const { user } = useSession();
  const [tab, setTab] = useState<"progress" | "account">("progress");
  const { t } = useLang();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-[960px] space-y-4 sm:space-y-5">
      <Identity user={user} />
      <button onClick={() => openGuide()} className="flex w-full items-center gap-3 rounded-[18px] border-2 border-line bg-white p-3 text-start shadow-[0_3px_0_var(--c-grey-300)] hover:bg-panel">
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--duo-blue-50)] text-[var(--duo-blue)]">
          <CircleHelp className="size-6" strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-[800] text-ink">{t("Revoir le guide de l'application", "إعادة مشاهدة دليل التطبيق")}</span>
          <span className="block text-[13px] text-muted">{t("Chaque page, chaque bouton et chaque astuce", "كل صفحة وكل زر وكل حيلة")}</span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-muted rtl:rotate-180" />
      </button>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-[16px] border-2 border-line bg-white p-1">
        {(
          [
            ["progress", t("Mon avancement", "تقدمي"), ChartNoAxesColumn],
            ["account", t("Mon compte", "حسابي"), UserCog],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx(
              "flex h-11 items-center justify-center gap-2 rounded-[12px] text-[14px] font-[800] transition-colors sm:text-[15px]",
              tab === k ? "bg-[var(--duo-blue-50)] text-[var(--duo-blue)]" : "text-[var(--c-grey-500)] hover:bg-panel",
            )}
          >
            <Icon className="size-5" strokeWidth={2.4} /> {label}
          </button>
        ))}
      </div>
      {tab === "progress" ? <ProgressTab /> : <AccountTab user={user} />}
    </div>
  );
}

/* ───────────── En-tête : identité, grade, prochaine étape ───────────── */

function Identity({ user }: { user: SessionUser }) {
  const { lang, t } = useLang();
  const game = useStore((s) => s.game);
  const days = useStore((s) => s.days);
  const { bank } = useBank();
  const path = useMemo(() => (bank ? buildPath(bank) : null), [bank]);
  const done = path ? path.flat.filter((n) => game.done[n.id]).length : Object.keys(game.done).length;
  const total = path?.flat.length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const rank = [...RANKS].reverse().find((r) => done >= r.min) ?? RANKS[0];
  const nextRank = RANKS.find((r) => r.min > done);
  const next = path ? path.flat[currentIndex(path, game)] : null;
  const nextUnit = next && path?.sections.flatMap((s) => s.units).find((u) => u.nodes.some((n) => n.id === next.id));

  return (
    <section className="overflow-hidden rounded-[20px] border-2 border-line bg-white shadow-[0_4px_0_var(--c-grey-300)] sm:rounded-[24px]">
      <div className="relative bg-[#d92b2b] px-4 pb-4 pt-5 text-white sm:px-6 sm:pt-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1.5px, transparent 0)", backgroundSize: "18px 18px" }} />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-white bg-[#a81c1c] text-[24px] font-[900] sm:size-16 sm:text-[26px]" style={{ fontFamily: "var(--font-display)" }}>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-[20px] font-[800] leading-tight sm:text-[24px]">{user.name}</h1>
            <p className="truncate text-[13px] text-white/80 sm:text-[14px]" dir="ltr">
              {user.email}
            </p>
            <p className="mt-0.5 text-[12px] text-white/80 sm:text-[13px]">
              {t("Membre depuis le", "عضو منذ")} {fmtDate(user.createdAt, lang, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {user.role === "admin" && (
            <Link href="/admin/" className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-[800] hover:bg-white/25 sm:inline-flex">
              <ShieldCheck className="size-4" /> {t("Back-office", "لوحة الإدارة")}
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <GameIcon name={rank.icon} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-[800] uppercase tracking-wide text-muted">{t("Mon grade", "رتبتي")}</p>
              <p className="text-[18px] font-[800] leading-tight text-ink">{lang === "ar" ? rank.ar : rank.fr}</p>
            </div>
            <span className="duo-mono shrink-0 text-[15px] font-[700] text-[#198754]" dir="ltr">
              {pct} %
            </span>
          </div>
          <div className="mt-3">
            <Bar value={done} max={total} h="h-3" />
          </div>
          <p className="mt-2 text-[13px] text-muted">
            <span className="duo-mono font-[700] text-ink">
              {done}/{total || "…"}
            </span>{" "}
            {t("étapes validées", "مرحلة مكتملة")}
            {streak(days) > 0 && <> · {t(`série de ${streak(days)} jour${streak(days) > 1 ? "s" : ""}`, `${streak(days)} أيام متتالية`)}</>}
            {nextRank && <> · {t(`grade suivant à ${nextRank.min} étapes`, `الرتبة التالية عند ${nextRank.min} مرحلة`)}</>}
          </p>
        </div>
        <Link href="/" className="duo-btn duo-btn-green !min-h-12 w-full sm:w-auto">
          {next ? t("Continuer", "متابعة") : t("Voir le parcours", "عرض المسار")} <ArrowRight className="size-5 rtl:rotate-180" />
        </Link>
        {nextUnit && (
          <p className="-mt-2 text-[13px] text-muted sm:col-span-2 sm:mt-[-8px]">
            {t("Prochaine étape :", "المرحلة التالية:")} <span className="font-[700] text-ink-2">{nameOf(nextUnit.chapter, lang)}</span>
          </p>
        )}
      </div>
    </section>
  );
}

/* ───────────── Onglet « Mon avancement » ───────────── */

function ProgressTab() {
  const { lang, t } = useLang();
  const game = useStore((s) => s.game);
  const answers = useStore((s) => s.answers);
  const exams = useStore((s) => s.exams);
  const days = useStore((s) => s.days);
  const { bank } = useBank();
  const path = useMemo(() => (bank ? buildPath(bank) : null), [bank]);

  const seen = Object.keys(answers).length;
  const ok = Object.values(answers).reduce((n, a) => n + a.ok, 0);
  const tries = Object.values(answers).reduce((n, a) => n + a.ok + a.ko, 0);
  const rate = tries ? Math.round((ok / tries) * 100) : 0;
  const best = exams.reduce((m, e) => Math.max(m, e.score), 0);
  const passed = exams.filter((e) => e.score >= 32).length;
  const activeDays = Object.keys(days).length;

  // Activité des 28 derniers jours (nombre de réponses par jour).
  const [now] = useState(() => Date.now());
  const activity = useMemo(() => {
    const out: { key: string; n: number; d: Date }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      out.push({ key: dayKey(d), n: days[dayKey(d)] ?? 0, d });
    }
    return out;
  }, [days, now]);
  const maxDay = Math.max(1, ...activity.map((a) => a.n));
  const week = activity.slice(-7).reduce((n, a) => n + a.n, 0);

  // Progression par section du parcours.
  const sections = useMemo(() => {
    if (!path) return [];
    return path.sections.map((s) => {
      const nodes = s.units.flatMap((u) => u.nodes);
      const unitsDone = s.units.filter((u) => u.nodes.every((n) => game.done[n.id])).length;
      return { id: s.id, n: s.n, name: lang === "ar" ? s.ar : s.fr, done: nodes.filter((n) => game.done[n.id]).length, total: nodes.length, unitsDone, units: s.units.length };
    });
  }, [path, game.done, lang]);

  // Chapitres à retravailler : taux de réussite le plus bas (au moins 5 questions vues).
  const weak = useMemo(() => {
    if (!bank || !path) return [];
    const per = new Map<string, { ok: number; all: number }>();
    for (const [id, a] of Object.entries(answers)) {
      const ch = bank.all.get(id)?.chapter;
      if (!ch) continue;
      const p = per.get(ch) ?? { ok: 0, all: 0 };
      p.ok += a.ok;
      p.all += a.ok + a.ko;
      per.set(ch, p);
    }
    const chapters = new Map(path.sections.flatMap((s) => s.units).map((u) => [u.chapter.slug, u.chapter]));
    return [...per.entries()]
      .filter(([slug, p]) => p.all >= 5 && chapters.has(slug))
      .map(([slug, p]) => ({ slug, ch: chapters.get(slug)!, rate: Math.round((p.ok / p.all) * 100) }))
      .filter((x) => x.rate < 85)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 4);
  }, [answers, bank, path]);

  const stats: { icon: IconName; v: string; l: string }[] = [
    { icon: "xp", v: String(game.xp), l: t("Points XP", "نقاط XP") },
    { icon: "flame", v: String(streak(days)), l: t("Jours d'affilée", "أيام متتالية") },
    { icon: "crown", v: String(seen), l: t("Questions vues", "أسئلة تمت رؤيتها") },
    { icon: "first-step", v: tries ? `${rate} %` : "—", l: t("Bonnes réponses", "أجوبة صحيحة") },
    { icon: "champion", v: best ? `${best}/40` : "—", l: t("Meilleur examen", "أفضل امتحان") },
    { icon: "walker-gold", v: String(activeDays), l: t("Jours de révision", "أيام المراجعة") },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {stats.map((x) => (
          <div key={x.l} className="flex items-center gap-2.5 rounded-[18px] border-2 border-line bg-white p-3 shadow-[0_3px_0_var(--c-grey-300)] sm:gap-3">
            <GameIcon name={x.icon} size={36} />
            <div className="min-w-0">
              <p className="duo-mono text-[17px] font-[700] leading-tight text-ink sm:text-[19px]">{x.v}</p>
              <p className="text-[12px] leading-snug text-muted">{x.l}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Activité */}
        <Card title={t("Mon activité", "نشاطي")} icon={CalendarDays} aside={<span className="text-[12px] font-[700] text-muted">{t("28 derniers jours", "آخر 28 يوما")}</span>}>
          <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={t("Réponses par jour", "الأجوبة في اليوم")} dir="ltr">
            {activity.map((a) => (
              <div key={a.key} className="flex h-full flex-1 flex-col justify-end" title={`${fmtDate(a.d, lang, { day: "numeric", month: "short" })} : ${a.n}`}>
                <div className={cx("w-full rounded-[3px]", a.n ? "bg-[#198754]" : "bg-[var(--c-grey-200)]")} style={{ height: a.n ? `${Math.max(8, (a.n / maxDay) * 100)}%` : "4px" }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted" dir="ltr">
            <span>{fmtDate(activity[0].d, lang, { day: "numeric", month: "short" })}</span>
            <span>{t("Aujourd'hui", "اليوم")}</span>
          </div>
          <p className="mt-3 text-[14px] text-ink-2">
            <span className="duo-mono font-[700]">{week}</span> {t("réponses cette semaine", "جوابا هذا الأسبوع")}
          </p>
        </Card>

        {/* Examens blancs */}
        <Card title={t("Mes examens blancs", "امتحاناتي التجريبية")} icon={ClipboardCheck} aside={exams.length ? <span className="text-[12px] font-[700] text-muted">{t(`${passed} réussi${passed > 1 ? "s" : ""} / ${exams.length}`, `${passed} ناجح / ${exams.length}`)}</span> : null}>
          {exams.length ? (
            <ul className="space-y-2">
              {exams
                .slice(-5)
                .reverse()
                .map((e) => {
                  const pass = e.score >= 32;
                  return (
                    <li key={e.ts} className="flex items-center gap-3">
                      <span className={cx("duo-mono w-14 shrink-0 rounded-full py-1 text-center text-[13px] font-[700]", pass ? "bg-[#eafaf1] text-[#198754]" : "bg-[#fdedec] text-[#c0392b]")} dir="ltr">
                        {e.score}/{e.total}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Bar value={e.score} max={e.total} color={pass ? "#198754" : "#e74c3c"} h="h-2" />
                      </div>
                      <span className="shrink-0 text-[12px] text-muted">{fmtDate(e.ts, lang, { day: "numeric", month: "short" })}</span>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-[14px] text-muted">{t("Aucun examen blanc pour l'instant. Il faut 32/40 pour réussir.", "لا يوجد امتحان تجريبي بعد. تحتاج 32/40 للنجاح.")}</p>
          )}
          <Link href="/examen/" className="duo-btn duo-btn-ghost mt-4 !min-h-11 w-full !text-[13px]">
            <ClipboardCheck className="size-4" /> {t("Passer un examen blanc", "اجتياز امتحان تجريبي")}
          </Link>
        </Card>
      </div>

      {/* Parcours par section */}
      <Card title={t("Mon parcours par section", "مساري حسب القسم")} icon={Target}>
        {sections.length ? (
          <ul className="space-y-4">
            {sections.map((s) => {
              const col = SECTION_COLORS[s.id] ?? { c: "#198754", soft: "#eafaf1" };
              const full = s.done === s.total;
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] text-[15px] font-[900]" style={{ background: col.soft, color: col.c }}>
                    {s.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-[800] text-ink sm:text-[15px]">{s.name}</span>
                      <span className="duo-mono shrink-0 text-[12px] text-muted" dir="ltr">
                        {s.done}/{s.total}
                      </span>
                    </div>
                    <Bar value={s.done} max={s.total} color={col.c} />
                    <p className="mt-1 text-[12px] text-muted">
                      {full ? t("Section terminée", "القسم مكتمل") : t(`${s.unitsDone} unité${s.unitsDone > 1 ? "s" : ""} sur ${s.units} terminée${s.unitsDone > 1 ? "s" : ""}`, `${s.unitsDone} من ${s.units} وحدات مكتملة`)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Loader2 className="mx-auto size-7 animate-spin text-muted" />
        )}
      </Card>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* À retravailler */}
        <Card title={t("À retravailler", "للمراجعة")} icon={BookOpen}>
          {weak.length ? (
            <ul className="space-y-2">
              {weak.map((w) => (
                <li key={w.slug}>
                  <Link href={`/cours/${w.slug}/`} className="flex items-center gap-3 rounded-[14px] border-2 border-line p-3 hover:bg-panel">
                    <span className={cx("duo-mono w-12 shrink-0 text-center text-[14px] font-[700]", w.rate < 60 ? "text-[#c0392b]" : "text-[#d68910]")} dir="ltr">
                      {w.rate} %
                    </span>
                    <span className="min-w-0 flex-1 text-[14px] font-[700] leading-snug text-ink-2">{nameOf(w.ch, lang)}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-muted">
              {seen
                ? t("Rien à signaler : tes taux de réussite sont bons partout.", "لا شيء يذكر: نسب نجاحك جيدة في كل مكان.")
                : t("Réponds à quelques questions : les chapitres où tu te trompes le plus apparaîtront ici.", "أجب عن بعض الأسئلة: ستظهر هنا الفصول التي تخطئ فيها أكثر.")}
            </p>
          )}
        </Card>
        <BadgesCard />
      </div>
    </div>
  );
}

/* ───────────── Onglet « Mon compte » ───────────── */

function AccountTab({ user }: { user: SessionUser }) {
  const { t } = useLang();
  const sync = useSyncStatus();
  const [name, setName] = useState(user.name);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [del, setDel] = useState("");
  const [msg, setMsg] = useState<{ k: string; ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (k: string, fn: () => Promise<string>) => {
    setBusy(k);
    setMsg(null);
    try {
      setMsg({ k, ok: true, text: await fn() });
    } catch (e) {
      setMsg({ k, ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const time = (at: number) => new Date(at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const syncLabel =
    sync.s === "saved" && sync.at
      ? t(`Dernière sauvegarde à ${time(sync.at)}`, `آخر حفظ على الساعة ${time(sync.at)}`)
      : sync.s === "syncing"
        ? t("Sauvegarde en cours…", "جار الحفظ…")
        : sync.s === "offline"
          ? t("Hors ligne : sauvegarde dès le retour du réseau", "غير متصل: سيتم الحفظ عند عودة الشبكة")
          : sync.s === "error"
            ? t("Sauvegarde impossible pour l'instant", "تعذر الحفظ حاليا")
            : t("Sauvegarde automatique activée", "الحفظ التلقائي مفعل");

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          {sync.s === "error" || sync.s === "offline" ? <CloudOff className="size-7 shrink-0 text-[#c0392b]" /> : <CloudCheck className="size-7 shrink-0 text-[#198754]" />}
          <div className="min-w-0 flex-1 basis-[60%]">
            <p className="text-[15px] font-[800] text-ink">{t("Progression enregistrée dans ton compte", "تقدمك محفوظ في حسابك")}</p>
            <p className="text-[13px] text-muted">{syncLabel}</p>
          </div>
          <button onClick={() => void flushProgress()} className="duo-btn duo-btn-ghost !min-h-11 w-full !px-4 !text-[13px] sm:w-auto">
            <RefreshCw className={cx("size-4", sync.s === "syncing" && "animate-spin")} /> {t("Sauvegarder", "حفظ")}
          </button>
        </div>
      </Card>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <Card title={t("Mon nom", "اسمي")} icon={User}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run("name", async () => {
                const { user: u } = await api<{ user: SessionUser }>("/api/auth/me/", { method: "PATCH", json: { name } });
                updateSessionUser(u);
                return t("Nom mis à jour.", "تم تحديث الاسم.");
              });
            }}
          >
            <AuthField icon={User} label={t("Prénom ou pseudo", "الاسم أو اللقب")} value={name} onChange={setName} autoComplete="name" />
            {msg?.k === "name" && <Msg ok={msg.ok} text={msg.text} />}
            <button className="duo-btn duo-btn-green w-full !min-h-12" disabled={busy === "name"}>
              {busy === "name" && <Loader2 className="size-4 animate-spin" />} {t("Enregistrer", "حفظ")}
            </button>
          </form>
        </Card>

        <Card title={t("Mot de passe", "كلمة المرور")} icon={Lock}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run("pw", async () => {
                await api("/api/auth/me/", { method: "PATCH", json: { currentPassword: cur, newPassword: pw } });
                setCur("");
                setPw("");
                return t("Mot de passe modifié.", "تم تغيير كلمة المرور.");
              });
            }}
          >
            <AuthField icon={Lock} label={t("Mot de passe actuel", "كلمة المرور الحالية")} type="password" value={cur} onChange={setCur} autoComplete="current-password" />
            <AuthField icon={Lock} label={t("Nouveau mot de passe", "كلمة المرور الجديدة")} type="password" value={pw} onChange={setPw} autoComplete="new-password" />
            {msg?.k === "pw" && <Msg ok={msg.ok} text={msg.text} />}
            <button className="duo-btn duo-btn-green w-full !min-h-12" disabled={busy === "pw"}>
              {busy === "pw" && <Loader2 className="size-4 animate-spin" />} {t("Modifier", "تغيير")}
            </button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-[60%]">
            <p className="text-[16px] font-[800] text-ink">{t("Se déconnecter", "تسجيل الخروج")}</p>
            <p className="text-[13px] text-muted">{t("Ta progression reste dans ton compte.", "يبقى تقدمك محفوظا في حسابك.")}</p>
          </div>
          <button
            className="duo-btn duo-btn-ghost !min-h-11 w-full sm:w-auto"
            onClick={async () => {
              await flushProgress();
              await logout();
            }}
          >
            <LogOut className="size-4" /> {t("Déconnexion", "خروج")}
          </button>
        </div>
      </Card>

      {user.role !== "admin" && (
        <Card className="!border-[#ffb2b2]">
          <p className="text-[16px] font-[800] text-[#c0392b]">{t("Supprimer mon compte", "حذف حسابي")}</p>
          <p className="mb-3 text-[13px] text-muted">{t("Ton compte et toute ta progression seront effacés définitivement.", "سيتم حذف حسابك وكل تقدمك نهائيا.")}</p>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!confirm(t("Supprimer définitivement ton compte ?", "حذف حسابك نهائيا ؟"))) return;
              void run("del", async () => {
                await api("/api/auth/me/", { method: "DELETE", json: { password: del } });
                await logout();
                return "";
              });
            }}
          >
            <div className="flex-1">
              <AuthField icon={Lock} label={t("Confirme avec ton mot de passe", "أكّد بكلمة المرور")} type="password" value={del} onChange={setDel} autoComplete="current-password" />
            </div>
            <button className="duo-btn duo-btn-red !min-h-[52px]" disabled={busy === "del"}>
              <Trash2 className="size-4" /> {t("Supprimer", "حذف")}
            </button>
          </form>
          {msg?.k === "del" && !msg.ok && (
            <div className="mt-3">
              <Msg ok={false} text={msg.text} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
