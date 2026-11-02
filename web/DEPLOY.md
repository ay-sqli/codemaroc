# Mettre Code Maroc en ligne (Vercel + MongoDB Atlas)

L'application a maintenant un serveur (comptes, progression, back-office) : elle ne peut plus être
hébergée sur GitHub Pages, qui ne sert que des fichiers statiques. Vercel héberge gratuitement les
applications Next.js avec leurs routes `/api`.

## 1. MongoDB Atlas : autoriser Vercel

Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`).
Vercel n'a pas d'adresse IP fixe ; la base reste protégée par l'utilisateur et le mot de passe.

## 2. Vercel : importer le projet

1. Va sur <https://vercel.com>, connecte-toi avec GitHub.
2. **Add New → Project** → choisis le dépôt `ay-sqli/codemaroc`.
3. **Root Directory** : `web` (important).
4. **Environment Variables** — ajoute les 3 variables de ton fichier `web/.env.local` :

| Nom | Valeur |
| --- | --- |
| `MONGODB_URI` | la chaîne `mongodb+srv://…` d'Atlas |
| `MONGODB_DB` | `codemaroc` |
| `AUTH_SECRET` | la valeur de `web/.env.local` (ou une nouvelle chaîne aléatoire de 48 caractères) |

5. **Deploy**. Chaque push sur `main` redéploie ensuite automatiquement.

## 3. Premier compte = administrateur

Ouvre le site, crée ton compte : le **tout premier compte** devient administrateur.
Le back-office est à l'adresse `/admin` (connexion dédiée : `/admin/connexion`).

## En local

```bash
cd web
npm install
npm run dev
```

Les variables sont lues dans `web/.env.local` (jamais commité, voir `web/.env.example`).
