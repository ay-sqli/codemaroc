"""
Générateur central de l'application de révision NARSA.

Entrée  : content/<module>/<chapitre>.md  (Markdown + jetons {img:NOM} ou {img:NOM|big})
          content/exam/*.json             (corrigés de la banque d'examen)
Sorties : outputs/mindmaps/<chapitre>.html  (carte mentale Markmap, même style que mindmap_03_finale)
          outputs/anki/<chapitre>.csv        (cartes Anki : Recto = image ; Verso = intitulé)
          web/src/data/courses.json          (cours pour l'app Next.js)
          web/public/data/*.json             (cartes, examen, quiz) + médias dans web/public

Usage : python scripts/build_app.py
"""
import csv
import glob
import json
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chapters import MODULES  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
IMG_RE = re.compile(r'\{img:([^}|]+)(?:\|(big|xl))?\}')
IMG_EXT = ('.png', '.jpg', '.jpeg', '.gif', '.webp')


def safe_name(name):
    return re.sub(r'[^A-Za-z0-9._-]', '_', name)


def rel(path, start):
    return os.path.relpath(path, start).replace('\\', '/')


# ---------------------------------------------------------------- images
def build_image_index():
    """{slug: {nom: chemin_absolu}} + index global {nom: chemin_absolu}."""
    per_chapter, global_index = {}, {}
    for mod in MODULES:
        for ch in mod['chapters']:
            d = os.path.join(BASE, 'inputs', mod['dir'], ch[0])
            found = {}
            for sub in glob.glob(os.path.join(d, '*')):
                if not os.path.isdir(sub):
                    continue
                for f in os.listdir(sub):
                    if f.lower().endswith(IMG_EXT):
                        found[f] = os.path.join(sub, f)
            per_chapter[ch[0]] = found
            for k, v in found.items():
                global_index.setdefault(k, v)
    return per_chapter, global_index


def resolve(name, slug, per_chapter, global_index):
    for candidate in (name, safe_name(name)):
        if candidate in per_chapter.get(slug, {}):
            return per_chapter[slug][candidate]
        if candidate in global_index:
            return global_index[candidate]
    return None


# ---------------------------------------------------------------- markdown
def render_md(md, slug, start_dir, per_chapter, global_index, missing):
    """Remplace les jetons {img:} par des balises <img> relatives à start_dir."""
    def sub(m):
        path = resolve(m.group(1), slug, per_chapter, global_index)
        if not path:
            missing.append(f'{slug}: {m.group(1)}')
            return ''
        cls = f' class="{m.group(2)}"' if m.group(2) else ''
        return f'<img src="{rel(path, start_dir)}"{cls}>'
    return IMG_RE.sub(sub, md)


def extract_cards(md, slug, per_chapter, global_index):
    """Éléments de liste « {img:X} **intitulé** » → cartes (quiz + Anki)."""
    cards, section = [], ''
    for line in md.splitlines():
        if line.startswith('## '):
            section = line[3:].strip()
            continue
        m = re.match(r'\s*-\s*\{img:([^}|]+)(?:\|\w+)?\}\s*(.+)$', line)
        if not m or '**' not in m.group(2):
            continue
        label = m.group(2).replace('**', '').strip()
        label = re.sub(r'\s*\{img:[^}]+\}', '', label).strip(' :')
        path = resolve(m.group(1), slug, per_chapter, global_index)
        if path and label:
            cards.append({'img': rel(path, BASE), 'label': label, 'section': section})
    return cards


