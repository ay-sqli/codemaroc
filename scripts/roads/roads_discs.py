"""Pastilles des pièces : positions repérées sur la planche de contrôle, recentrées localement."""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

D = sys.argv[1]
meta = json.load(open(os.path.join(D, 'meta.json')))
# Coordonnées approximatives sur la planche _check.png (cellules de 300 px, 5 colonnes)
GUESS = {
    'a00': [(68, 40), (27, 265)], 'a01': [(483, 48), (339, 250)], 'a02': [(797, 57), (697, 245)],
    'a03': [(985, 55), (942, 243)], 'a04': [(1435, 60), (1245, 210)],
    'a05': [(38, 420), (248, 378)], 'a06': [(357, 532), (498, 537)], 'a07': [(636, 348), (842, 347), (740, 485)],
    'a08': [(1148, 360), (931, 488)], 'a09': [(1229, 350), (1448, 350)],
    'a10': [(250, 638), (250, 722), (28, 722)], 'a11': [(542, 645), (333, 735), (547, 762)],
    'b12': [(670, 641), (628, 862)], 'b13': [(1081, 655), (1089, 815), (942, 850)], 'b14': [(1287, 660), (1245, 843)],
    'b15': [(238, 950), (38, 1048), (240, 1070)], 'b16': [(530, 962), (350, 1112)], 'b17': [(640, 1022), (846, 983)],
    'b18': [(1136, 953), (945, 1085)], 'b19': [(1260, 1127), (1397, 1132)],
    'b20': [(40, 1255), (238, 1255), (140, 1380)], 'b21': [(545, 1263), (335, 1385)], 'b22': [(632, 1255), (848, 1255)],
    'b23': [(932, 1336), (1148, 1255), (1148, 1336)], 'b24': [(1438, 1248), (1237, 1335), (1443, 1362)],
}
cell, cols = 300, 5
out = []
for i, m in enumerate(meta):
    im = np.asarray(Image.open(os.path.join(D, m['id'] + '.png'))).astype(int)
    h, w = im.shape[:2]
    s = min((cell - 30) / w, (cell - 30) / h)
    ox, oy = (i % cols) * cell + 5, (i // cols) * cell + 20
    r, g, b, a = [im[..., k] for k in range(4)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    diskc = (((mx - mn < 26) & (mx > 104) & (mx < 244)) | ((r > 150) & (g < 120) & (b < 120)) | ((r > 180) & (g > 130) & (b < 130))) & (a > 0)
    R = 50 if m['id'][0] == 'a' else 22  # rayon approximatif d'une pastille dans la pièce
    discs = []
    for gx, gy in GUESS[m['id']]:
        x, y = (gx - ox) / s, (gy - oy) / s
        for _ in range(3):  # recentrage itératif sur le centre de masse local
            x0, x1 = int(max(0, x - R * 1.1)), int(min(w, x + R * 1.1))
            y0, y1 = int(max(0, y - R * 1.1)), int(min(h, y + R * 1.1))
            yy, xx = np.mgrid[y0:y1, x0:x1]
            win = diskc[y0:y1, x0:x1] & ((xx - x) ** 2 + (yy - y) ** 2 <= (R * 1.1) ** 2)
            if win.sum() < 20:
                break
            cy, cx = ndi.center_of_mass(win)
            x, y = x0 + cx, y0 + cy
        # couleur dominante de la pastille
        pr, pg, pb = r[int(y), int(x)], g[int(y), int(x)], b[int(y), int(x)]
        discs.append({'x': round(float(x), 1), 'y': round(float(y), 1)})
    out.append({'id': m['id'], 'w': w, 'h': h, 'r': R, 'discs': discs})
json.dump(out, open(os.path.join(D, 'pieces.json'), 'w'), indent=1)

sheet = Image.new('RGB', (cols * cell, ((len(out) + cols - 1) // cols) * cell), (235, 240, 245))
dr = ImageDraw.Draw(sheet)
for i, m in enumerate(out):
    pim = Image.open(os.path.join(D, m['id'] + '.png'))
    s = min((cell - 30) / pim.width, (cell - 30) / pim.height)
    t = pim.resize((int(pim.width * s), int(pim.height * s)))
    ox, oy = (i % cols) * cell + 5, (i // cols) * cell + 20
    sheet.paste(t, (ox, oy), t)
    dr.text((ox, oy - 16), m['id'], fill='black')
    for q, dd in enumerate(m['discs']):
        x, y, rr = ox + dd['x'] * s, oy + dd['y'] * s, m['r'] * s
        dr.ellipse([x - rr, y - rr * 0.85, x + rr, y + rr * 0.85], outline='lime', width=2)
        dr.text((x - 3, y - 6), str(q), fill='blue')
sheet.save(os.path.join(D, '_check2.png'))
print('ok')
