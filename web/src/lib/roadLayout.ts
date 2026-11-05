import ROADS from "@/data/roads.json";

/**
 * Route du parcours composée de pièces dessinées (public/roads) : virages en S, en C, en U, fourches,
 * pont, tunnel, voie rapide, rond-point… Chaque pièce relie deux pastilles ; on enchaîne les pièces
 * pastille contre pastille, et chaque étape du parcours se pose sur une pastille.
 *
 * Coordonnées « virtuelles » : origine = centre de la colonne, x vers la droite, y vers le bas.
 * Une pastille mesure ~70 px. Sur un écran étroit, le décor est réduit (facteur k) mais pas les boutons.
 */

interface RoadPiece {
  id: string;
  w: number;
  h: number;
  /** échelle source → virtuel */
  c: number;
  /** pièce plate : peut être tournée par quarts de tour */
  rot: boolean;
  /** poids de tirage (pont, tunnel… plus fréquents) */
  f: number;
  discs: [number, number][];
  /** axe central entre deux pastilles « i-j » (i < j), en pixels source */
  lines: Record<string, [number, number][]>;
}
const PIECES = ROADS as unknown as RoadPiece[];

/** Demi-largeur de la bande où se posent les étapes, et largeur totale à prévoir (boutons compris). */
export const ROAD_HALF = 165;
export const ROAD_BAND = 2 * ROAD_HALF + 96;
/** La route entière (axes + pastilles, hors largeur de la chaussée) reste dans ±ROAD_XMAX : rien n'est coupé. */
const ROAD_XMAX = 178;
const MIN_DY = 125;
const MAX_DY = 380;

type Pt = { x: number; y: number };

export interface PlacedPiece {
  id: string;
  /** taille affichée (virtuelle) */
  w: number;
  h: number;
  /** transformation CSS (origine 0 0) */
  transform: string;
  /** pastilles non utilisées (à masquer par un décor) */
  spare: Pt[];
}

export interface RoadLayout {
  nodes: Pt[];
  pieces: PlacedPiece[];
  /** tracé SVG de l'axe de la route, d'une étape à l'autre (pour faire rouler un véhicule) */
  d: string;
  height: number;
}

interface Orientation {
  angle: number;
  flip: boolean;
}

function transformPt(p: RoadPiece, o: Orientation, x: number, y: number): Pt {
  let px = x * p.c;
  const py = y * p.c;
  if (o.flip) px = p.w * p.c - px;
  const a = (o.angle * Math.PI) / 180;
  const cos = Math.round(Math.cos(a));
  const sin = Math.round(Math.sin(a));
  return { x: px * cos - py * sin, y: px * sin + py * cos };
}

function lineBetween(p: RoadPiece, a: number, b: number): [number, number][] {
  const key = a < b ? `${a}-${b}` : `${b}-${a}`;
  const pts = p.lines[key] ?? [p.discs[a], p.discs[b]];
  return a < b ? pts : [...pts].reverse();
}

interface Option {
  piece: RoadPiece;
  o: Orientation;
  a: number;
  b: number;
  dx: number;
  dy: number;
  /** étendue verticale de la route (axes + pastilles) relative à la pastille de départ */
  minY: number;
  maxY: number;
  minX: number;
  maxX: number;
}

/** Toutes les façons de poser chaque pièce pour descendre d'une pastille à une autre. */
const OPTIONS: Option[] = (() => {
  const out: Option[] = [];
  for (const piece of PIECES) {
    const angles = piece.rot ? [0, 90, 180, 270] : [0];
    for (const angle of angles) {
      for (const flip of [false, true]) {
        const o = { angle, flip };
        const discs = piece.discs.map(([x, y]) => transformPt(piece, o, x, y));
        const all = [...discs, ...Object.values(piece.lines).flat().map(([x, y]) => transformPt(piece, o, x, y))];
        for (let a = 0; a < discs.length; a++) {
          for (let b = 0; b < discs.length; b++) {
            if (a === b) continue;
            const dx = discs[b].x - discs[a].x;
            const dy = discs[b].y - discs[a].y;
            if (dy < MIN_DY || dy > MAX_DY) continue;
            const ys = all.map((p) => p.y - discs[a].y);
            const xs = all.map((p) => p.x - discs[a].x);
            out.push({ piece, o, a, b, dx, dy, minY: Math.min(...ys), maxY: Math.max(...ys), minX: Math.min(...xs), maxX: Math.max(...xs) });
          }
        }
      }
    }
  }
  return out;
})();