MINDMAP_TEMPLATE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__TITLE__</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            width: 100%; height: 100%; overflow: hidden;
            font-family: 'Tajawal', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8f9fa;
        }
        #mindmap { width: 100vw; height: 100vh; display: block; }
        /* CSS anti-troncature et affichage optimal des noeuds Markmap */
        .markmap-node foreignObject { overflow: visible !important; }
        .markmap-node foreignObject > div {
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        .markmap-node img {
            vertical-align: middle;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 2px;
            height: 35px !important;
            width: auto !important;
            display: inline-block !important;
        }
        .markmap-node img.big { height: 110px !important; }
        .markmap-node img.xl { height: 180px !important; }
        /* Boutons flottants (haut gauche) */
        .toolbar { position: fixed; top: 15px; left: 15px; z-index: 9999; display: flex; gap: 8px; }
        .btn-home {
            background: linear-gradient(135deg, #0056a4, #003d7a);
            color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 25px;
            font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 14px rgba(0, 86, 164, 0.3);
            display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(5px);
            font-family: system-ui, -apple-system, sans-serif;
        }
        .btn-home:hover {
            background: linear-gradient(135deg, #ff7e00, #e67000);
            box-shadow: 0 6px 18px rgba(255, 126, 0, 0.4);
            transform: translateY(-2px) scale(1.03);
        }
        .btn-home svg { width: 16px; height: 16px; fill: currentColor; }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.18.12/dist/browser/index.iife.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/markmap-view@0.18.12/dist/browser/index.js"></script>
</head>
<body>
    <div class="toolbar">
        <a href="__HOME__" class="btn-home" title="العودة إلى التطبيق">
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>الرئيسية</span>
        </a>
        <a href="__FICHE__" class="btn-home" title="ملخص الدرس">📖 <span>الملخص</span></a>
        <span class="btn-home" onclick="window.__mm && window.__mm.fit()">⤢ <span>ملاءمة</span></span>
    </div>
    <svg id="mindmap"></svg>
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            const markdownContent = __MD__;
            const { Transformer, Markmap } = window.markmap;
            const transformer = new Transformer();
            const { root } = transformer.transform(markdownContent);
            const mm = Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0, initialExpandLevel: 3 }, root);
            window.__mm = mm;
            setTimeout(() => { if (mm && mm.fit) mm.fit(); }, 300);
            document.querySelectorAll('#mindmap img').forEach(img => {
                img.addEventListener('load', () => { if (mm && mm.fit) mm.fit(); });
            });
        });
    </script>
</body>
</html>
"""


def write_mindmap(md_html, title, slug, out_dir):
    html = (MINDMAP_TEMPLATE
            .replace('__TITLE__', f'Carte Mentale - {title}')
            .replace('__HOME__', '../../index.html#/')
            .replace('__FICHE__', f'../../index.html#/cours/{slug}')
            .replace('__MD__', json.dumps(md_html, ensure_ascii=False)))
    with open(os.path.join(out_dir, f'{slug}.html'), 'w', encoding='utf-8') as f:
        f.write(html)


def write_anki(cards, slug, out_dir):
    with open(os.path.join(out_dir, f'{slug}.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter=';', quoting=csv.QUOTE_MINIMAL)
        for c in cards:
            w.writerow([f'<img src="{rel(os.path.join(BASE, c["img"]), out_dir)}">', c['label']])


# ---------------------------------------------------------------- examen
def load_exam_bank():
    bank = []
    for f in sorted(glob.glob(os.path.join(BASE, 'content', 'exam', '*.json'))):
        with open(f, encoding='utf-8') as fh:
            bank.extend(json.load(fh))
    seen, out = set(), []
    for q in bank:
        if q['id'] in seen:
            continue
        seen.add(q['id'])
        img = os.path.join(BASE, 'exam_bank', 'images', f'{q["id"]}.jpg')
        snd = os.path.join(BASE, 'exam_bank', 'audio', f'{q["id"]}.mp3')
        if not os.path.exists(img):
            print(f'⚠️ image manquante pour la question {q["id"]}')
            continue
        q['img'] = rel(img, BASE)
        q['audio'] = rel(snd, BASE) if os.path.exists(snd) else None
        out.append(q)
    return out


def legacy_cards(slug):
    """Cartes des CSV historiques (chapitres 01–03, plus complets que leur mindmap)."""
    path = os.path.join(BASE, 'outputs', f'{slug}.csv')
    if not os.path.exists(path):
        return []
    cards = []
    with open(path, encoding='utf-8') as f:
        for row in csv.reader(f, delimiter=';'):
            m = re.search(r'src="([^"]+)"', row[0]) if row else None
            if not m or len(row) < 2:
                continue
            img = os.path.normpath(os.path.join(BASE, 'outputs', m.group(1)))
            if os.path.exists(img):
                cards.append({'img': rel(img, BASE), 'label': row[1].strip(), 'section': ''})
    return cards


# ---------------------------------------------------------------- export web (Next.js)
WEB = os.path.join(BASE, 'web')


class MediaExporter:
    """Copie les images utilisées vers web/public/media/<module>/<chapitre>/ et donne leur URL."""

    def __init__(self):
        self.urls = {}

    def url(self, rel_path):
        if rel_path in self.urls:
            return self.urls[rel_path]
        parts = rel_path.split('/')
        # inputs/<module>/<chapitre>/<sous-dossier>/<fichier>
        sub = '/'.join(parts[1:3]) if parts[0] == 'inputs' else 'misc'
        url = f'/media/{sub}/{safe_name(parts[-1])}'
        dest = os.path.join(WEB, 'public', url.lstrip('/'))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        src = os.path.join(BASE, rel_path)
        if not os.path.exists(dest) or os.path.getsize(dest) != os.path.getsize(src):
            shutil.copyfile(src, dest)
        self.urls[rel_path] = url
        return url

    def rewrite_md(self, md):
        return re.sub(r'src="(inputs/[^"]+)"', lambda m: f'src="{self.url(m.group(1))}"', md)


def copy_tree(src, dest):
    os.makedirs(dest, exist_ok=True)
    for f in os.listdir(src):
        s, d = os.path.join(src, f), os.path.join(dest, f)
        if os.path.isfile(s) and (not os.path.exists(d) or os.path.getsize(d) != os.path.getsize(s)):
            shutil.copyfile(s, d)


def load_json_dir(sub):
    items = []
    for f in sorted(glob.glob(os.path.join(BASE, 'content', sub, '*.json'))):
        with open(f, encoding='utf-8') as fh:
            items.extend(json.load(fh))
    return items


def load_quiz(media, per_chapter, global_index):
    """Questions de règles : `img` peut être un nom d'image de la fiche du chapitre → URL web."""
    out, seen = [], set()
    for q in load_json_dir('quiz'):
        if q['id'] in seen:
            print(f'⚠️ question de règles en double : {q["id"]}')
            continue
        seen.add(q['id'])
        img = q.get('img')
        if img and not img.startswith('/'):
            path = resolve(img, q['t'], per_chapter, global_index)
            if path:
                q['img'] = media.url(rel(path, BASE))
            else:
                print(f'⚠️ image introuvable pour la question {q["id"]} : {img}')
                q.pop('img')
        out.append(q)
    return out


