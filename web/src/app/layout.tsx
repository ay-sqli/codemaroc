import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { LANG_BOOT } from "@/lib/i18n";

const source = Source_Sans_3({ variable: "--font-source", subsets: ["latin"], weight: ["400", "600", "700"] });
const arabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "codemaroc — Révision du permis B",
  description: "Cours résumés, mindmaps, examens blancs corrigés, carnet d'erreurs et schémas interactifs pour réussir l'examen théorique du permis B. — دروس ملخصة، خرائط ذهنية، امتحانات تجريبية مصححة لاجتياز امتحان رخصة السياقة.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${source.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
      </head>
      {/* suppressHydrationWarning : certaines extensions (ColorZilla, Grammarly…) ajoutent des attributs à <body> avant React. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
