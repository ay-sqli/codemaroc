"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";
import { login, register } from "@/lib/session";
import { LangSwitch, Wordmark } from "@/components/Chrome";
import { cx } from "@/components/ui";

/** Champ de formulaire du style Code Maroc (icône, libellé, message d'erreur). */
export function AuthField({
  icon: Icon, label, type = "text", value, onChange, autoComplete, placeholder,
}: {
  icon: typeof Mail;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-[700] text-ink">{label}</span>
      <span className="flex h-[52px] items-center gap-2.5 rounded-[14px] border-2 border-line bg-white px-3.5 focus-within:border-[#2980b9]">
        <Icon className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <input
          type={isPw && !show ? "password" : isPw ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          dir={type === "email" || isPw ? "ltr" : undefined}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-subtle"
        />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} className="grid size-8 place-items-center rounded-[8px] text-muted hover:bg-panel" aria-label={show ? "Masquer" : "Afficher"}>
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </span>
    </label>
  );
}

/** Écran d'accueil : connexion ou création de compte (obligatoire pour utiliser l'app). */
export function AuthScreen({ onDone }: { onDone?: () => void }) {
  const { t } = useLang();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="duo min-h-dvh bg-[var(--duo-canvas)]">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] items-center gap-5 px-4 py-5 sm:py-8 lg:grid-cols-2 lg:gap-16">
        {/* Présentation */}
        <div className="text-center lg:text-start">
          <div className="mb-3 flex items-center justify-between sm:mb-6 lg:justify-start lg:gap-8">
            <Wordmark className="!h-[64px] !w-auto sm:!h-[88px]" />
            <LangSwitch className="lg:hidden" />
          </div>
          <img src={asset("/mascot/welcome.webp")} alt="" className="mx-auto h-24 w-auto sm:h-44 lg:mx-0 lg:h-52" />
          <h1 className="mt-3 text-[22px] font-[800] leading-tight text-[var(--c-grey-975)] sm:mt-4 sm:text-[36px]" style={{ fontFamily: "var(--font-display)" }}>
            {t("Prépare ton permis B, étape par étape", "حضّر رخصة السياقة صنف ب، مرحلة بعد مرحلة")}
          </h1>
          <ul className="mx-auto mt-4 hidden max-w-md space-y-2 text-start text-[15px] text-ink-2 sm:block lg:mx-0">
            {[
              [t("2 300 questions de l'examen, de la plus facile à la plus difficile", "2300 سؤال من الامتحان، من الأسهل إلى الأصعب")],
              [t("Cours express, schémas animés et examen final", "دروس سريعة، رسوم متحركة وامتحان نهائي")],
              [t("Ta progression sauvegardée dans ton compte, sur tous tes appareils", "تقدمك محفوظ في حسابك، على كل أجهزتك")],
            ].map(([x]) => (
              <li key={x} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#198754]" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        {/* Formulaire */}
        <div className="mx-auto w-full max-w-[440px] rounded-[24px] border-2 border-line bg-white p-5 shadow-[0_5px_0_var(--c-grey-300)] sm:p-7">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-[14px] bg-panel p-1" role="tablist">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cx("h-11 rounded-[11px] text-[14px] font-[800] transition-colors", mode === m ? "bg-white text-[#d92b2b] shadow-[0_2px_0_var(--c-grey-300)]" : "text-muted")}
              >
                {m === "register" ? t("Créer un compte", "إنشاء حساب") : t("Se connecter", "تسجيل الدخول")}
              </button>
            ))}
          </div>
          <h2 className="text-[22px] font-[800] text-[var(--c-grey-975)]">
            {mode === "register" ? t("Bienvenue !", "مرحبا !") : t("Bon retour !", "مرحبا بعودتك !")}
          </h2>
          <p className="mb-5 mt-1 text-[14px] text-muted">
            {mode === "register"
              ? t("Crée ton compte pour commencer et garder ta progression.", "أنشئ حسابك للبدء والاحتفاظ بتقدمك.")
              : t("Connecte-toi pour reprendre là où tu t'es arrêté.", "سجّل الدخول لتستأنف من حيث توقفت.")}
          </p>
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && <AuthField icon={User} label={t("Prénom ou pseudo", "الاسم أو اللقب")} value={name} onChange={setName} autoComplete="name" />}
            <AuthField icon={Mail} label={t("Adresse e-mail", "البريد الإلكتروني")} type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="nom@exemple.com" />
            <AuthField
              icon={Lock}
              label={t("Mot de passe", "كلمة المرور")}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? t("8 caractères minimum", "8 أحرف على الأقل") : ""}
            />
            {error && (
              <p role="alert" className="rounded-[12px] border-2 border-[#ffb2b2] bg-[#fdedec] px-3 py-2 text-[14px] font-[700] text-[#c0392b]">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="duo-btn w-full">
              {busy && <Loader2 className="size-5 animate-spin" />}
              {mode === "register" ? t("Créer mon compte", "إنشاء حسابي") : t("Se connecter", "تسجيل الدخول")}
            </button>
          </form>
          <p className="mt-4 text-center text-[13px] text-muted">
            {t("Mot de passe chiffré : personne ne peut le voir, même l'administrateur.", "كلمة المرور مشفرة: لا يمكن لأحد رؤيتها، حتى المدير.")}
          </p>
        </div>
      </div>
    </div>
  );
}
