"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Lock, Star } from "lucide-react";
import { useBank } from "@/lib/questions";
import { SECTION_COLORS, XP, buildPath, currentIndex, type GameNode, type GamePath, type NodeStatus } from "@/lib/game";
import { useStore } from "@/lib/store";
import { asset } from "@/lib/base";
import { nameOf } from "@/lib/courses";
import { countLabel, useLang } from "@/lib/i18n";
import { cx } from "@/components/ui";
import { ROAD_BAND, layoutRoad, type RoadLayout } from "@/lib/roadLayout";
import { Mascot, type Pose } from "./Mascot";
import { BackupCard, BadgesCard, QuestsCard } from "./GameShell";

/**
 * « La Route du Maroc » : le parcours est une route asphaltée qui serpente d'étape en étape,
 * à travers un décor marocain par section (ville, montagne, garage, boulevards, autoroute),
 * jusqu'à l'insigne du sommet.
 */

/** Décor de chaque section (public/decor). */
const SCENES: Record<string, { img: string; flip?: boolean; fr: string; ar: string }> = {
  "01": { img: "ville", fr: "Les panneaux de la ville", ar: "علامات المدينة" },
  "03": { img: "atlas", fr: "Sur les routes de l'Atlas", ar: "على طرق الأطلس" },
  "04": { img: "nuit", fr: "Au garage, de nuit", ar: "في المرآب، ليلا" },
  "02": { img: "boulevard", fr: "Les grands boulevards", ar: "الشوارع الكبرى" },
  "06": { img: "autoroute", fr: "Sur l'autoroute", ar: "على الطريق السيار" },
  "05": { img: "ville", flip: true, fr: "Le code et la loi", ar: "المدونة والقانون" },
};

/** Pose de la mascotte à côté de chaque unité : en rapport avec le chapitre quand c'est possible. */
const UNIT_POSE: Record<string, Pose> = {
  "01_signalisation_verticale": "yield",
  "02_dangers_priorites": "scared",
  "03_interdictions": "forbidden",
  "06_directions": "directions",
  "09_feux_et_agents": "angry",
  "15_conditions_climatiques": "vacation",
  "03_vitesse": "fast",
  "11_autoroute": "travel",
  "15_panne_accident": "tired",
  "07_regles_priorite": "police",
  "02_alcool_medicaments": "worried",
  "03_vigilance": "sleep",
  "02_elements_mecaniques": "mechanic",
  "05_vehicules_prioritaires": "police",
  "01_permis_a_points": "permis",
  "02_amendes": "notes",
  "04_equipements_securite": "hero",
};
const SECTION_POSES: Record<string, Pose[]> = {
  "01": ["wave", "search", "notes", "directions", "yield"],
  "03": ["study", "thinking", "reading", "phone"],
  "04": ["phone", "search", "travel", "mechanic"],
  "02": ["directions", "timer", "notes", "fast", "teacher"],
  "06": ["hero", "stats", "thinking", "worried"],
  "05": ["teacher", "stats", "notes", "police"],
};
function unitPose(slug: string, section: string, n: number): Pose {
  const list = SECTION_POSES[section] ?? ["happy"];
  return UNIT_POSE[slug] ?? list[n % list.length];
}

/** Décalages du squelette de chargement (avant que la route soit composée). */
const OFFSETS = [0, 58, 92, 58, 0, -58, -92, -58];

