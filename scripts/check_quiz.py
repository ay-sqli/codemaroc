"""
Contrôle la banque « Règles & chiffres » (content/quiz/*.json) avant génération de l'app.

Vérifie : JSON valide, champs obligatoires, ids uniques, chapitre existant, indices de réponse,
schéma connu, image présente dans la fiche du chapitre, doublons de formulation.

Usage : python scripts/check_quiz.py
"""
import glob
import json
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chapters import MODULES  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SCHEMAS = {'priorite', 'giratoire', 'distance', 'vitesses', 'sanctions', 'points', 'feux', 'marquage',
           'formes', 'hierarchie', 'depassement', 'stationnement', 'alcool', 'energie', 'pas'}
REQUIRED = ('id', 't', 'q', 'qa', 'o', 'a', 'e', 'r')

chapter_dir = {ch[0]: m['dir'] for m in MODULES for ch in m['chapters']}
chapter_imgs = {}
for slug, d in chapter_dir.items():
    md = os.path.join(BASE, 'content', d, f'{slug}.md')
    text = open(md, encoding='utf-8').read() if os.path.exists(md) else ''
    chapter_imgs[slug] = set(re.findall(r'\{img:([^}|]+)', text))


def norm(s):
    return re.sub(r'\W+', ' ', s.lower()).strip()


def norm_option(s):
    return re.sub(r'\s+', ' ', s.lower()).strip()


errors, per_chapter, ids, prompts = [], Counter(), Counter(), Counter()
total = 0
for path in sorted(glob.glob(os.path.join(BASE, 'content', 'quiz', '*.json'))):
    name = os.path.basename(path)
    try:
        items = json.load(open(path, encoding='utf-8'))
    except ValueError as e:
        errors.append(f'{name}: JSON invalide ({e})')
        continue
    for q in items:
        total += 1
        qid = q.get('id', '?')
        where = f'{name}:{qid}'
        missing = [k for k in REQUIRED if not q.get(k)]
        if missing:
            errors.append(f'{where}: champs manquants {missing}')
            continue
        ids[qid] += 1
        prompts[norm(q['q'])] += 1
        if q['t'] not in chapter_dir:
            errors.append(f'{where}: chapitre inconnu {q["t"]}')
        else:
            per_chapter[q['t']] += 1
        o, a = q['o'], q['a']
        if not (2 <= len(o) <= 4):
            errors.append(f'{where}: {len(o)} propositions')
        if len(set(map(norm_option, o))) != len(o):
            errors.append(f'{where}: propositions en double')
        if not a or any(not isinstance(i, int) or i < 0 or i >= len(o) for i in a) or len(set(a)) != len(a):
            errors.append(f'{where}: réponse invalide {a}')
        if q.get('s') and q['s'] not in SCHEMAS:
            errors.append(f'{where}: schéma inconnu {q["s"]}')
        if q.get('img') and q['img'] not in chapter_imgs.get(q['t'], ()):
            errors.append(f'{where}: image absente de la fiche {q["img"]}')
        if not re.search(r'[؀-ۿ]', q['qa']):
            errors.append(f'{where}: qa sans arabe')

errors += [f'id en double : {k} ×{n}' for k, n in ids.items() if n > 1]
dups = [k for k, n in prompts.items() if n > 1]

print(f'{total} questions de règles, {len(per_chapter)}/{len(chapter_dir)} chapitres couverts')
for m in MODULES:
    print(f"  {m['id']} {m['fr']}: " + ', '.join(f'{ch[0][:2]}={per_chapter[ch[0]]}' for ch in m['chapters']))
empty = [s for s in chapter_dir if not per_chapter[s]]
if empty:
    print('⚠️ chapitres sans question :', ', '.join(empty))
if dups:
    print(f'⚠️ {len(dups)} formulations identiques :', ' | '.join(dups[:10]))
for e in errors:
    print('❌', e)
print('✅ OK' if not errors else f'❌ {len(errors)} erreur(s)')
sys.exit(1 if errors else 0)
