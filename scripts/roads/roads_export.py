"""Exporte les pièces de route pour l'app : images webp + roads.json (pastilles, axe central entre pastilles)."""
import heapq, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

D, PUB, DATA = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(PUB, exist_ok=True)
pieces = json.load(open(os.path.join(D, 'pieces.json')))
# Diamètre d'une pastille dans chaque planche (pixels source) -> échelle commune : pastille = 70 px.
DISC = {'a': 108.0, 'b': 52.0}
TARGET = 70.0
# Pièces en relief (pont, tunnel, murets) : jamais tournées, seulement retournées horizontalement.
NO_ROTATE = {'a08', 'b16', 'b21', 'b23'}
# Pièces très larges ou très hautes : légèrement réduites pour tenir dans la colonne.
SHRINK = {'a08': 0.74, 'b21': 0.74, 'b16': 0.85, 'b23': 0.82, 'a00': 0.8, 'b12': 0.8, 'a05': 0.8, 'a09': 0.85, 'a10': 0.8}
# Pièces remarquables (pont, tunnel, rond-point, murets) : plus souvent choisies.
FEATURE = {'a08': 4, 'b21': 4, 'b13': 2, 'b16': 2.5, 'b23': 2.5, 'a00': 1.5, 'b12': 1.5}


def centerline(alpha, p, q, step=3):
    """Plus court chemin de p à q qui reste au milieu de la route (Dijkstra sur grille réduite)."""
    m = alpha[::step, ::step] > 0
    dist = ndi.distance_transform_edt(m)
    cost = np.where(m, 1.0 / (dist + 0.5) ** 2, np.inf)
    h, w = m.shape
    sy, sx = int(p[1] / step), int(p[0] / step)
    ty, tx = int(q[1] / step), int(q[0] / step)
    best = np.full((h, w), np.inf)
    prev = {}
    best[sy, sx] = 0
    pq = [(0.0, sy, sx)]
    nb = [(-1, 0, 1), (1, 0, 1), (0, -1, 1), (0, 1, 1), (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)]
    while pq:
        dcur, y, x = heapq.heappop(pq)
        if (y, x) == (ty, tx):
            break
        if dcur > best[y, x]:
            continue
        for dy, dx, l in nb:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and np.isfinite(cost[ny, nx]):
                nd = dcur + l * cost[ny, nx]
                if nd < best[ny, nx]:
                    best[ny, nx] = nd
                    prev[(ny, nx)] = (y, x)
                    heapq.heappush(pq, (nd, ny, nx))
    pts = [(tx, ty)]
    cur = (ty, tx)
    while cur in prev:
        cur = prev[cur]
        pts.append((cur[1], cur[0]))
    pts.reverse()
    pts = [(x * step, y * step) for x, y in pts]
    # lissage + sous-échantillonnage (~1 point tous les 12 px)
    arr = np.array(pts, float)
    if len(arr) > 5:
        arr = ndi.uniform_filter1d(arr, 7, axis=0, mode='nearest')
    keep = [arr[0]]
    for pt in arr[1:]:
        if np.hypot(*(pt - keep[-1])) >= 12:
            keep.append(pt)
    keep[0] = np.array(p, float)
    keep.append(np.array(q, float))
    return [[round(float(x), 1), round(float(y), 1)] for x, y in keep]


out = []
for pc in pieces:
    pid = pc['id']
    im = Image.open(os.path.join(D, pid + '.png'))
    im.save(os.path.join(PUB, pid + '.webp'), 'WEBP', quality=88, method=6)
    alpha = np.asarray(im)[..., 3]
    discs = [(d['x'], d['y']) for d in pc['discs']]
    lines = {}
    for i in range(len(discs)):
        for j in range(i + 1, len(discs)):
            lines[f'{i}-{j}'] = centerline(alpha, discs[i], discs[j])
    out.append({
        'id': pid, 'w': pc['w'], 'h': pc['h'],
        'c': round(TARGET / DISC[pid[0]] * SHRINK.get(pid, 1), 4),
        'f': FEATURE.get(pid, 1),
        'rot': pid not in NO_ROTATE,
        'discs': [[round(x, 1), round(y, 1)] for x, y in discs],
        'lines': lines,
    })
    print(pid, len(discs), {k: len(v) for k, v in lines.items()})
json.dump(out, open(DATA, 'w'), separators=(',', ':'))
print('ok', os.path.getsize(DATA))
