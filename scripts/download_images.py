"""
Télécharge les images des cours Perminou listées dans inputs/images_manifest.json
vers inputs/<module>/<chapitre>/images/<nom_sain>.

Usage : python scripts/download_images.py
"""
import json
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chapters import find_chapter  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
URL = 'https://perminou.narsa.gov.ma/media/uploads/froala_editor/images/'


def safe_name(name):
    """Nom de fichier local sans caractères encodés (%XX) ni espaces."""
    return re.sub(r'[^A-Za-z0-9._-]', '_', name)


def image_dir(slug_or_id):
    mod, ch = find_chapter(slug_or_id)
    return os.path.join(BASE, 'inputs', mod['dir'], ch[0], 'images')


def fetch(job):
    url, dest = job
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return 'skip', dest
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        with open(dest, 'wb') as f:
            f.write(data)
        return 'ok', dest
    except Exception as e:  # noqa: BLE001
        return f'ERR {e}', url


def main():
    with open(os.path.join(BASE, 'inputs', 'images_manifest.json'), encoding='utf-8') as f:
        manifest = json.load(f)
    jobs = []
    for key, names in manifest.items():
        d = image_dir(key)
        os.makedirs(d, exist_ok=True)
        for n in names:
            jobs.append((URL + n, os.path.join(d, safe_name(n))))
    stats = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for status, what in ex.map(fetch, jobs):
            stats[status[:3]] = stats.get(status[:3], 0) + 1
            if status.startswith('ERR'):
                print(status, what)
    print(f'✅ Terminé : {stats} sur {len(jobs)} images')


if __name__ == '__main__':
    main()
