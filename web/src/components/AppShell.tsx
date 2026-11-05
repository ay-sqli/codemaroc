"use client";

import { usePathname } from "next/navigation";
import { LangSync } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { asset } from "@/lib/base";
import { ImageZoom } from "./ImageZoom";
import { GameShell } from "./game/GameShell";
import { CloudSync } from "./CloudSync";
import { NavTracker } from "./BackButton";
import { AuthScreen } from "./auth/AuthScreen";

export { Wordmark, LangSwitch, daysLabel } from "./Chrome";

/** Écran d'attente pendant la vérification de la session. */
function Splash() {
  return (
    <div className="duo grid min-h-dvh place-items-center bg-[var(--duo-canvas)]">
      <img src={asset("/brand/emblem.webp")} alt="Code Maroc" className="h-24 w-auto animate-pulse" />
    </div>
  );
}

/**
 * Cadre de l'application. Un compte est obligatoire : sans session, on affiche l'écran de
 * connexion / inscription. Le back-office (/admin) a son propre cadre et sa propre connexion.
 * Barre latérale + colonne centrale (GameShell) sur toutes les pages, plein écran pendant une étape (/lecon).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const { status } = useSession();
  const admin = path.startsWith("/admin");
  const bare = path.startsWith("/lecon");

  let body: React.ReactNode;
  if (admin) body = children;
  else if (status === "loading") body = <Splash />;
  else if (status === "guest") body = <AuthScreen />;
  else body = bare ? children : <GameShell>{children}</GameShell>;

  return (
    <>
      <LangSync />
      <NavTracker />
      <ImageZoom />
      <CloudSync />
      {body}
    </>
  );
}
