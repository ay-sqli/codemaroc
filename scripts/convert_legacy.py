"""
Conversion unique : extrait le Markdown des mindmaps historiques (01, 02, 03)
vers content/01_la_route/<slug>.md au format unifié ({img:NOM}).

Usage : python scripts/convert_legacy.py   (n'écrase pas un fichier existant)
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chapters import LEGACY_MINDMAPS  # noqa: E402

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

for slug, html_name in LEGACY_MINDMAPS.items():
    dest = os.path.join(BASE, 'content', '01_la_route', f'{slug}.md')
    if os.path.exists(dest):
        print(f'⏭️  {dest} existe déjà')
        continue
    with open(os.path.join(BASE, 'outputs', html_name), encoding='utf-8') as f:
        html = f.read()
    md = re.search(r'markdownContent\s*=\s*`(.*?)`', html, re.S).group(1).strip('\n')
    md = re.sub(r'<img\s+src="[^"]*/([^"/]+)"[^>]*>', r'{img:\1}', md)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(md.strip() + '\n')
    print(f'✅ {slug} → {dest}')
