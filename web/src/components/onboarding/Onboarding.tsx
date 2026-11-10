"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, Clock, CloudCheck, Download, Hand, Keyboard, Lightbulb, ListChecks, ListTree, Shapes, Smartphone, Target, TrendingUp, Volume2, X, type LucideIcon,
} from "lucide-react";
import { asset } from "@/lib/base";
import { closeGuide, readGuidePosition, useGuide, writeGuidePosition } from "@/lib/guide";
import { useLang } from "@/lib/i18n";
import { setOnboarded } from "@/lib/store";
import { cx } from "@/components/ui";
import { GameIcon, type IconName } from "@/components/game/GameIcon";
import { Mascot } from "@/components/game/Mascot";
import data from "@/data/guide_shots.json";
import { CHAPTERS, type L, type Point, type Spot, type Step } from "./content";
import { Demo } from "./demos";
import { Rich } from "./Rich";

type Rect = [number, number, number, number];
type ShotMeta = { w: number; h: number; spots: Record<string, Record<string, Rect>> };
const SHOTS = (data as unknown as { shots: Record<string, ShotMeta> }).shots;

const FLAT = CHAPTERS.flatMap((c, ci) => c.steps.map((step, si) => ({ step, ci, si })));
const firstOf = (chapter: string) => Math.max(0, FLAT.findIndex((f) => CHAPTERS[f.ci].id === chapter));

const LUCIDE: Record<string, LucideIcon> = {
  book: BookOpen, target: Target, clock: Clock, check: CheckCircle2, hand: Hand, cloud: CloudCheck, keyboard: Keyboard,
  list: ListChecks, phone: Smartphone, download: Download, sound: Volume2, schema: Shapes, bulb: Lightbulb, stairs: TrendingUp,
};

function PointRow({ p, text }: { p: Point; text: string }) {
  const Icon = LUCIDE[p.ic];
  return (
    <li className="flex items-center gap-3 rounded-[16px] border-2 border-[var(--duo-grey)] bg-white p-3">
      {Icon ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[var(--duo-blue-50)] text-[var(--duo-blue)]">
          <Icon className="size-5" strokeWidth={2.3} />
        </span>
      ) : (
        <GameIcon name={p.ic as IconName} size={40} />
      )}
      <span className="min-w-0 text-[15px] font-[500] leading-relaxed text-[var(--duo-muted)]">
        <Rich text={text} />
      </span>
    </li>
  );
}

