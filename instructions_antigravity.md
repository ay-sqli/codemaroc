# Rôle & Instructions : NARSA Mindmaps & Flashcards Anki

## Mission
Pour chaque sous-cours extrait de Perminou déposé dans `inputs/[macro_module]/`, le script `scripts/parser.py` génère simultanément dans `outputs/` :
1. **Fichier Markdown (`.md`)** : liste structurée avec images locales calibrées pour Markmap / cartes mentales.
2. **Fichier CSV (`.csv`)** : fichier d'import pour Anki / répétition espacée (délimiteur `;`, encodage UTF-8).
   - **Colonne 1 (Recto)** : `<img src="...">` pointant vers l'image locale du panneau.
   - **Colonne 2 (Verso)** : texte nettoyé de l'explication / intitulé exact du cours en arabe.

## Structure du Projet (6 Macro-modules)
```text
narsa-mindmaps/
├── inputs/
│   ├── 01_la_route/                            (Macro-module 1 : الطريق)
│   │   ├── 01_signalisation_verticale/
│   │   ├── 02_dangers_priorites/
│   │   ├── 03_interdictions/ ... jusqu'à 16_virages_et_pentes/
│   ├── 02_regles_circulation/                  (Macro-module 2 : قواعد السير)
│   ├── 03_le_conducteur/                       (Macro-module 3 : السائق)
│   ├── 04_le_vehicule/                         (Macro-module 4 : المركبة)
│   ├── 05_infractions_sanctions/               (Macro-module 5 : المخالفات والعقوبات)
│   └── 06_principes_securite/                  (Macro-module 6 : المبادئ الأولية في السلامة الطرقية)
├── outputs/
│   ├── 01_signalisation_verticale.md / .csv
│   ├── 02_dangers_priorites.md / .csv
│   ├── 03_interdictions.md / .csv
│   ├── mindmap_01.html
│   ├── mindmap_02_finale.html
│   └── mindmap_03_finale.html
├── scripts/
│   ├── parser.py                               (Extracteur double MD + CSV)
│   ├── generate_html.py
│   ├── build_mindmap_02.py
│   └── build_mindmap_03.py
├── index.html                                  (Tableau de bord central Master-Detail)
└── instructions_antigravity.md
```

## Utilisation de parser.py
- **Par défaut** (cible `01_la_route`) :
  ```bash
  python scripts/parser.py
  ```
- **Cibler un autre macro-module** :
  ```bash
  python scripts/parser.py 02_regles_circulation
  ```

## Règles d'extraction
- **DOM** : Repérer les grilles et tableaux associant panneau et intitulé.
- **Titres exacts** : Ne pas résumer, conserver l'intitulé exact en retirant le libellé « الدارجة ».
- **Images** : Balises HTML `<img>` avec chemins relatifs calculés dynamiquement depuis `outputs/`.
- **CSV Anki** : Séparateur point-virgule (`;`), encodage UTF-8, 2 colonnes (Recto = Panneau, Verso = Réponse).