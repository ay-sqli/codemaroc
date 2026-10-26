# Banque « Règles & chiffres » — format et règles de rédaction

Ce dossier contient les questions rédigées à partir des fiches de cours (`content/<module>/<chapitre>.md`).
Chaque fichier `*.json` est un tableau JSON de questions. `scripts/build_app.py` les fusionne dans
`web/public/data/quiz.json`, et l'app les affiche dans le mode « Règles & chiffres », le mélange,
les quiz de chapitre et l'examen blanc.

## Format d'une question

```json
{
  "id": "03_vitesse-07",
  "t": "03_vitesse",
  "q": "Hors agglomération, un taxi est limité à :",
  "qa": "خارج التجمعات العمرانية، سرعة سيارة الأجرة محددة في :",
  "o": ["80 km/h", "90 km/h", "100 km/h", "120 km/h"],
  "a": [1],
  "e": "Les taxis ont leurs propres limites : 60 en ville, 90 hors agglomération (et non 100 comme les voitures), 120 sur autoroute.",
  "r": "Taxi : 60 / 90 / 120.",
  "s": "vitesses"
}
```

| Champ | Obligatoire | Contenu |
|---|---|---|
| `id` | oui | `<slug du chapitre>-<numéro sur 2 chiffres>`, unique |
| `t` | oui | slug exact du chapitre (nom du fichier `.md` sans extension) |
| `q` | oui | question en français, claire, au style examen |
| `qa` | oui | la même question en arabe standard, avec le vocabulaire des fiches |
| `o` | oui | 2 à 4 propositions (français ; on peut ajouter le terme arabe entre parenthèses) |
| `a` | oui | indices **à partir de 0** des bonnes propositions (une ou plusieurs) |
| `e` | oui | explication (1 à 3 phrases) : pourquoi c'est juste, pourquoi le piège est faux |
| `r` | oui | règle à retenir, très courte (≤ 70 caractères) |
| `s` | non | schéma interactif lié, parmi : `priorite`, `giratoire`, `distance`, `vitesses`, `sanctions`, `points`, `feux`, `marquage`, `formes`, `hierarchie`, `depassement`, `stationnement`, `alcool`, `energie`, `pas` |
| `img` | non | nom d'une image du chapitre, tel qu'il apparaît dans un jeton `{img:NOM}` de la fiche (ex. `1704711284037.png`) |

## Règles de rédaction

1. **Exactitude d'abord** : chaque bonne réponse doit être justifiée par la fiche du chapitre (ou une autre fiche de `content/`). Pas de règle inventée. En cas de doute, ne pas écrire la question.
2. **Style examen marocain** : chiffres (vitesses, distances, délais, montants, points), conditions, « qui passe », « que dois-je faire », vrai/faux piège, questions à plusieurs bonnes réponses (« Quelles propositions sont justes ? »).
3. **Distracteurs crédibles** : valeurs proches, confusions classiques (وقوف / توقف, position / croisement, délit / contravention, 1re / 2e / 3e catégorie…).
4. **Varier la position** de la bonne réponse et le nombre de bonnes réponses.
5. **Pas de doublon** : une même règle n'est testée qu'une fois par formulation.
6. `img` uniquement si l'image aide vraiment (panneau à reconnaître, schéma) et seulement avec un nom présent dans la fiche.
7. JSON valide, UTF-8, sans commentaires.