def load_i18n(sub):
    """Traductions arabes : content/i18n/<sub>/*.json → {id: {champ: valeur}}."""
    out = {}
    for f in sorted(glob.glob(os.path.join(BASE, 'content', 'i18n', sub, '*.json'))):
        with open(f, encoding='utf-8') as fh:
            out.update(json.load(fh))
    return out


def merge_memo():
    """memo.json + memo.ar.json → champs titleAr / introAr / qa / aa / ha."""
    with open(os.path.join(BASE, 'content', 'memo.json'), encoding='utf-8') as fh:
        memo = json.load(fh)
    ar_path = os.path.join(BASE, 'content', 'i18n', 'memo.ar.json')
    if os.path.exists(ar_path):
        with open(ar_path, encoding='utf-8') as fh:
            ar = {g['id']: g for g in json.load(fh)}
        for g in memo:
            t = ar.get(g['id'])
            if not t:
                print(f'⚠️ mémo sans traduction : {g["id"]}')
                continue
            g['titleAr'], g['introAr'] = t['title'], t['intro']
            if len(t['items']) != len(g['items']):
                print(f'⚠️ mémo {g["id"]} : {len(t["items"])} items arabes pour {len(g["items"])}')
            for it, ti in zip(g['items'], t['items']):
                it['qa'], it['aa'], it['ha'] = ti['q'], ti['a'], ti['hook']
    return memo


