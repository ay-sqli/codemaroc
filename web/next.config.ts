import type { NextConfig } from "next";

// Application avec serveur : les routes /api (comptes, progression, back-office) parlent à MongoDB Atlas.
// Hébergement recommandé : Vercel (voir web/DEPLOY.md). NEXT_PUBLIC_BASE_PATH reste possible si le site
// est servi sous un sous-dossier (vide par défaut).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // Le pilote MongoDB et bcrypt restent des dépendances Node côté serveur (pas de bundling).
  serverExternalPackages: ["mongodb", "bcryptjs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
        // Ne pas toucher au CSS généré par next/font : le loader réécrit ses url(...?{...})
        // et casse la résolution des fichiers de police (« queries have exactly one entry »).
        condition: { not: { path: /internal[\\/]font[\\/]/ } },
      },
    },
  },
};

export default nextConfig;
