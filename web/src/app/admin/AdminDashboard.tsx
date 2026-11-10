"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowLeft, CalendarPlus, KeyRound, Loader2, LogOut, RefreshCw, RotateCcw, Search, ShieldCheck, Trash2, Trophy, UserPlus, Users, X,
} from "lucide-react";
import { api, logout, useSession } from "@/lib/session";
import { useBank } from "@/lib/questions";
import { buildPath, SECTION_COLORS } from "@/lib/game";
import type { State } from "@/lib/store";
import { cx } from "@/components/ui";
import { LangSwitch, Wordmark } from "@/components/Chrome";
import { fmtDate, useLang, type Lang, type TFn } from "@/lib/i18n";

/** Back-office : vue d'ensemble des utilisateurs, de leur activité et de leur progression. */

interface Summary {
  done: number;
  xp: number;
  answered: number;
  correct: number;
  exams: number;
  bestExam: number;
  activeDays: number;
  lastActive: number;
}
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: number;
  lastLoginAt: number | null;
  summary: Summary | null;
  syncedAt: number | null;
}

const DAY = 86_400_000;
const fmtDay = (ts: number, lang: Lang) => fmtDate(ts, lang, { day: "numeric", month: "short", year: "numeric" });
function ago(ts: number | null | undefined, lang: Lang, t: TFn) {
  if (!ts) return t("jamais", "أبدا");
  const d = Date.now() - ts;
  if (d < 60_000) return t("à l'instant", "الآن");
  if (d < 3_600_000) return t(`il y a ${Math.floor(d / 60_000)} min`, `منذ ${Math.floor(d / 60_000)} د`);
  if (d < DAY) return t(`il y a ${Math.floor(d / 3_600_000)} h`, `منذ ${Math.floor(d / 3_600_000)} س`);
  if (d < 30 * DAY) return t(`il y a ${Math.floor(d / DAY)} j`, `منذ ${Math.floor(d / DAY)} يوم`);
  return fmtDay(ts, lang);
}
/** Dernière activité connue : réponse, sauvegarde ou connexion. */
const lastSeen = (u: AdminUser) => Math.max(u.summary?.lastActive ?? 0, u.syncedAt ?? 0, u.lastLoginAt ?? 0);