def export_web(modules_out, bank, per_chapter, global_index):
    if not os.path.isdir(WEB):
        return
    media = MediaExporter()
    src_data = os.path.join(WEB, 'src', 'data')
    pub_data = os.path.join(WEB, 'public', 'data')
    for d in (src_data, pub_data):
        os.makedirs(d, exist_ok=True)

    courses, cards = [], []
    for mod in modules_out:
        chapters = []
        for ch in mod['chapters']:
            c = {k: v for k, v in ch.items() if k not in ('md', 'cards', 'mindmap', 'anki')}
            if ch['ready']:
                c['md'] = media.rewrite_md(ch['md'])
                c['nCards'] = len(ch['cards'])
                for card in ch['cards']:
                    cards.append({'img': media.url(card['img']), 'label': card['label'],
                                  'section': card['section'], 'chapter': ch['slug'], 'module': mod['id']})
            chapters.append(c)
        courses.append({k: v for k, v in mod.items() if k != 'chapters'} | {'chapters': chapters})

    # Dédoublonnage des cartes (même image + même intitulé)
    seen, uniq = set(), []
    for c in cards:
        key = (c['img'], c['label'])
        if key not in seen:
            seen.add(key)
            uniq.append(c)

    exam = []
    exam_ar = load_i18n('exam_ar')
    for q in bank:
        q = dict(q)
        t = exam_ar.get(q['id'])
        if t:
            q['qa'], q['ea'], q['ra'] = t.get('q'), t.get('e'), t.get('r')
        q['img'] = '/' + q['img']
        q['audio'] = '/' + q['audio'] if q.get('audio') else None
        exam.append(q)
    copy_tree(os.path.join(BASE, 'exam_bank', 'images'), os.path.join(WEB, 'public', 'exam_bank', 'images'))
    copy_tree(os.path.join(BASE, 'exam_bank', 'audio'), os.path.join(WEB, 'public', 'exam_bank', 'audio'))

    def dump(path, obj):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False)

    # Cartes Anki pour l'app : <img src="nom.png"> (copier les images dans collection.media d'Anki)
    anki = os.path.join(WEB, 'public', 'anki')
    os.makedirs(anki, exist_ok=True)
    for slug in {c['chapter'] for c in uniq}:
        with open(os.path.join(anki, f'{slug}.csv'), 'w', encoding='utf-8', newline='') as f:
            w = csv.writer(f, delimiter=';')
            for c in uniq:
                if c['chapter'] == slug:
                    w.writerow([f'<img src="{c["img"].rsplit("/", 1)[-1]}">', c['label']])

    dump(os.path.join(src_data, 'courses.json'), courses)
    dump(os.path.join(pub_data, 'cards.json'), uniq)
    dump(os.path.join(pub_data, 'exam.json'), exam)
    quiz = load_quiz(media, per_chapter, global_index)
    quiz_ar = load_i18n('quiz_ar')
    for q in quiz:
        t = quiz_ar.get(q['id'])
        if not t:
            continue
        if len(t.get('o', [])) == len(q['o']):
            q['oa'] = t['o']
        else:
            print(f'⚠️ traduction {q["id"]} : nombre de propositions différent')
        q['ea'], q['ra'] = t.get('e'), t.get('r')
    dump(os.path.join(pub_data, 'quiz.json'), quiz)
    dump(os.path.join(src_data, 'memo.json'), merge_memo())
    n_ar = sum(1 for q in quiz if q.get('ea'))
    n_ex = sum(1 for q in exam if q.get('ea'))
    print(f'🌍 arabe : {n_ar}/{len(quiz)} questions de règles, {n_ex}/{len(exam)} questions officielles traduites')
    print(f'🌐 web : {len(uniq)} cartes, {len(exam)} questions officielles, {len(quiz)} questions de règles, '
          f'{len(media.urls)} images copiées')


# ---------------------------------------------------------------- main
def main():
    per_chapter, global_index = build_image_index()
    mm_dir = os.path.join(BASE, 'outputs', 'mindmaps')
    anki_dir = os.path.join(BASE, 'outputs', 'anki')
    for d in (mm_dir, anki_dir):
        os.makedirs(d, exist_ok=True)

    missing, modules_out, total_cards, done = [], [], 0, 0
    for mod in MODULES:
        chapters_out = []
        for slug, pid, emoji, ar, fr, color in mod['chapters']:
            src = os.path.join(BASE, 'content', mod['dir'], f'{slug}.md')
            entry = {'slug': slug, 'pid': pid, 'emoji': emoji, 'ar': ar, 'fr': fr,
                     'color': color, 'module': mod['id'], 'ready': False}
            if os.path.exists(src):
                with open(src, encoding='utf-8') as f:
                    md = f.read()
                cards = extract_cards(md, slug, per_chapter, global_index)
                known = {c['img'] for c in cards}
                cards += [c for c in legacy_cards(slug) if c['img'] not in known]
                write_mindmap(render_md(md, slug, mm_dir, per_chapter, global_index, missing), fr, slug, mm_dir)
                if cards:
                    write_anki(cards, slug, anki_dir)
                entry.update({
                    'ready': True,
                    'md': render_md(md, slug, BASE, per_chapter, global_index, []),
                    'cards': cards,
                    'mindmap': f'outputs/mindmaps/{slug}.html',
                    'anki': f'outputs/anki/{slug}.csv' if cards else None,
                })
                total_cards += len(cards)
                done += 1
            chapters_out.append(entry)
        modules_out.append({k: mod[k] for k in ('id', 'dir', 'emoji', 'ar', 'fr', 'desc')} | {'chapters': chapters_out})

    bank = load_exam_bank()
    export_web(modules_out, bank, per_chapter, global_index)

    n_ch = sum(len(m['chapters']) for m in MODULES)
    print(f'✅ {done}/{n_ch} chapitres générés, {total_cards} cartes, {len(bank)} questions d\'examen')
    for m in missing:
        print(f'⚠️ image introuvable : {m}')


if __name__ == '__main__':
    main()
