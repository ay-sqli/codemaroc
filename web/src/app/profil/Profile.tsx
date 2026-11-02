"use client";

import Link from "next/link";
import { useState } from "react";
import { CloudCheck, CloudOff, Loader2, Lock, LogOut, RefreshCw, ShieldCheck, Trash2, User } from "lucide-react";
import { api, logout, updateSessionUser, useSession, type SessionUser } from "@/lib/session";
import { fmtDate, useLang } from "@/lib/i18n";
import { streak, useStore } from "@/lib/store";
import { flushProgress, useSyncStatus } from "@/components/CloudSync";
import { useGameStats } from "@/components/game/GameShell";
import { GameIcon } from "@/components/game/GameIcon";
import { AuthField } from "@/components/auth/AuthScreen";
import { cx } from "@/components/ui";

function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[24px] border-2 border-line bg-white p-4 shadow-[0_4px_0_var(--c-grey-300)] sm:p-6", className)}>
      {title && <h2 className="mb-4 text-[18px] font-[800] text-[var(--c-grey-975)]">{title}</h2>}
      {children}
    </section>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return <p className={cx("rounded-[12px] px-3 py-2 text-[14px] font-[700]", ok ? "bg-[#eafaf1] text-[#198754]" : "bg-[#fdedec] text-[#c0392b]")}>{text}</p>;
}

export function Profile() {
  const { lang, t } = useLang();
  const { user } = useSession();
  const sync = useSyncStatus();
  const stats = useGameStats();
  const answers = useStore((s) => s.answers);
  const exams = useStore((s) => s.exams);
  const days = useStore((s) => s.days);
  const [name, setName] = useState(user?.name ?? "");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [del, setDel] = useState("");
  const [msg, setMsg] = useState<{ k: string; ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (!user) return null;

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

  const seen = Object.keys(answers).length;
  const ok = Object.values(answers).filter((a) => a.lastOk).length;
  const best = exams.reduce((m, e) => Math.max(m, e.score), 0);
  const syncLabel =
    sync.s === "saved" && sync.at
      ? t(`Sauvegardée à ${new Date(sync.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, `حُفظ على الساعة ${new Date(sync.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`)
      : sync.s === "syncing"
        ? t("Sauvegarde en cours…", "جار الحفظ…")
        : sync.s === "offline"
          ? t("Hors ligne : sauvegarde dès le retour du réseau", "غير متصل: سيتم الحفظ عند عودة الشبكة")
          : sync.s === "error"
            ? t("Sauvegarde impossible pour l'instant", "تعذر الحفظ حاليا")
            : t("Sauvegarde automatique activée", "الحفظ التلقائي مفعل");

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {/* Identité */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#d92b2b] text-[26px] font-[900] text-white shadow-[0_4px_0_#a81c1c]" style={{ fontFamily: "var(--font-display)" }}>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 basis-[55%]">
            <h1 className="break-words text-[22px] font-[800] leading-tight text-[var(--c-grey-975)] sm:text-[24px]">{user.name}</h1>
            <p className="truncate text-[14px] text-muted" dir="ltr">
              {user.email}
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              {t("Membre depuis le", "عضو منذ")} {fmtDate(user.createdAt, lang, { day: "numeric", month: "long", year: "numeric" })}
              {user.role === "admin" && (
                <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-[#1b4f72] px-2 py-0.5 text-[11px] font-[800] text-white">
                  <ShieldCheck className="size-3.5" /> Admin
                </span>
              )}
            </p>
          </div>
          {user.role === "admin" && (
            <Link href="/admin/" className="duo-btn duo-btn-blue !min-h-11 w-full !px-4 !text-[13px] sm:w-auto">
              <ShieldCheck className="size-4" /> {t("Back-office", "لوحة الإدارة")}
            </Link>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[16px] bg-panel p-3">
          {sync.s === "error" || sync.s === "offline" ? <CloudOff className="size-6 text-[#c0392b]" /> : <CloudCheck className="size-6 text-[#198754]" />}
          <div className="min-w-0 flex-1 basis-[60%]">
            <p className="text-[14px] font-[800] text-ink">{t("Ta progression est enregistrée dans ton compte", "تقدمك محفوظ في حسابك")}</p>
            <p className="text-[13px] text-muted">{syncLabel}</p>
          </div>
          <button onClick={() => void flushProgress()} className="duo-btn duo-btn-ghost !min-h-10 w-full !px-3 !text-[12px] sm:w-auto">
            <RefreshCw className={cx("size-4", sync.s === "syncing" && "animate-spin")} /> {t("Sauvegarder", "حفظ")}
          </button>
        </div>
      </Card>

      {/* Chiffres */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: "crown" as const, v: `${stats.done}/${stats.total || "…"}`, l: t("Étapes validées", "مراحل مكتملة") },
          { icon: "xp" as const, v: String(stats.xp), l: "XP" },
          { icon: "flame" as const, v: String(streak(days)), l: t("Jours d'affilée", "أيام متتالية") },
          { icon: "champion" as const, v: best ? `${best}/40` : "—", l: t("Meilleur examen", "أفضل امتحان") },
        ].map((x) => (
          <div key={x.l} className="flex items-center gap-3 rounded-[20px] border-2 border-line bg-white p-3 shadow-[0_3px_0_var(--c-grey-300)]">
            <GameIcon name={x.icon} size={40} />
            <div className="min-w-0">
              <p className="duo-mono text-[18px] font-[700] text-ink">{x.v}</p>
              <p className="truncate text-[12px] text-muted">{x.l}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="px-1 text-[13px] text-muted">
        {t(`${seen} question${seen > 1 ? "s" : ""} déjà vue${seen > 1 ? "s" : ""}, dont ${ok} réussie${ok > 1 ? "s" : ""} la dernière fois.`, `${seen} سؤالا تمت رؤيتها، منها ${ok} أجبت عنها بشكل صحيح آخر مرة.`)}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title={t("Mon nom", "اسمي")}>
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

        <Card title={t("Changer de mot de passe", "تغيير كلمة المرور")}>
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
          <div>
            <p className="text-[16px] font-[800] text-ink">{t("Se déconnecter", "تسجيل الخروج")}</p>
            <p className="text-[13px] text-muted">{t("Ta progression reste dans ton compte.", "يبقى تقدمك محفوظا في حسابك.")}</p>
          </div>
          <button
            className="duo-btn duo-btn-ghost !min-h-11"
            onClick={async () => {
              await flushProgress();
              await logout();
            }}
          >
            <LogOut className="size-4" /> {t("Déconnexion", "خروج")}
          </button>
        </div>
      </Card>

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
    </div>
  );
}
