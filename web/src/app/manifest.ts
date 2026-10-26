import type { MetadataRoute } from "next";
import { asset } from "@/lib/base";

export const dynamic = "force-static";

/** Permet « Ajouter à l'écran d'accueil » sur téléphone (ouverture plein écran, icône codemaroc). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "codemaroc — Révision du permis B",
    short_name: "codemaroc",
    description: "Cours, mindmaps et examens blancs pour l'examen théorique du permis B.",
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: asset("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: asset("/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