/** Véhicule qui roule sur la route de chaque unité (varie selon la section et le chapitre). */
const UNIT_VEHICLE: Record<string, string> = {
  "05_vehicules_prioritaires": "ambulance",
  "13_autres_usagers": "charrette",
  "11_autoroute": "camion",
  "03_vitesse": "moto",
  "02_elements_mecaniques": "depanneuse",
  "01_categories_permis": "bus",
  "12_signalisation_temporaire": "rouleau",
  "15_panne_accident": "depanneuse",
  "02_dangers_priorites": "tracteur",
};
const SECTION_VEHICLES: Record<string, string[]> = {
  "01": ["autoecole", "petit-taxi", "grand-taxi", "voiture-bleue"],
  "03": ["autoecole", "voiture-verte", "scooter", "velo"],
  "04": ["4x4", "camionnette", "pickup-charge", "fourgon-jaune"],
  "02": ["petit-taxi", "bus", "grand-taxi", "triporteur", "autocar"],
  "06": ["autoecole", "voiture-bleue", "citerne", "porte-voitures"],
  "05": ["police", "gendarmerie", "moto-police", "grand-taxi"],
};
/** Décor posé au bord de la route (feux, barrières, panneaux). */
const UNIT_PROP: Record<string, string> = {
  "09_feux_et_agents": "feu-rouge",
  "11_signaux_lumineux": "feu-fleches",
  "07_regles_priorite": "feu-vert",
  "12_signalisation_temporaire": "barriere-fleche",
  "03_interdictions": "panneau-sens-interdit",
  "05_indications": "panneau-bleu",
  "14_dangers_exceptionnels": "barriere",
  "15_panne_accident": "barriere-noire",
  "06_arret_stationnement": "grille-panneau",
};
const SECTION_PROPS: Record<string, string[]> = {
  "01": ["panneau-bleu", "feu-vert", "grilles"],
  "03": ["feu-rouge", "panneau-bleu"],
  "04": ["barriere", "grilles"],
  "02": ["feu-fleches", "feu-rouge", "barriere-noire"],
  "06": ["barriere-fleche", "feu-vert"],
  "05": ["panneau-sens-interdit", "grille-panneau"],
};

/** Décors posés sur les pastilles inutilisées (bout de fourche) : une barrière, pas une étape. */
const SPARE_PROPS = ["barriere", "barriere-noire", "barriere-fleche"];

/**
 * Route d'une unité composée de pièces dessinées (lib/roadLayout) : décor réduit d'un facteur k sur
 * petit écran. Un véhicule roule sur l'axe de la route, d'une étape à l'autre, en boucle.
 */
