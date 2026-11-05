import type { Metadata, Viewport } from "next";
import { Cairo, JetBrains_Mono, Nunito, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { LANG_BOOT } from "@/lib/i18n";

// Charte Code Maroc : titres ronds (Nunito), texte net (Plus Jakarta Sans), arabe (Cairo), chrono (JetBrains Mono).
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["600", "700", "800", "900"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const arabic = Cairo({ variable: "--font-arabic", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  // Adresse publique (liens absolus de l'image de partage public, app/opengraph-image.png).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://codemaroc.netlify.app"),
  applicationName: "Code Maroc",
  title: "Code Maroc — Révision du permis B",
  description: "Cours résumés, mindmaps, examens blancs corrigés, carnet d'erreurs et schémas interactifs pour réussir l'examen théorique du permis B. — دروس ملخصة، خرائط ذهنية، امتحانات تجريبية مصححة لاجتياز امتحان رخصة السياقة.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${nunito.variable} ${jakarta.variable} ${arabic.variable} ${mono.variable}`}
      // Motif zellige des bandeaux : chemin préfixé pour GitHub Pages (le CSS ne connaît pas le basePath).
      style={{ ["--zellige-url" as string]: `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/decor/zellige.webp)` }}
      suppressHydrationWarning
    >
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