/** Capture d'un écran dans un cadre de téléphone : l'élément actif est éclairé et ramené au centre. */
function ShotViewer({ shot, spots, active, onPick }: { shot: string; spots: Spot[]; active: number; onPick: (i: number) => void }) {
  const { lang, t } = useLang();
  const meta = SHOTS[shot];
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!meta) return null;
  const pos = meta.spots[lang] ?? {};
  const imgH = size.w * (meta.h / meta.w);
  const current = spots[active] ? pos[spots[active].id] : undefined;
  const desktop = meta.w > 500;
  // On fait glisser la capture pour garder l'élément actif au milieu du cadre.
  const center = current ? ((current[1] + current[3] / 2) / 100) * imgH : 0;
  const shift = imgH <= size.h ? 0 : Math.round(Math.min(0, Math.max(size.h - imgH, size.h / 2 - center)));

  return (
    <div
      ref={box}
      dir="ltr"
      className={cx(
        "relative mx-auto overflow-hidden border-[5px] border-[#1c2833] bg-white",
        desktop ? "aspect-[16/10] w-full max-w-[640px] rounded-[14px]" : "h-[clamp(250px,42dvh,640px)] w-[min(76vw,300px)] rounded-[30px] md:h-[min(72dvh,640px)] md:w-[min(30vw,310px)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 transition-transform duration-500 ease-out" style={{ transform: `translateY(${shift}px)`, height: imgH || undefined }}>
        <img key={`${shot}-${lang}`} src={asset(`/guide/${lang}/${shot}.webp`)} alt={t("Capture de l'application", "صورة من التطبيق")} draggable={false} className="block h-auto w-full select-none" />
        {current && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-[12px] outline outline-[3px] outline-[#f5b041] transition-all duration-500 ease-out"
            style={{
              left: `${current[0]}%`,
              top: `${current[1]}%`,
              width: `${current[2]}%`,
              height: `${current[3]}%`,
              boxShadow: "0 0 0 2400px rgb(15 23 42 / 0.5)",
            }}
          />
        )}
        {spots.map((s, i) => {
          const r = pos[s.id];
          if (!r) return null;
          const on = i === active;
          return (
            <button
              key={s.id}
              onClick={() => onPick(i)}
              aria-label={`${i + 1}`}
              aria-current={on || undefined}
              className={cx(
                "absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[13px] font-[900] shadow-md transition-transform",
                on ? "z-20 scale-110 bg-[#f5b041] text-[#3b2a06]" : "z-10 bg-[#d92b2b] text-white",
              )}
              style={{ left: `${Math.min(95, Math.max(5, r[0] + Math.min(r[2], 12)))}%`, top: `${Math.max(1.5, r[1])}%` }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShotStep({ step, spot, setSpot }: { step: Extract<Step, { kind: "shot" }>; spot: number; setSpot: (i: number) => void }) {
  const { lang } = useLang();
  const p = (x: L) => (lang === "ar" ? x[1] : x[0]);
  const cur = step.spots[spot];
  return (
    <div className="mx-auto grid w-full max-w-[960px] gap-4 px-4 py-4 md:grid-cols-[auto_1fr] md:items-center md:gap-10 md:py-8">
      <ShotViewer shot={step.shot} spots={step.spots} active={spot} onPick={setSpot} />
      <div className="min-w-0">
        <h1 className="duo-h text-[22px] leading-tight md:text-[28px]">{p(step.title)}</h1>
        {step.lead && (
          <p className="mt-1 text-[15px] font-[500] leading-relaxed text-[var(--duo-muted)] md:text-[16px]">
            <Rich text={p(step.lead)} />
          </p>
        )}
        {cur && (
          <div key={cur.id} className="animate-pop mt-3 rounded-[18px] border-2 border-[#f5b041] bg-[#fef9e7] p-3.5 md:p-4">
            <p className="flex items-center gap-2 text-[17px] font-[800] leading-snug text-[var(--duo-ink)]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f5b041] text-[13px] font-[900] text-[#3b2a06]">{spot + 1}</span>
              {p(cur.title)}
            </p>
            <p className="mt-1.5 text-[15px] font-[500] leading-relaxed text-[#5c4a1f] md:text-[16px]">
              <Rich text={p(cur.body)} />
            </p>
          </div>
        )}
        {step.spots.length > 1 && (
          <ul className="mt-3 hidden space-y-1 md:block">
            {step.spots.map((s, i) => (
              <li key={s.id}>
                <button onClick={() => setSpot(i)} aria-current={i === spot || undefined} className={cx("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-start text-[15px] font-[700]", i === spot ? "bg-[var(--duo-snow)] text-[var(--duo-ink)]" : "text-[var(--duo-muted)] hover:bg-[var(--duo-snow)]")}>
                  <span className={cx("grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-[900] text-white", i === spot ? "bg-[#f5b041]" : "bg-[#d92b2b]")}>{i + 1}</span>
                  {p(s.title)}
                </button>
              </li>
            ))}
          </ul>
        )}
        {step.spots.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 md:hidden" aria-hidden="true">
            {step.spots.map((s, i) => (
              <span key={s.id} className={cx("h-2 rounded-full transition-all", i === spot ? "w-6 bg-[#f5b041]" : "w-2 bg-[var(--duo-grey-d)]")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IntroStep({ step }: { step: Extract<Step, { kind: "intro" }> }) {
  const { lang } = useLang();
  const p = (x: L) => (lang === "ar" ? x[1] : x[0]);
  return (
    <div className="mx-auto w-full max-w-[620px] px-4 py-5 md:py-10">
      <div className="flex items-center gap-3 md:block md:text-center">
        <Mascot pose={step.pose} size={112} className="duo-mascot-in shrink-0 md:mx-auto md:!h-[170px]" />
        <h1 className="duo-h text-[24px] leading-tight md:mt-4 md:text-[32px]">{p(step.title)}</h1>
      </div>
      <p className="mt-3 text-[16px] font-[500] leading-relaxed text-[var(--duo-muted)] md:text-center md:text-[17px]">
        <Rich text={p(step.body)} />
      </p>
      {step.points && (
        <ul className="mt-4 space-y-2">
          {step.points.map((pt, i) => (
            <PointRow key={i} p={pt} text={p(pt.t)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DemoStep({ step, go }: { step: Extract<Step, { kind: "demo" }>; go: (ch: string) => void }) {
  const { lang } = useLang();
  const p = (x: L) => (lang === "ar" ? x[1] : x[0]);
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-5 md:py-10">
      <h1 className="duo-h text-[23px] leading-tight md:text-[30px]">{p(step.title)}</h1>
      <p className="mb-4 mt-1.5 text-[15px] font-[500] leading-relaxed text-[var(--duo-muted)] md:text-[16px]">
        <Rich text={p(step.body)} />
      </p>
      <Demo id={step.demo} go={go} />
    </div>
  );
}

/** Guide plein écran : présente toute l'application, chapitre par chapitre. */
export default function Onboarding() {
  const { lang, t } = useLang();
  const router = useRouter();
  const request = useGuide();
  const p = (x: L) => (lang === "ar" ? x[1] : x[0]);
  const [state, setState] = useState(() => {
    const saved = readGuidePosition();
    const best = saved?.best ?? 0;
    if (request?.chapter) return { pos: firstOf(request.chapter), spot: 0, best };
    if (saved && saved.pos < FLAT.length) return { pos: saved.pos, spot: saved.spot, best };
    return { pos: 0, spot: 0, best: 0 };
  });
  const [menu, setMenu] = useState(false);
  const [quit, setQuit] = useState(false);
  const { pos, spot, best } = state;
  const body = useRef<HTMLDivElement>(null);
  const item = FLAT[pos];
  const step = item.step;
  const chapter = CHAPTERS[item.ci];
  const last = pos === FLAT.length - 1;
  const spots = step.kind === "shot" ? step.spots.length : 0;

  const goto = useCallback((nextPos: number, nextSpot = 0) => {
    setState((s) => ({ pos: nextPos, spot: nextSpot, best: Math.max(s.best, nextPos) }));
    body.current?.scrollTo({ top: 0 });
  }, []);
  const jump = useCallback(
    (ch: string) => {
      goto(firstOf(ch));
      setMenu(false);
    },
    [goto],
  );

  // Un nouveau chapitre demandé pendant que le guide est déjà ouvert.
  const seen = useRef(request?.at);
  useEffect(() => {
    if (request?.chapter && request.at !== seen.current) jump(request.chapter);
    seen.current = request?.at;
  }, [request, jump]);

  useEffect(() => writeGuidePosition({ pos, spot, best }), [pos, spot, best]);

  const finish = useCallback(() => {
    setOnboarded();
    writeGuidePosition(null);
    closeGuide();
    router.push("/");
  }, [router]);

  const leave = () => {
    setOnboarded();
    closeGuide();
  };

  const next = useCallback(() => {
    if (spot < spots - 1) return setState((s) => ({ ...s, spot: s.spot + 1 }));
    if (last) return finish();
    goto(pos + 1);
  }, [spot, spots, last, pos, goto, finish]);

  const prev = useCallback(() => {
    if (spot > 0) return setState((s) => ({ ...s, spot: s.spot - 1 }));
    if (pos === 0) return;
    const before = FLAT[pos - 1].step;
    goto(pos - 1, before.kind === "shot" ? Math.max(0, before.spots.length - 1) : 0);
  }, [spot, pos, goto]);

  // La page derrière le guide ne défile plus ; les images suivantes sont préchargées.
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    for (const f of FLAT.slice(pos + 1, pos + 3)) {
      if (f.step.kind === "shot") new Image().src = asset(`/guide/${lang}/${f.step.shot}.webp`);
    }
  }, [pos, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[aria-label="Image agrandie"], [aria-label="صورة مكبرة"]')) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") {
        setMenu(false);
        setQuit(false);
      }
      if (menu || quit) return;
      const forward = lang === "ar" ? "ArrowLeft" : "ArrowRight";
      const back = lang === "ar" ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward) next();
      if (e.key === back) prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, menu, quit, lang]);

  const percent = Math.round(((pos + (spots ? spot / spots : 0) + 1) / FLAT.length) * 100);
  const nextLabel = last ? t("C'est parti !", "هيا بنا !") : t("Continuer", "متابعة");

  return (
    <div className="duo fixed inset-0 z-[70] flex flex-col bg-[var(--duo-canvas)]" role="dialog" aria-modal="true" aria-label={t("Guide de l'application", "دليل التطبيق")}>
      <header className="shrink-0 border-b-2 border-[var(--duo-grey)] bg-white">
        <div className="mx-auto flex h-[60px] max-w-[960px] items-center gap-2 px-3">
          <button onClick={() => setQuit(true)} aria-label={t("Quitter le guide", "مغادرة الدليل")} className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--duo-muted)] hover:bg-[var(--duo-snow)]">
            <X className="size-6" strokeWidth={2.6} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-[800] uppercase tracking-wide text-[var(--duo-muted)]">
              {item.ci + 1}/{CHAPTERS.length} · {p(chapter.title)}
            </p>
            <div className="duo-progress mt-1 !h-2.5">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
          <button onClick={() => setMenu(true)} className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] px-2.5 text-[14px] font-[800] text-[var(--duo-blue)] hover:bg-[var(--duo-blue-50)]">
            <ListTree className="size-5" strokeWidth={2.4} /> <span className="max-[359px]:sr-only">{t("Sommaire", "المحتوى")}</span>
          </button>
        </div>
      </header>

      <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div key={pos} className="animate-pop">
          {step.kind === "intro" && <IntroStep step={step} />}
          {step.kind === "shot" && <ShotStep step={step} spot={spot} setSpot={(i) => setState((s) => ({ ...s, spot: i }))} />}
          {step.kind === "demo" && <DemoStep step={step} go={jump} />}
        </div>
      </div>

      <footer className="shrink-0 border-t-2 border-[var(--duo-grey)] bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[960px] items-center gap-3 px-4 py-3">
          <button onClick={prev} disabled={pos === 0 && spot === 0} className="duo-btn duo-btn-ghost !min-h-[50px] shrink-0 !px-4 disabled:opacity-40">
            {t("Retour", "رجوع")}
          </button>
          <button onClick={next} autoFocus className="duo-btn !min-h-[50px] flex-1">
            {nextLabel}
            {spots > 1 && !last && (
              <span className="duo-mono text-[13px] opacity-80" dir="ltr">
                {spot + 1}/{spots}
              </span>
            )}
            <ArrowRight className="flip-rtl size-5" />
          </button>
        </div>
      </footer>

      {menu && (
        <div className="absolute inset-0 z-20 flex flex-col bg-white">
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b-2 border-[var(--duo-grey)] px-4">
            <h2 className="duo-h text-[20px]">{t("Sommaire du guide", "محتوى الدليل")}</h2>
            <button onClick={() => setMenu(false)} aria-label={t("Fermer le sommaire", "إغلاق المحتوى")} className="grid size-10 place-items-center rounded-full text-[var(--duo-muted)] hover:bg-[var(--duo-snow)]">
              <X className="size-6" strokeWidth={2.6} />
            </button>
          </div>
          <ol className="mx-auto w-full max-w-[640px] flex-1 space-y-2 overflow-y-auto p-4">
            {CHAPTERS.map((c, i) => {
              const start = firstOf(c.id);
              const end = start + c.steps.length - 1;
              const done = best > end;
              const here = item.ci === i;
              return (
                <li key={c.id}>
                  <button onClick={() => jump(c.id)} aria-current={here || undefined} className={cx("flex w-full items-center gap-3 rounded-[16px] border-2 p-2.5 text-start", here ? "border-[#84d8ff] bg-[var(--duo-blue-50)]" : "border-[var(--duo-grey)] bg-white hover:bg-[var(--duo-snow)]")}>
                    <Mascot pose={c.pose} size={52} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-[800] leading-tight text-[var(--duo-ink)]">
                        {i + 1}. {p(c.title)}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-[500] leading-snug text-[var(--duo-muted)]">{p(c.desc)}</span>
                    </span>
                    {done && <Check className="size-6 shrink-0 text-[var(--duo-green)]" strokeWidth={3} />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {quit && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setQuit(false)}>
          <div className="duo-sheet w-full max-w-md rounded-t-[20px] bg-white p-6 text-center sm:rounded-[20px]" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <Mascot pose="thinking" size={120} className="duo-mascot-in mx-auto" />
            <p className="duo-h mt-3 text-[22px]">{t("Tu pars déjà ?", "هل ستغادر الآن ؟")}</p>
            <p className="mt-1 text-[15px] font-[600] text-[var(--duo-muted)]">{t("Tu reprendras au même endroit depuis Plus ou Mon profil.", "ستعود إلى المكان نفسه من المزيد أو ملفي.")}</p>
            <button onClick={() => setQuit(false)} autoFocus className="duo-btn duo-btn-blue mt-5 w-full">
              {t("Continuer le guide", "متابعة الدليل")}
            </button>
            <button onClick={leave} className="duo-btn duo-btn-plain mt-2 w-full">
              {t("Quitter le guide", "مغادرة الدليل")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
