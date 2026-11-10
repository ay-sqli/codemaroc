"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Expand, Minimize2, RotateCcw } from "lucide-react";
import type { Markmap } from "markmap-view";
import { Button } from "./ui";
import { useLang } from "@/lib/i18n";

/** En dessous de cette échelle le texte devient illisible (carte large sur un téléphone). */
const MIN_SCALE = 0.7;

/** Transformation d3-zoom courante (stockée par d3 sur l'élément SVG). */
interface ZoomState {
  k: number;
  x: number;
  y: number;
  translate(x: number, y: number): ZoomState;
  scale(k: number): ZoomState;
}

/**
 * Ajuste la carte à l'écran ; si elle devient trop petite pour être lue,
 * garde une échelle lisible et cadre la racine et le début des branches
 * (on explore ensuite en glissant).
 */
function smartFit(mm: Markmap) {
  const node = mm.svg.node() as (SVGSVGElement & { __zoom?: ZoomState }) | null;
  const root = mm.state.data;
  const { x1, y1, x2, y2 } = mm.state.rect;
  const { width: w, height: h } = node?.getBoundingClientRect() ?? { width: 0, height: 0 };
  if (!node?.__zoom || !root?.state?.rect || !w || x2 <= x1) return mm.fit();
  // Même calcul d'échelle que Markmap.fit()
  const fitK = Math.min((w / (x2 - x1)) * mm.options.fitRatio, (h / (y2 - y1)) * mm.options.fitRatio, mm.options.maxInitialScale);
  if (fitK >= MIN_SCALE) return mm.fit();
  // Échelle lisible ; départ des branches à 35 % de la largeur. Carte plus haute que l'écran
  // (toutes les branches ouvertes) : on la lit depuis le haut, sous la barre d'outils.
  const k = MIN_SCALE;
  const x = w * 0.35 - (root.state.rect.x + root.state.rect.width) * k;
  const tall = (y2 - y1) * k > h - 64;
  const y = tall ? 64 - y1 * k : h / 2 - ((y1 + y2) / 2) * k;
  const t = node.__zoom;
  const target = t.scale(k / t.k).translate((x - t.x) / k, (y - t.y) / k);
  mm.transition(mm.svg).call(mm.zoom.transform, target);
}

/**
 * Met les panneaux de la fiche en cache avant la première mise en page, pour que
 * Markmap mesure les nœuds avec leur image (au plus `timeout` ms d'attente).
 */
function preloadImages(md: string, timeout = 4000) {
  const srcs = new Set(Array.from(md.matchAll(/<img src="([^"]+)"/g), (m) => m[1]));
  const loads = [...srcs].map(
    (src) =>
      new Promise<void>((done) => {
        const img = new Image();
        img.onload = img.onerror = () => done();
        img.src = src;
      }),
  );
  return Promise.race([Promise.all(loads), new Promise<void>((done) => setTimeout(done, timeout))]);
}

/** Carte mentale interactive (Markmap), même contenu que la fiche. */
export function MindMap({ md, title }: { md: string; title: string }) {
  const { t } = useLang();
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const [full, setFull] = useState(false);
  // Ordinateur : toutes les branches ouvertes (carte complète). Téléphone : la carte entière ne tient pas
  // à l'écran, on part des parties et « Tout déplier » ouvre le reste.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let detach = () => {};
    (async () => {
      const [[{ Transformer }, { Markmap }]] = await Promise.all([
        Promise.all([import("markmap-lib"), import("markmap-view")]),
        preloadImages(md),
      ]);
      const svg = svgRef.current;
      if (cancelled || !svg) return;
      svg.innerHTML = "";
      // Sans emoji (design system), en conservant l'indentation qui porte l'imbrication.
      const clean = md.replace(/\[!\]\s*|\[table:[^\]]+\]\s*/g, "").replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{200D}]/gu, "").replace(/(#+|-) {2,}/g, "$1 ");
      const { root } = new Transformer().transform(clean);
      // Créée sans données : Markmap.create(…, root) lancerait son propre fit() qui écraserait le cadrage.
      const mm = Markmap.create(svg, { duration: 300, maxWidth: 0, initialExpandLevel: open ? -1 : 2, spacingVertical: 8 });
      mmRef.current = mm;
      // Markmap mesure chaque nœud dès son insertion : une image arrivée après coup élargit le nœud
      // et le foreignObject (qui rogne son contenu) cache alors le texte. On refait la mise en page.
      let frame = 0;
      const onLoad = (e: Event) => {
        if ((e.target as Element).tagName !== "IMG") return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => void mm.renderData());
      };
      svg.addEventListener("load", onLoad, true);
      detach = () => {
        cancelAnimationFrame(frame);
        svg.removeEventListener("load", onLoad, true);
      };
      await mm.setData(root);
      if (cancelled) return;
      smartFit(mm);
    })();
    return () => {
      cancelled = true;
      detach();
      mmRef.current?.destroy?.();
    };
  }, [md, open]);

  useEffect(() => {
    const t = setTimeout(() => mmRef.current && smartFit(mmRef.current), 250);
    return () => clearTimeout(t);
  }, [full]);

  return (
    <div
      ref={wrapRef}
      className={`${full ? "fixed inset-0 z-[70] rounded-none" : "relative h-[70vh] min-h-[480px] rounded-[16px]"} overflow-hidden border-2 border-line bg-white`}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 border-b-2 border-line bg-white/95 px-4 py-2">
        <p className="hidden truncate text-sm text-muted sm:block">
          <span className="font-semibold text-ink">{title}</span> · {t("clique sur un nœud pour le plier ou le déplier", "انقر على عقدة لطيّها أو فتحها")}
        </p>
        <div className="ms-auto flex gap-2">
          <Button variant="secondary" size="sm" icon={open ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />} onClick={() => setOpen((o) => !o)}>
            <span className="max-sm:sr-only">{open ? t("Replier", "طيّ") : t("Tout déplier", "فتح الكل")}</span>
          </Button>
          <Button variant="secondary" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => mmRef.current && smartFit(mmRef.current)}>
            <span className="max-sm:sr-only">{t("Recentrer", "إعادة التوسيط")}</span>
          </Button>
          <Button size="sm" icon={full ? <Minimize2 className="size-4" /> : <Expand className="size-4" />} onClick={() => setFull((f) => !f)}>
            <span className="max-sm:sr-only">{full ? t("Réduire", "تصغير") : t("Plein écran", "ملء الشاشة")}</span>
          </Button>
        </div>
      </div>
      {/* Tracé de gauche à droite même en arabe : en RTL, l'étiquette (une boîte très large) s'aligne à
          droite et le foreignObject la rogne entièrement. Chaque phrase garde son propre sens d'écriture. */}
      <svg
        ref={svgRef}
        style={{ direction: "ltr" }}
        className="markmap size-full pt-12 [&_foreignObject>div]:text-left [&_foreignObject>div]:[unicode-bidi:plaintext]"
      />
    </div>
  );
}