function Kpi({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: string; hint?: string; tone: string }) {
  return (
    <div className="rounded-[20px] border-2 border-line bg-white p-4 shadow-[0_3px_0_var(--c-grey-300)]">
      <div className="flex items-center gap-2 text-[13px] font-[700] text-muted">
        <span className="grid size-8 place-items-center rounded-[10px]" style={{ background: `${tone}1a`, color: tone }}>
          <Icon className="size-4.5" strokeWidth={2.4} />
        </span>
        {label}
      </div>
      <p className="duo-mono mt-2 text-[26px] font-[700] leading-none text-[var(--c-grey-975)]">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function Avatar({ name, admin }: { name: string; admin?: boolean }) {
  return (
    <span className={cx("grid size-10 shrink-0 place-items-center rounded-full text-[16px] font-[900] text-white", admin ? "bg-[#1b4f72]" : "bg-[#d92b2b]")} style={{ fontFamily: "var(--font-display)" }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Bar({ value, max, color = "#198754" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--c-grey-200)]">
      <div className="h-full rounded-full" style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, background: color }} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useLang();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[24px] bg-white p-5 sm:rounded-[24px] sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-[800] text-[var(--c-grey-975)]">{title}</h2>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-panel" aria-label={t("Fermer", "إغلاق")}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const input = "h-12 w-full rounded-[12px] border-2 border-line bg-white px-3 text-[15px] outline-none focus:border-[#2980b9]";

function AddUser({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useLang();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={t("Ajouter un utilisateur", "إضافة مستخدم")} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            await api("/api/admin/users/", { method: "POST", json: f });
            onDone();
            onClose();
          } catch (x) {
            setErr(x instanceof Error ? x.message : String(x));
          } finally {
            setBusy(false);
          }
        }}
      >
        <input className={input} placeholder={t("Nom", "الاسم")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input className={input} placeholder={t("E-mail", "البريد الإلكتروني")} type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className={input} placeholder={t("Mot de passe provisoire (8 caractères min.)", "كلمة مرور مؤقتة (8 أحرف على الأقل)")} type="text" dir="ltr" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <p className="text-[12px] text-muted">{t("Le compte est créé en tant qu'utilisateur : l'application n'a qu'un seul administrateur.", "يُنشأ الحساب كمستخدم عادي: للتطبيق مدير واحد فقط.")}</p>
        {err && <p className="rounded-[12px] bg-[#fdedec] px-3 py-2 text-[14px] font-[700] text-[#c0392b]">{err}</p>}
        <button className="duo-btn duo-btn-green w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} {t("Créer le compte", "إنشاء الحساب")}
        </button>
      </form>
    </Modal>
  );
}

function UserDetail({ id, me, onClose, onChanged }: { id: string; me: string; onClose: () => void; onChanged: () => void }) {
  const { lang, t } = useLang();
  const { bank } = useBank();
  const [data, setData] = useState<{ user: AdminUser; state: State | null; summary: Summary | null; syncedAt: number | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    api<{ user: AdminUser; state: State | null; summary: Summary | null; syncedAt: number | null }>(`/api/admin/users/${id}/`).then(setData, (e) => setErr(String(e.message)));
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => {
    if (!bank || !data) return [];
    const path = buildPath(bank);
    const done = data.state?.game?.done ?? {};
    return path.sections.map((s) => {
      const nodes = s.units.flatMap((u) => u.nodes);
      return { id: s.id, name: lang === "ar" ? s.ar : s.fr, done: nodes.filter((n) => done[n.id]).length, total: nodes.length };
    });
  }, [bank, data, lang]);

  const act = async (label: string, body: Record<string, unknown> | "delete") => {
    try {
      if (body === "delete") {
        if (!confirm(t(`Supprimer définitivement ${data?.user.name} et toute sa progression ?`, `حذف ${data?.user.name} وكل تقدمه نهائيا ؟`))) return;
        await api(`/api/admin/users/${id}/`, { method: "DELETE" });
        onChanged();
        onClose();
        return;
      }
      await api(`/api/admin/users/${id}/`, { method: "PATCH", json: body });
      setErr(null);
      alert(label);
      load();
      onChanged();
    } catch (x) {
      setErr(x instanceof Error ? x.message : String(x));
    }
  };

  const u = data?.user;
  const s = data?.summary;
  const exams = data?.state?.exams ?? [];
  return (
    <Modal title={u ? u.name : t("Utilisateur", "مستخدم")} onClose={onClose}>
      {!data && !err && <Loader2 className="mx-auto size-8 animate-spin text-muted" />}
      {err && <p className="mb-3 rounded-[12px] bg-[#fdedec] px-3 py-2 text-[14px] font-[700] text-[#c0392b]">{err}</p>}
      {u && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name={u.name} admin={u.role === "admin"} />
            <div className="min-w-0 text-[13px] text-muted">
              <p className="truncate text-[15px] font-[700] text-ink" dir="ltr">
                {u.email}
              </p>
              <p>
                {t("Inscrit le", "تاريخ التسجيل:")} {fmtDay(u.createdAt, lang)} · {t("dernière connexion", "آخر دخول:")} {ago(u.lastLoginAt, lang, t)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [t("Étapes", "المراحل"), `${s?.done ?? 0}`],
              [t("XP", "نقاط الخبرة"), `${s?.xp ?? 0}`],
              [t("Questions vues", "الأسئلة المرئية"), `${s?.answered ?? 0}`],
              [t("Réussite", "النجاح"), s?.answered ? `${Math.round((s.correct / s.answered) * 100)} %` : "—"],
              [t("Examens blancs", "الامتحانات التجريبية"), `${s?.exams ?? 0}`],
              [t("Meilleur examen", "أفضل امتحان"), s?.bestExam ? `${s.bestExam}/40` : "—"],
              [t("Jours actifs", "أيام النشاط"), `${s?.activeDays ?? 0}`],
              [t("Synchronisé", "المزامنة"), ago(data.syncedAt, lang, t)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-[14px] bg-panel p-3">
                <p className="text-[12px] text-muted">{l}</p>
                <p className="text-[16px] font-[800] text-ink">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-[14px] font-[800] text-ink">{t("Progression par section", "التقدم حسب القسم")}</p>
            <ul className="space-y-2.5">
              {sections.map((x) => (
                <li key={x.id}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-[700] text-ink-2">{x.name}</span>
                    <span className="duo-mono text-muted">
                      {x.done}/{x.total}
                    </span>
                  </div>
                  <Bar value={x.done} max={x.total} color={SECTION_COLORS[x.id]?.c} />
                </li>
              ))}
              {!sections.length && <li className="text-[13px] text-muted">{t("Chargement…", "جار التحميل…")}</li>}
            </ul>
          </div>
          {exams.length > 0 && (
            <div>
              <p className="mb-2 text-[14px] font-[800] text-ink">{t("Derniers examens blancs", "آخر الامتحانات التجريبية")}</p>
              <ul className="flex flex-wrap gap-2">
                {exams
                  .slice(-8)
                  .reverse()
                  .map((e) => (
                    <li key={e.ts} className={cx("rounded-full px-3 py-1 text-[13px] font-[800]", e.score >= 32 ? "bg-[#eafaf1] text-[#198754]" : "bg-[#fdedec] text-[#c0392b]")}>
                      {e.score}/{e.total} · {fmtDay(e.ts, lang)}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <div className="grid gap-2 border-t-2 border-line pt-4 sm:grid-cols-2">
            <button
              className="duo-btn duo-btn-ghost !min-h-11 !text-[13px]"
              onClick={() => {
                const pw = prompt(t("Nouveau mot de passe (8 caractères minimum) :", "كلمة المرور الجديدة (8 أحرف على الأقل):"));
                if (pw) void act(t("Mot de passe réinitialisé.", "تمت إعادة تعيين كلمة المرور."), { password: pw });
              }}
            >
              <KeyRound className="size-4" /> {t("Réinitialiser le mot de passe", "إعادة تعيين كلمة المرور")}
            </button>
            <button
              className="duo-btn duo-btn-ghost !min-h-11 !text-[13px]"
              onClick={() => confirm(t(`Remettre à zéro la progression de ${u.name} ?`, `تصفير تقدم ${u.name} ؟`)) && void act(t("Progression remise à zéro.", "تم تصفير التقدم."), { resetProgress: true })}
            >
              <RotateCcw className="size-4" /> {t("Remettre la progression à zéro", "تصفير التقدم")}
            </button>
            <button className="duo-btn duo-btn-red !min-h-11 !text-[13px]" disabled={u.id === me || u.role === "admin"} onClick={() => void act("", "delete")}>
              <Trash2 className="size-4" /> {t("Supprimer le compte", "حذف الحساب")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function AdminDashboard() {
  const { lang, t } = useLang();
  const router = useRouter();
  const { status, user } = useSession();
  const { bank } = useBank();
  const total = bank ? buildPath(bank).flat.length : 262;
  const [list, setList] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "active" | "progress" | "name">("recent");
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [now] = useState(() => Date.now());

  const isAdmin = status === "user" && user?.role === "admin";
  useEffect(() => {
    if (status === "guest" || (status === "user" && user?.role !== "admin")) router.replace("/admin/connexion/");
  }, [status, user, router]);

  const load = useCallback(() => {
    api<{ users: AdminUser[] }>("/api/admin/users/").then(
      (d) => setList(d.users),
      (e) => setErr(String(e.message)),
    );
  }, []);
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const stats = useMemo(() => {
    const l = list ?? [];
    const active7 = l.filter((u) => now - lastSeen(u) < 7 * DAY).length;
    const today = l.filter((u) => now - lastSeen(u) < DAY).length;
    const new7 = l.filter((u) => now - u.createdAt < 7 * DAY).length;
    const avgDone = l.length ? Math.round(l.reduce((a, u) => a + (u.summary?.done ?? 0), 0) / l.length) : 0;
    const answered = l.reduce((a, u) => a + (u.summary?.answered ?? 0), 0);
    const passed = l.filter((u) => (u.summary?.bestExam ?? 0) >= 32).length;
    // Inscriptions des 30 derniers jours
    const days = Array.from({ length: 30 }, (_, i) => {
      const start = new Date(now - (29 - i) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + DAY;
      return { ts: start.getTime(), n: l.filter((u) => u.createdAt >= start.getTime() && u.createdAt < end).length };
    });
    return { active7, today, new7, avgDone, answered, passed, days, max: Math.max(1, ...days.map((d) => d.n)) };
  }, [list, now]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const l = (list ?? []).filter((u) => !n || u.name.toLowerCase().includes(n) || u.email.includes(n));
    const by = {
      recent: (a: AdminUser, b: AdminUser) => b.createdAt - a.createdAt,
      active: (a: AdminUser, b: AdminUser) => lastSeen(b) - lastSeen(a),
      progress: (a: AdminUser, b: AdminUser) => (b.summary?.done ?? 0) - (a.summary?.done ?? 0),
      name: (a: AdminUser, b: AdminUser) => a.name.localeCompare(b.name),
    }[sort];
    return [...l].sort(by);
  }, [list, q, sort]);

  if (!isAdmin) {
    return (
      <div className="duo grid min-h-dvh place-items-center bg-[#0f1419]">
        <Loader2 className="size-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <div className="duo min-h-dvh bg-[var(--c-grey-50)]">
      <header className="sticky top-0 z-30 bg-[#0f1419] text-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6">
          <Wordmark compact className="!h-10" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-[800] leading-tight">{t("Back-office Code Maroc", "لوحة إدارة كود المغرب")}</p>
            <p className="truncate text-[12px] text-white/60">{user?.name}</p>
          </div>
          <Link href="/" className="hidden items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-[700] text-white/80 hover:bg-white/10 sm:flex">
            <ArrowLeft className="size-4" /> {t("Voir l'application", "عرض التطبيق")}
          </Link>
          <LangSwitch tone="dark" />
          <button
            onClick={async () => {
              await logout();
              router.replace("/admin/connexion/");
            }}
            className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-[700] text-white/80 hover:bg-white/10"
          >
            <LogOut className="size-4" /> <span className="max-sm:hidden">{t("Déconnexion", "تسجيل الخروج")}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-[800] text-[var(--c-grey-975)]" style={{ fontFamily: "var(--font-display)" }}>
              {t("Tableau de bord", "لوحة القيادة")}
            </h1>
            <p className="text-[14px] text-muted">{t("Utilisateurs, activité et progression dans le parcours.", "المستخدمون، النشاط والتقدم في المسار.")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="duo-btn duo-btn-ghost !min-h-11 !px-3 !text-[13px]" aria-label={t("Actualiser", "تحديث")}>
              <RefreshCw className="size-4" />
            </button>
            <button onClick={() => setAdding(true)} className="duo-btn duo-btn-green !min-h-11 !text-[13px]">
              <UserPlus className="size-4" /> {t("Ajouter", "إضافة")}
            </button>
          </div>
        </div>

        {err && <p className="rounded-[12px] bg-[#fdedec] px-3 py-2 text-[14px] font-[700] text-[#c0392b]">{err}</p>}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={Users} tone="#d92b2b" label={t("Utilisateurs", "المستخدمون")} value={list ? String(list.length) : "…"} hint={t("1 administrateur (compte unique)", "مدير واحد (حساب وحيد)")} />
          <Kpi icon={CalendarPlus} tone="#2980b9" label={t("Nouveaux (7 j)", "الجدد (7 أيام)")} value={String(stats.new7)} />
          <Kpi icon={Activity} tone="#198754" label={t("Actifs (7 j)", "النشطون (7 أيام)")} value={String(stats.active7)} hint={t(`${stats.today} aujourd'hui`, `${stats.today} اليوم`)} />
          <Kpi icon={Trophy} tone="#d68910" label={t("Examen ≥ 32/40", "الامتحان ≥ 32/40")} value={String(stats.passed)} hint={t(`Étapes en moyenne : ${stats.avgDone}/${total}`, `متوسط المراحل: ${stats.avgDone}/${total}`)} />
        </div>

        <section className="rounded-[20px] border-2 border-line bg-white p-4 shadow-[0_3px_0_var(--c-grey-300)] sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-[800] text-ink">{t("Inscriptions sur 30 jours", "التسجيلات خلال 30 يوما")}</h2>
            <span className="text-[13px] text-muted">
              {t(`${stats.answered.toLocaleString("fr-FR")} réponse${stats.answered > 1 ? "s" : ""} au total`, `${stats.answered} جواب في المجموع`)}
            </span>
          </div>
          <div className="flex h-28 items-end gap-[3px]" role="img" aria-label={t("Inscriptions par jour", "التسجيلات في اليوم")}>
            {stats.days.map((d) => (
              <div key={d.ts} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="w-full rounded-t-[4px] bg-[#d92b2b]" style={{ height: `${Math.max(d.n ? 8 : 2, (d.n / stats.max) * 100)}%`, opacity: d.n ? 1 : 0.15 }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1e2328] px-1.5 py-0.5 text-[11px] text-white group-hover:block">
                  {fmtDate(d.ts, lang, { day: "numeric", month: "short" })} : {d.n}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[20px] border-2 border-line bg-white shadow-[0_3px_0_var(--c-grey-300)]">
          <div className="flex flex-col gap-3 border-b-2 border-line p-4 sm:flex-row sm:items-center">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-[12px] border-2 border-line px-3 focus-within:border-[#2980b9]">
              <Search className="size-4 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher un nom ou un e-mail", "ابحث عن اسم أو بريد إلكتروني")} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-11 rounded-[12px] border-2 border-line bg-white px-3 text-[14px] font-[700]">
              <option value="recent">{t("Plus récents", "الأحدث")}</option>
              <option value="active">{t("Dernière activité", "آخر نشاط")}</option>
              <option value="progress">{t("Progression", "التقدم")}</option>
              <option value="name">{t("Nom", "الاسم")}</option>
            </select>
          </div>

          {!list && <Loader2 className="mx-auto my-10 size-8 animate-spin text-muted" />}
          {list && !rows.length && <p className="p-8 text-center text-[14px] text-muted">{t("Aucun utilisateur.", "لا يوجد أي مستخدم.")}</p>}

          {/* Tableau (ordinateur) */}
          {list && rows.length > 0 && (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-start text-[12px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 text-start font-[800]">{t("Utilisateur", "المستخدم")}</th>
                    <th className="px-3 py-3 text-start font-[800]">{t("Inscrit", "التسجيل")}</th>
                    <th className="px-3 py-3 text-start font-[800]">{t("Activité", "النشاط")}</th>
                    <th className="w-48 px-3 py-3 text-start font-[800]">{t("Progression", "التقدم")}</th>
                    <th className="px-3 py-3 text-end font-[800]">{t("XP", "نقاط الخبرة")}</th>
                    <th className="px-3 py-3 text-end font-[800]">{t("Réussite", "النجاح")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-t-2 border-line hover:bg-panel">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} admin={u.role === "admin"} />
                          <div className="min-w-0">
                            <p className="truncate font-[800] text-ink">
                              {u.name}
                              {u.role === "admin" && <span className="ms-2 rounded-full bg-[#1b4f72] px-2 py-0.5 text-[10px] font-[800] uppercase text-white">{t("Admin", "مدير")}</span>}
                            </p>
                            <p className="truncate text-[12px] text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted">{fmtDay(u.createdAt, lang)}</td>
                      <td className="px-3 py-3 text-muted">{ago(lastSeen(u), lang, t)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Bar value={u.summary?.done ?? 0} max={total} />
                          <span className="duo-mono w-14 shrink-0 text-end text-[12px] text-muted">
                            {u.summary?.done ?? 0}/{total}
                          </span>
                        </div>
                      </td>
                      <td className="duo-mono px-3 py-3 text-end">{u.summary?.xp ?? 0}</td>
                      <td className="duo-mono px-3 py-3 text-end">{u.summary?.answered ? `${Math.round((u.summary.correct / u.summary.answered) * 100)} %` : "—"}</td>
                      <td className="px-4 py-3 text-end">
                        <button onClick={() => setOpen(u.id)} className="rounded-[10px] px-3 py-1.5 text-[13px] font-[800] text-[#2980b9] hover:bg-[#ebf5fb]">
                          {t("Gérer", "إدارة")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cartes (téléphone) */}
          {list && rows.length > 0 && (
            <ul className="divide-y-2 divide-line md:hidden">
              {rows.map((u) => (
                <li key={u.id}>
                  <button onClick={() => setOpen(u.id)} className="flex w-full items-center gap-3 p-4 text-start">
                    <Avatar name={u.name} admin={u.role === "admin"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-[800] text-ink">{u.name}</p>
                      <p className="truncate text-[12px] text-muted">
                        {u.email} · {ago(lastSeen(u), lang, t)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Bar value={u.summary?.done ?? 0} max={total} />
                        <span className="duo-mono shrink-0 text-[11px] text-muted">
                          {u.summary?.done ?? 0}/{total}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {adding && <AddUser onClose={() => setAdding(false)} onDone={load} />}
      {open && <UserDetail id={open} me={user!.id} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}
