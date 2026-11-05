"""Logo Code Maroc : détourage (fond blanc -> transparent) et déclinaisons pour l'app."""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

IMG, WEB = sys.argv[1], sys.argv[2]
PUB = os.path.join(WEB, 'public')
APP = os.path.join(WEB, 'src', 'app')
os.makedirs(os.path.join(PUB, 'brand'), exist_ok=True)


def cutout(path):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    white = (r > 232) & (g > 232) & (b > 225)
    lab, _ = ndi.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # petits îlots blancs enfermés entre deux éléments du texte (ex. dans les lettres) : fond aussi s'ils sont gros
    alpha = np.where(bg, 0.0, 1.0)
    alpha = ndi.gaussian_filter(alpha, 0.8)
    alpha = np.where(bg & (ndi.distance_transform_edt(~bg) == 0) & (alpha < 0.5), 0, alpha)
    rgba = np.dstack([rgb.astype(np.uint8), (alpha * 255).clip(0, 255).astype(np.uint8)])
    im = Image.fromarray(rgba, 'RGBA')
    return im.crop(im.getbbox())


emblem = cutout(os.path.join(IMG, '5.jpg'))
full = cutout(os.path.join(IMG, '6.jpg'))
print('emblem', emblem.size, 'full', full.size)


def fit(im, size):
    c = im.copy()
    c.thumbnail((size, size), Image.LANCZOS)
    return c


fit(emblem, 512).save(os.path.join(PUB, 'brand', 'emblem.webp'), 'WEBP', quality=90, method=6)
fit(emblem, 160).save(os.path.join(PUB, 'brand', 'emblem-160.webp'), 'WEBP', quality=90, method=6)
f = full.copy()
f.thumbnail((1000, 1000), Image.LANCZOS)
f.save(os.path.join(PUB, 'brand', 'logo.webp'), 'WEBP', quality=90, method=6)


def square(im, size, scale, bg=None):
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    e = fit(im, int(size * scale))
    canvas.alpha_composite(e, ((size - e.width) // 2, (size - e.height) // 2))
    return canvas


SAND = (250, 248, 245, 255)
# Icônes PWA : 192 (transparent), 512 « maskable » (fond sable, emblème dans la zone sûre)
square(emblem, 192, 0.96).save(os.path.join(PUB, 'icon-192.png'))
square(emblem, 512, 0.74, SAND).save(os.path.join(PUB, 'icon-512.png'))
# Icône Apple (opaque)
square(emblem, 180, 0.86, SAND).convert('RGB').save(os.path.join(APP, 'apple-icon.png'))
# Favicon multi-tailles
fav = square(emblem, 256, 1.0)
fav.save(os.path.join(APP, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
# Image de partage (réseaux sociaux) : logo complet sur fond sable
og = Image.new('RGBA', (1200, 630), SAND)
lf = full.copy()
lf.thumbnail((1040, 520), Image.LANCZOS)
og.alpha_composite(lf, ((1200 - lf.width) // 2, (630 - lf.height) // 2))
og.convert('RGB').save(os.path.join(APP, 'opengraph-image.png'))
print('ok')
