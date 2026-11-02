"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { api, refreshSession, useSession, type SessionUser } from "@/lib/session";
import { AuthField } from "@/components/auth/AuthScreen";

/** Fenêtre de connexion du back-office : seuls les comptes administrateurs peuvent entrer. */
export function AdminLogin() {
  const router = useRouter();
  const { status, user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Déjà connecté en tant qu'admin : direction le tableau de bord.
  useEffect(() => {
    if (status === "user" && user?.role === "admin") router.replace("/admin/");
  }, [status, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<{ user: SessionUser }>("/api/auth/login/", { method: "POST", json: { email, password, admin: true } });
      await refreshSession();
      router.replace("/admin/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="duo grid min-h-dvh place-items-center bg-[#0f1419] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-[20px] bg-[#1b4f72] text-white shadow-[0_5px_0_#11344c]">
            <ShieldCheck className="size-8" />
          </span>
          <p className="mt-4 text-[13px] font-[800] uppercase tracking-[0.2em] text-[#94a3b8]">Code Maroc</p>
          <h1 className="mt-1 text-[26px] font-[800] text-white" style={{ fontFamily: "var(--font-display)" }}>
            Back-office
          </h1>
          <p className="mt-1 text-[14px] text-[#94a3b8]">Accès réservé aux administrateurs.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-[24px] bg-white p-6 shadow-[0_5px_0_#25303d]">
          <AuthField icon={Mail} label="E-mail administrateur" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <AuthField icon={Lock} label="Mot de passe" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          {error && (
            <p role="alert" className="rounded-[12px] border-2 border-[#ffb2b2] bg-[#fdedec] px-3 py-2 text-[14px] font-[700] text-[#c0392b]">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="duo-btn duo-btn-blue w-full">
            {busy && <Loader2 className="size-5 animate-spin" />} Se connecter
          </button>
          <p className="text-center text-[12px] text-muted">Le tout premier compte créé dans l&apos;application est administrateur.</p>
        </form>
      </div>
    </div>
  );
}
