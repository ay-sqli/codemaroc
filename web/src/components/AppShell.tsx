"use client";

import { usePathname } from "next/navigation";
import { LangSync } from "@/lib/i18n";
import { ImageZoom } from "./ImageZoom";
import { GameShell } from "./game/GameShell";

export { Wordmark, LangSwitch, daysLabel } from "./Chrome";

/**
 * Cadre de l'application : barre latérale + colonne centrale (GameShell) sur toutes les pages,
 * plein écran sans navigation pendant une étape du parcours (/lecon).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const bare = path.startsWith("/lecon");
  return (
    <>
      <LangSync />
      <ImageZoom />
      {bare ? children : <GameShell>{children}</GameShell>}
    </>
  );
}
