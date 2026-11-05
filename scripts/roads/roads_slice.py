"""Découpe les planches de routes en pièces et repère les pastilles (extrémités) de chaque pièce."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

IMG_DIR, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SHEETS = [('a', '3.jpg'), ('b', '4.webp')]

pieces = []
for tag, fn in SHEETS:
    im = np.asarray(Image.open(os.path.join(IMG_DIR, fn)).convert('RGB')).astype(int)
    h, w, _ = im.shape
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    white = (r > 236) & (g > 236) & (b > 236)
    fg = ~white
    fg = ndi.binary_opening(fg, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=4))
    objs = ndi.find_objects(lab)
    for i, sl in enumerate(objs):
        ys, xs = sl
        area = int((lab[sl] == i + 1).sum())
        if area < 0.004 * h * w:
            continue
        pieces.append((tag, fn, i + 1, ys.start, ys.stop, xs.start, xs.stop))

print(len(pieces), 'pièces')
sheet_cache = {}
meta = []
for k, (tag, fn, li, y0, y1, x0, x1) in enumerate(pieces):
    if fn not in sheet_cache:
        rgb = np.asarray(Image.open(os.path.join(IMG_DIR, fn)).convert('RGB')).astype(int)
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        white = (r > 236) & (g > 236) & (b > 236)
        lab, _ = ndi.label(ndi.binary_dilation(ndi.binary_opening(~white, iterations=1), iterations=4))
        sheet_cache[fn] = (rgb, lab)
    rgb, lab = sheet_cache[fn]
    pad = 6
    y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
    y1, x1 = min(rgb.shape[0], y1 + pad), min(rgb.shape[1], x1 + pad)
    crop = rgb[y0:y1, x0:x1]
    mine = lab[y0:y1, x0:x1] == li
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    # Fond : blanc relié au bord de la pièce -> transparent (le blanc des lignes reste opaque)
    white = (r > 230) & (g > 230) & (b > 230)
    wl, _ = ndi.label(white)
    border = set(np.unique(np.concatenate([wl[0], wl[-1], wl[:, 0], wl[:, -1]]))) - {0}
    bg = np.isin(wl, list(border)) | ~ndi.binary_dilation(mine, iterations=2)
    # bord adouci : alpha 0 sur le fond, dégradé d'un pixel
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    soft = ndi.uniform_filter(alpha.astype(float), 3)
    alpha = np.where(bg, 0, np.maximum(alpha, 0)).astype(np.uint8)
    alpha = np.minimum(alpha, (soft * 1.6).clip(0, 255)).astype(np.uint8)
    # Pastilles : gris moyen / rouge / jaune, compactes
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    gray = (mx - mn < 22) & (mx > 105) & (mx < 215)
    red = (r > 160) & (g < 110) & (b < 110)
    yellow = (r > 190) & (g > 140) & (b < 120)
    disc = (gray | red | yellow) & ~bg
    r0 = 22 if tag == 'a' else 10
    disc = ndi.binary_dilation(disc, iterations=3)
    disc = ndi.binary_fill_holes(disc)
    yy, xx = np.mgrid[-r0:r0 + 1, -r0:r0 + 1]
    disc = ndi.binary_opening(disc, structure=(xx * xx + yy * yy) <= r0 * r0)
    dl, dn = ndi.label(disc)
    discs = []
    for j, s in enumerate(ndi.find_objects(dl)):
        area = int((dl[s] == j + 1).sum())
        hh, ww = s[0].stop - s[0].start, s[1].stop - s[1].start
        if area < 3.14 * r0 * r0 * 1.5 or not (0.6 < ww / hh < 1.9):
            continue
        cy, cx = ndi.center_of_mass(dl == j + 1)
        discs.append({'x': round(float(cx), 1), 'y': round(float(cy), 1), 'w': ww, 'h': hh, 'area': area})
    if discs:
        med = np.median([d['w'] for d in discs])
        discs = [d for d in discs if 0.6 * med < d['w'] < 1.6 * med]
    name = f'{tag}{k:02d}'
    rgba = np.dstack([crop.astype(np.uint8), alpha])
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, name + '.png'))
    meta.append({'id': name, 'w': int(x1 - x0), 'h': int(y1 - y0), 'discs': discs})

json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)

# Planche de contrôle : chaque pièce avec ses pastilles numérotées
cell = 300
cols = 5
rows = (len(meta) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell, rows * cell), (235, 240, 245))
d = ImageDraw.Draw(sheet)
for i, m in enumerate(meta):
    im = Image.open(os.path.join(OUT, m['id'] + '.png'))
    s = min((cell - 30) / im.width, (cell - 30) / im.height)
    t = im.resize((int(im.width * s), int(im.height * s)))
    ox, oy = (i % cols) * cell + 5, (i // cols) * cell + 20
    sheet.paste(t, (ox, oy), t)
    d.text((ox, oy - 16), f"{m['id']} discs={len(m['discs'])}", fill='black')
    for q, dd in enumerate(m['discs']):
        x, y = ox + dd['x'] * s, oy + dd['y'] * s
        d.ellipse([x - 6, y - 6, x + 6, y + 6], outline='lime', width=3)
        d.text((x + 7, y - 6), str(q), fill='blue')
sheet.save(os.path.join(OUT, '_check.png'))
print(json.dumps([(m['id'], m['w'], m['h'], len(m['discs'])) for m in meta]))