function UnitRoad({ layout, k, vehicle, n }: { layout: RoadLayout; k: number; vehicle: string; n: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0" style={{ transform: `scale(${k})`, transformOrigin: "0 0" }} aria-hidden="true">
      {layout.pieces.map((p, i) => (
        <img
          key={i}
          src={asset(`/roads/${p.id}.webp`)}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 max-w-none select-none"
          style={{ width: p.w, height: p.h, transform: p.transform, transformOrigin: "0 0" }}
        />
      ))}
      {layout.pieces.flatMap((p, i) =>
        p.spare.map((q, j) => (
          <img
            key={`${i}-${j}`}
            src={asset(`/props/${SPARE_PROPS[(i + j + n) % SPARE_PROPS.length]}.webp`)}
            alt=""
            className="absolute h-[88px] w-auto max-w-none"
            style={{ left: q.x, top: q.y + 36, transform: "translate(-50%, -100%)" }}
          />
        )),
      )}
      <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
        <g opacity="0.95">
          <animateMotion dur={`${Math.max(10, layout.nodes.length * 3.2)}s`} begin={`-${(n % 5) * 1.7}s`} repeatCount="indefinite" rotate="auto" path={layout.d} />
          <g transform="rotate(90) translate(13 0)">
            <image href={asset(`/vehicles/${vehicle}.webp`)} x={-12} y={-24} width={24} height={48} preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** Facteur de réduction du décor selon la largeur de la colonne (les boutons gardent leur taille). */
function useRoadScale() {
  // Ref « callback » : la colonne n'existe qu'une fois le parcours chargé.
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [k, setK] = useState(1);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setK(Math.min(1, e.contentRect.width / ROAD_BAND)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return { ref, k };
}

/** Visuel d'un nœud (public/nodes) : verrouillé, en cours, validé, à revoir, coffre du défi, sommet. */
type NodeLook = "locked" | "current" | "done" | "review" | "chest" | "summit";
const NODE_W: Record<NodeLook, number> = { locked: 84, current: 90, done: 84, review: 84, chest: 100, summit: 170 };

function NodeImg({ look, dim }: { look: NodeLook; dim?: boolean }) {
  return (
    <img
      src={asset(`/nodes/${look}.webp`)}
      alt=""
      draggable={false}
      style={{ width: NODE_W[look] }}
      className={cx("pointer-events-none h-auto select-none", dim && "opacity-55 grayscale")}
    />
  );
}

function NodePopover({ node, status, path, color, shift = 0 }: { node: GameNode; status: NodeStatus; path: GamePath; color: { c: string; d: string }; shift?: number }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const unit = path.sections.flatMap((s) => s.units).find((u) => u.chapter.slug === node.unit);
  const lessons = unit?.nodes.filter((n) => n.kind === "lesson").length ?? 0;
  const locked = status === "locked";
  const xp = node.kind === "challenge" ? XP.challenge : status === "done" ? XP.replay : XP.lesson;
  return (
    <div
      className="duo-pop-in absolute top-[96px] z-30 w-[min(300px,calc(100vw-32px))] -translate-x-1/2 rounded-[20px] p-4"
      style={{ left: `calc(50% + ${shift}px)`, background: locked ? "#fff" : color.c, border: locked ? "2px solid var(--duo-grey)" : "none", boxShadow: locked ? "0 4px 0 var(--duo-grey-d)" : `0 5px 0 ${color.d}` }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
    >
      <p className={cx("duo-h !text-[18px] leading-snug", locked ? "!text-[var(--duo-muted)]" : "!text-white")}>{lang === "ar" ? node.title.ar : node.title.fr}</p>
      <p className={cx("mt-1 text-[14px] font-[600]", locked ? "text-[var(--duo-muted)]" : "text-white/90")}>
        {node.kind === "challenge"
          ? t("10 questions chronométrées · 3 points de permis", "10 أسئلة بتوقيت · 3 نقط في الرخصة")
          : `${t("Étape", "المرحلة")} ${node.index} ${t("sur", "من")} ${lessons} · ${countLabel(lang, node.qids.length, ["question"], ["سؤال", "سؤالان", "أسئلة", "سؤالا"])}`}
      </p>
      {locked ? (
        <p className="mt-3 flex items-center gap-2 text-[14px] font-[700] text-[var(--duo-muted)]">
          <Lock className="size-4 shrink-0" /> {t("Termine les étapes précédentes pour débloquer celle-ci.", "أكمل المراحل السابقة لفتح هذه المرحلة.")}
        </p>
      ) : (
        <button
          onClick={() => router.push(`/lecon/?id=${encodeURIComponent(node.id)}`)}
          className="duo-btn mt-4 w-full"
          style={{ ["--b" as string]: "#fff", ["--s" as string]: "rgb(0 0 0 / 0.18)", ["--t" as string]: color.c }}
        >
          {status === "done" ? t("Refaire", "أعد") : node.kind === "challenge" ? t("Ouvrir le coffre", "افتح الصندوق") : t("Commencer", "ابدأ")} +{xp} XP
        </button>
      )}
    </div>
  );
}

function PathNode({
  node, status, review, x, y, color, path, open, setOpen, nodeRef,
}: {
  node: GameNode;
  status: NodeStatus;
  review: boolean;
  /** position du centre de la pastille dans la colonne (px, origine = centre) */
  x: number;
  y: number;
  color: { c: string; d: string; soft: string };
  path: GamePath;
  open: boolean;
  setOpen: (id: string | null) => void;
  nodeRef?: React.Ref<HTMLDivElement>;
}) {
  const { t } = useLang();
  const chest = node.kind === "challenge";
  // Étape validée mais dont des erreurs attendent dans le carnet : panneau bleu « à revoir ».
  const look: NodeLook = chest ? "chest" : status === "locked" ? "locked" : status === "current" ? "current" : review ? "review" : "done";
  return (
    <div
      ref={nodeRef}
      data-path-node=""
      className={cx("absolute z-10", open && "z-30")}
      style={{ left: `calc(50% + ${x}px)`, top: y, transform: "translate(-50%, -58%)" }}
    >
      <div className="relative">
        {status === "current" && (
          <>
            <span
              className="duo-bounce absolute -top-[54px] left-1/2 z-10 whitespace-nowrap rounded-[12px] border-2 border-[var(--duo-grey)] bg-white px-3 py-2 text-[14px] font-[800] uppercase tracking-wide"
              style={{ color: "#d92b2b", fontFamily: "var(--font-display)" }}
            >
              {chest ? t("Défi !", "تحدي !") : t("Commencer", "ابدأ")}
              <span className="absolute -bottom-[8px] left-1/2 size-3.5 -translate-x-1/2 rotate-45 border-b-2 border-e-2 border-[var(--duo-grey)] bg-white" />
            </span>
            {/* Le petit taxi attend sur l'étape en cours. */}
            <Mascot pose="happy" size={64} className="pointer-events-none absolute top-[22px] z-10" style={x > 0 ? { right: 84 } : { left: 84 }} />
          </>
        )}
        <button
          className={cx("duo-node-img flex h-[88px] items-end justify-center", status === "current" && "duo-node-current")}
          data-status={status}
          aria-label={chest ? t("Défi de l'unité", "تحدي الوحدة") : `${t("Étape", "المرحلة")} ${node.index}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(open ? null : node.id);
          }}
        >
          <NodeImg look={look} dim={chest && status === "locked"} />
          {chest && status === "done" && (
            <span className="absolute end-0 top-2 grid size-7 place-items-center rounded-full bg-[#198754] text-[15px] font-[900] text-white ring-2 ring-white">✓</span>
          )}
        </button>
      </div>
      {open && <NodePopover node={node} status={status} path={path} color={color} shift={-x} />}
    </div>
  );
}

/** Bannière illustrée d'une section : le décor marocain traversé par cette partie de la route. */
function SectionScene({ id, n, title, done, total }: { id: string; n: number; title: string; done: number; total: number }) {
  const { lang, t } = useLang();
  const scene = SCENES[id];
  const color = SECTION_COLORS[id];
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="relative my-10 overflow-hidden rounded-[24px] border-2 border-[var(--duo-grey)] bg-white" style={{ boxShadow: "0 4px 0 var(--duo-grey-d)" }}>
      <img
        src={asset(`/decor/${scene.img}.webp`)}
        alt=""
        loading="lazy"
        className="aspect-[16/8] w-full object-cover object-bottom"
        style={scene.flip ? { transform: "scaleX(-1)" } : undefined}
      />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute start-4 top-3 text-white drop-shadow">
        <p className="text-[13px] font-[800] uppercase tracking-wider text-white/90" style={{ fontFamily: "var(--font-display)" }}>
          {t("Section", "القسم")} {n} · {lang === "ar" ? scene.ar : scene.fr}
        </p>
        <h2 className="duo-h !text-[22px] !text-white leading-tight sm:!text-[26px]">{title}</h2>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="duo-progress !h-3 flex-1">
          <span style={{ width: `${pct}%`, background: color.c }} />
        </div>
        <span className="duo-mono text-[13px] font-[700] text-[var(--duo-muted)]">
          {done}/{total}
        </span>
      </div>
    </div>
  );
}

function Summit({ status, remaining, path, nodeRef }: { status: NodeStatus; remaining: number; path: GamePath; nodeRef?: React.Ref<HTMLDivElement> }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const done = status === "done";
  const locked = status === "locked";
  return (
    <div
      ref={nodeRef}
      className="zellige zellige-dark relative mt-12 overflow-hidden rounded-[24px] border-2 border-[var(--duo-grey)] bg-gradient-to-b from-[#fef9e7] to-white px-5 pb-6 pt-6 text-center"
      style={{ boxShadow: "0 4px 0 var(--duo-grey-d)" }}
    >
      <button
        onClick={() => !locked && router.push(`/lecon/?id=${path.summit.id}`)}
        disabled={locked}
        aria-label={t("Le Sommet", "القمة")}
        className="duo-node-img mx-auto block disabled:cursor-not-allowed"
      >
        <NodeImg look="summit" dim={locked} />
      </button>
      <Mascot pose={done ? "trophy" : "permis"} size={110} className="absolute bottom-24 end-2 max-sm:hidden" />
      <h3 className="duo-h mt-3 text-2xl">{lang === "ar" ? path.summit.title.ar : path.summit.title.fr}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[15px] font-[600] text-[var(--duo-muted)]">
        {t("40 questions comme le jour de l'examen, 30 secondes chacune. Il faut 32 bonnes réponses.", "40 سؤالا كما في يوم الامتحان، 30 ثانية لكل سؤال. يجب 32 جوابا صحيحا.")}
      </p>
      {locked ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-[var(--duo-snow)] px-4 py-2 text-[15px] font-[800] text-[var(--duo-muted)]">
          <Lock className="size-4" /> {t("Encore", "تبقى")} {countLabel(lang, remaining, ["étape"], ["مرحلة", "مرحلتان", "مراحل", "مرحلة"])} {t("avant le sommet", "قبل القمة")}
        </p>
      ) : (
        <button onClick={() => router.push(`/lecon/?id=${path.summit.id}`)} className="duo-btn duo-btn-yellow mt-5 w-full max-w-xs">
          {done ? t("Refaire l'examen final", "أعد الامتحان النهائي") : t("Monter au sommet", "اصعد إلى القمة")} +{XP.summit} XP
        </button>
      )}
    </div>
  );
}

export function PathView() {
  const { lang, t } = useLang();
  const { bank, error } = useBank();
  const game = useStore((s) => s.game);
  const srs = useStore((s) => s.srs);
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const [currentVisible, setCurrentVisible] = useState<"above" | "below" | "in">("in");
  const path = useMemo(() => (bank ? buildPath(bank) : null), [bank]);
  // Route de chaque unité, composée une fois pour toutes (même tracé à chaque visite).
  const roads = useMemo(
    () => new Map(path ? path.sections.flatMap((s) => s.units).map((u) => [u.chapter.slug, layoutRoad(u.nodes.length, u.n)] as const) : []),
    [path],
  );
  const { ref: colRef, k } = useRoadScale();
  const cur = path ? currentIndex(path, game) : 0;
  const currentId = path?.flat[cur]?.id;

  useEffect(() => {
    // Ferme la fiche d'étape au clic ailleurs. React et cet écouteur sont tous deux sur le document :
    // stopPropagation ne suffit pas, on ignore donc les clics faits sur une étape (ou dans sa fiche).
    const close = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-path-node]")) return;
      setOpen(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // À l'arrivée : on centre l'étape en cours (on reprend là où on s'était arrêté).
  useEffect(() => {
    if (cur > 0 && currentRef.current) currentRef.current.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  }, [currentId, cur]);

  useEffect(() => {
    const el = currentRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCurrentVisible(e.isIntersecting ? "in" : e.boundingClientRect.top < 0 ? "above" : "below"));
    io.observe(el);
    return () => io.disconnect();
  }, [currentId]);

  if (error) return <p className="duo-card p-6 text-[var(--duo-red)]">{error}</p>;
  if (!path) {
    return (
      <div className="space-y-6">
        <div className="aspect-[16/8] animate-pulse rounded-[24px] bg-[var(--duo-grey)]" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="mx-auto size-[70px] animate-pulse rounded-full bg-[var(--duo-grey)]" style={{ transform: `translateX(${OFFSETS[i]}px)` }} />
        ))}
      </div>
    );
  }

  const statusAt = (i: number): NodeStatus => (game.done[path.flat[i].id] ? "done" : i === cur ? "current" : "locked");
  let flatI = 0;
  const remaining = path.flat.length - 1 - path.flat.slice(0, -1).filter((n) => game.done[n.id]).length;

  return (
    <div ref={colRef}>
      {/* Accueil du joueur */}
      {cur === 0 && (
        <div className="duo-card zellige zellige-dark mb-2 flex items-center gap-3 overflow-hidden p-4">
          <Mascot pose="welcome" size={110} className="duo-mascot-in shrink-0 max-sm:!h-[76px]" />
          <div>
            <p className="duo-h text-lg">{t("Bienvenue sur la Route du Maroc !", "مرحبا بك في طريق المغرب !")}</p>
            <p className="text-[15px] font-[500] text-[var(--duo-muted)]">
              {t(
                `${path.total} questions rangées de la plus facile à la plus difficile. Chaque étape : un cours express, puis les questions. Réussis-la pour débloquer la suivante, jusqu'au sommet.`,
                `${path.total} سؤالا مرتبة من الأسهل إلى الأصعب. في كل مرحلة: درس سريع ثم الأسئلة. أكملها بنجاح لتفتح الموالية، حتى القمة.`,
              )}
            </p>
          </div>
        </div>
      )}

      {path.sections.map((sec) => {
        const color = SECTION_COLORS[sec.id];
        const secNodes = sec.units.flatMap((u) => u.nodes);
        const secDone = secNodes.filter((n) => game.done[n.id]).length;
        return (
          <section key={sec.id} className="mb-6">
            <SectionScene id={sec.id} n={sec.n} title={lang === "ar" ? sec.ar : sec.fr} done={secDone} total={secNodes.length} />
            {sec.units.map((u) => {
              const road = roads.get(u.chapter.slug)!;
              const at = (i: number) => road.nodes[Math.min(i, road.nodes.length - 1)];
              const hasCurrent = u.nodes.some((n) => n.id === currentId);
              return (
                <div key={u.chapter.slug} className="mb-12">
                  <div
                    className="zellige sticky top-14 z-20 mb-12 flex items-center gap-3 overflow-hidden rounded-[24px] px-4 py-4 text-white md:top-4"
                    style={{ background: color.c, boxShadow: `0 5px 0 ${color.d}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-[800] uppercase tracking-wider text-white/85" style={{ fontFamily: "var(--font-display)" }}>
                        {t("Section", "القسم")} {sec.n}, {t("unité", "الوحدة")} {u.n}
                      </p>
                      <h2 className="truncate text-[20px] font-[800] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                        {nameOf(u.chapter, lang)}
                      </h2>
                    </div>
                    <Link
                      href={`/cours/${u.chapter.slug}/`}
                      className="flex shrink-0 items-center gap-2 rounded-[14px] border-2 bg-white/10 px-3 py-2.5 text-[13px] font-[800] uppercase tracking-wide"
                      style={{ borderColor: color.d, boxShadow: `0 3px 0 ${color.d}`, fontFamily: "var(--font-display)" }}
                    >
                      <BookOpen className="size-5" /> <span className="max-sm:hidden">{t("Guide", "الدليل")}</span>
                    </Link>
                  </div>
                  <div className="relative" style={{ height: road.height * k }}>
                    {/* Décor : bords adoucis si une rambarde ou un bas-côté dépasse de la colonne */}
                    <div className="pointer-events-none absolute -inset-y-24 inset-x-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%-20px),transparent)]">
                      <div className="absolute inset-x-0 top-24">
                        <UnitRoad
                          layout={road}
                          k={k}
                          n={u.n}
                          vehicle={UNIT_VEHICLE[u.chapter.slug] ?? SECTION_VEHICLES[sec.id][u.n % SECTION_VEHICLES[sec.id].length]}
                        />
                      </div>
                    </div>
                    {u.nodes.length > 4 && (
                      <img
                        src={asset(`/props/${UNIT_PROP[u.chapter.slug] ?? SECTION_PROPS[sec.id][u.n % SECTION_PROPS[sec.id].length]}.webp`)}
                        alt=""
                        className="pointer-events-none absolute h-[64px] w-auto"
                        // Côté opposé à l'étape voisine, pour ne pas cacher la route.
                        style={{ top: at(3).y * k - 40, ...(at(3).x > 0 ? { left: "4%" } : { right: "4%" }) }}
                      />
                    )}
                    {u.nodes.map((node, j) => {
                      const i = flatI++;
                      return (
                        <PathNode
                          key={node.id}
                          node={node}
                          status={statusAt(i)}
                          review={node.kind === "lesson" && node.qids.some((id) => srs[id] && srs[id].box < 5 && srs[id].due <= now)}
                          x={road.nodes[j].x * k}
                          y={road.nodes[j].y * k}
                          color={color}
                          path={path}
                          open={open === node.id}
                          setOpen={setOpen}
                          nodeRef={node.id === currentId ? currentRef : undefined}
                        />
                      );
                    })}
                    {u.nodes.length > 2 && !hasCurrent && (
                      <Mascot
                        pose={u.nodes.every((n) => game.done[n.id]) ? "medal" : unitPose(u.chapter.slug, sec.id, u.n)}
                        size={110}
                        className="pointer-events-none absolute max-[400px]:!h-[80px]"
                        // La mascotte se pose du côté opposé à la route.
                        style={{ top: at(1).y * k - 60, ...(at(1).x > 0 ? { left: "1%" } : { right: "1%" }) }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      <Summit status={statusAt(path.flat.length - 1)} remaining={remaining} path={path} nodeRef={currentId === path.summit.id ? currentRef : undefined} />

      <div className="mt-8 space-y-6 xl:hidden">
        <QuestsCard />
        <BadgesCard />
        <BackupCard />
      </div>

      {currentVisible !== "in" && (
        <button
          onClick={() => currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })}
          className="duo-btn duo-btn-ghost fixed bottom-24 end-4 z-30 !min-h-12 !rounded-full !px-4 md:bottom-8 xl:end-[calc(50%-200px)]"
          aria-label={t("Revenir à l'étape en cours", "العودة إلى المرحلة الحالية")}
        >
          {currentVisible === "above" ? <ArrowUp className="size-5" /> : <ArrowDown className="size-5" />}
        </button>
      )}
    </div>
  );
}
