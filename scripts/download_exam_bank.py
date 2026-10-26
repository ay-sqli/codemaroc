"""
Télécharge la banque de questions d'examen Perminou (images AR + audio AR)
listée dans exam_bank/ids_ar.txt, puis compresse les images en JPEG (800px).

  exam_bank/images/<id>.jpg
  exam_bank/audio/<id>.mp3

Usage : python scripts/download_exam_bank.py
"""
import io
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BANK = os.path.join(BASE, 'exam_bank')
URL = 'https://perminou.narsa.gov.ma/media/uploads/questions/'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def fetch(qid):
    out = []
    img_dest = os.path.join(BANK, 'images', f'{qid}.jpg')
    if not os.path.exists(img_dest):
        try:
            im = Image.open(io.BytesIO(get(f'{URL}images/ar/{qid}.png'))).convert('RGB')
            im.thumbnail((800, 800))
            im.save(img_dest, 'JPEG', quality=82, optimize=True)
        except Exception as e:  # noqa: BLE001
            out.append(f'IMG {qid}: {e}')
    snd_dest = os.path.join(BANK, 'audio', f'{qid}.mp3')
    if not os.path.exists(snd_dest):
        try:
            data = get(f'{URL}son/ar/{qid}.mp3')
            with open(snd_dest, 'wb') as f:
                f.write(data)
        except Exception as e:  # noqa: BLE001
            out.append(f'MP3 {qid}: {e}')
    return out


def main():
    os.makedirs(os.path.join(BANK, 'images'), exist_ok=True)
    os.makedirs(os.path.join(BANK, 'audio'), exist_ok=True)
    ids = open(os.path.join(BANK, 'ids_ar.txt'), encoding='utf-8').read().split()
    errors = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for errs in ex.map(fetch, ids):
            errors.extend(errs)
    for e in errors:
        print('⚠️', e)
    print(f'✅ {len(ids)} questions traitées, {len(errors)} fichiers manquants')


if __name__ == '__main__':
    main()
