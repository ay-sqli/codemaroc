import type { NextConfig } from "next";

// Export statique : l'app tourne sans serveur ni base de données (fichiers locaux),
// et peut être hébergée telle quelle (Vercel, Netlify, GitHub Pages…).
// Sur GitHub Pages le site vit sous /<nom-du-dépôt> : le workflow fournit NEXT_PUBLIC_BASE_PATH (vide en local).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
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