/** Générateur pseudo-aléatoire déterministe (même route à chaque visite). */
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** Compose la route d'une unité de `count` étapes. */
export function layoutRoad(count: number, seed: number): RoadLayout {
  const rand = rng(seed + 7);
  const start: Pt = { x: (seed % 2 ? 1 : -1) * 40, y: 70 };
  const nodes: Pt[] = [start];
  const pieces: PlacedPiece[] = [];
  const recent: string[] = [];
  let d = `M ${start.x} ${start.y}`;
  let bottom = start.y + 60;

  for (let k = 1; k < count; k++) {
    const cur = nodes[k - 1];
    const fits = (op: Option, slack: number) =>
      Math.abs(cur.x + op.dx) <= ROAD_HALF &&
      cur.x + op.minX >= -ROAD_XMAX - slack / 4 &&
      cur.x + op.maxX <= ROAD_XMAX + slack / 4 &&
      op.minY >= -45 - slack &&
      op.maxY <= op.dy + 45 + slack &&
      !recent.includes(op.piece.id);
    let cands = OPTIONS.filter((op) => fits(op, 0));
    if (!cands.length) cands = OPTIONS.filter((op) => fits(op, 200));
    if (!cands.length) cands = OPTIONS.filter((op) => Math.abs(cur.x + op.dx) <= ROAD_HALF);
    // Préférence : écart vertical court (~150 px), et alterner les pièces.
    // Le nombre d'orientations possibles d'une pièce ne doit pas favoriser les pièces plates.
    const perPiece = new Map<string, number>();
    for (const op of cands) perPiece.set(op.piece.id, (perPiece.get(op.piece.id) ?? 0) + 1);
    const weights = cands.map(
      (op) => ((Math.exp(-((op.dy - 150) ** 2) / (2 * 70 ** 2)) + 0.05) * op.piece.f) / Math.sqrt(perPiece.get(op.piece.id)!),
    );
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rand() * total;
    let pick = cands[0];
    for (let i = 0; i < cands.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pick = cands[i];
        break;
      }
    }
    const { piece, o, a, b } = pick;
    const sa = transformPt(piece, o, ...piece.discs[a]);
    const tx = cur.x - sa.x;
    const ty = cur.y - sa.y;
    const next = { x: cur.x + pick.dx, y: cur.y + pick.dy };
    nodes.push(next);
    const flipCss = o.flip ? ` translateX(${piece.w * piece.c}px) scaleX(-1)` : "";
    pieces.push({
      id: piece.id,
      w: piece.w * piece.c,
      h: piece.h * piece.c,
      transform: `translate(${tx}px, ${ty}px) rotate(${o.angle}deg)${flipCss}`,
      spare: piece.discs
        .map((_, i) => i)
        .filter((i) => i !== a && i !== b)
        .map((i) => {
          const p = transformPt(piece, o, ...piece.discs[i]);
          return { x: p.x + tx, y: p.y + ty };
        }),
    });
    for (const [x, y] of lineBetween(piece, a, b).slice(1)) {
      const p = transformPt(piece, o, x, y);
      d += ` L ${(p.x + tx).toFixed(1)} ${(p.y + ty).toFixed(1)}`;
    }
    bottom = Math.max(bottom, cur.y + pick.maxY + 40, next.y + 60);
    recent.push(piece.id);
    if (recent.length > 3) recent.shift();
  }
  return { nodes, pieces, d, height: bottom + 20 };
}
