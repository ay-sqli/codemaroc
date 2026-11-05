# Pièces de route du parcours

Les planches de routes dessinées sont découpées en pièces (`web/public/roads/*.webp`) et décrites
dans `web/src/data/roads.json` (pastilles + axe central entre pastilles). `web/src/lib/roadLayout.ts`
les enchaîne pastille contre pastille ; chaque étape du parcours se pose sur une pastille.

1. `python roads_slice.py <dossier des planches> <dossier de travail>` : découpe + fond transparent.
2. `python roads_discs.py <dossier de travail>` : position des pastilles (repères + recentrage).
3. `python roads_export.py <dossier de travail> web/public/roads web/src/data/roads.json`.
