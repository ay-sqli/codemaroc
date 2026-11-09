"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CHAPTERS, MODULES, coverOf, ficheStats, moduleDesc, moduleOf, nameOf } from "@/lib/courses";
import { useStore } from "@/lib/store";
import { countLabel, useLang } from "@/lib/i18n";
import {
  Badge, Breadcrumbs, Button, ChapterCover, Checkbox, Chip, EmptyState, ModuleIcon, PageHeader, ProductCard, cx,
} from "@/components/ui";

type Status = "all" | "unread" | "read" | "errors";
type Sort = "programme" | "az" | "errors";

export function Catalog() {
  const { lang, t } = useLang();
  const sp = useSearchParams();
  const router = useRouter();
  const read = useStore((s) => s.read);
  const srs = useStore((s) => s.srs);
  const axeParam = sp.get("axe");
  const [axes, setAxes] = useState<string[]>(axeParam ? [axeParam] : []);
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("programme");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Navigation vers /cours/?axe=… depuis le menu alors que la page est déjà ouverte
  const [seenParam, setSeenParam] = useState(axeParam);
  if (seenParam !== axeParam) {
    setSeenParam(axeParam);
    setAxes(axeParam ? [axeParam] : []);
  }

  const errors = useMemo(() => {
    const m = new Map<string, number>();
    Object.values(srs).forEach((i) => i.box < 5 && m.set(i.chapter, (m.get(i.chapter) ?? 0) + 1));
    return m;
  }, [srs]);

  const list = useMemo(() => {
    let l = CHAPTERS.filter((c) => !axes.length || axes.includes(c.module));
    if (status === "read") l = l.filter((c) => read[c.slug]);
    if (status === "unread") l = l.filter((c) => !read[c.slug]);
    if (status === "errors") l = l.filter((c) => errors.get(c.slug));
    const n = q.trim().toLowerCase();
    if (n) l = l.filter((c) => c.fr.toLowerCase().includes(n) || c.ar.includes(q.trim()));
    if (sort === "az") l = [...l].sort((a, b) => nameOf(a, lang).localeCompare(nameOf(b, lang), lang));
    if (sort === "errors") l = [...l].sort((a, b) => (errors.get(b.slug) ?? 0) - (errors.get(a.slug) ?? 0));
    return l;
  }, [axes, status, sort, q, read, errors, lang]);

  const toggleAxe = (id: string) => {
    const nextAxes = axes.includes(id) ? axes.filter((a) => a !== id) : [...axes, id];
    setAxes(nextAxes);
    router.replace(nextAxes.length === 1 ? `/cours/?axe=${nextAxes[0]}` : "/cours/", { scroll: false });
  };
  const reset = () => {
    setAxes([]);
    setStatus("all");
    setQ("");
    router.replace("/cours/", { scroll: false });
  };
  const single = axes.length === 1 ? MODULES.find((m) => m.id === axes[0]) : null;
  const results = countLabel(lang, list.length, ["résultat"], ["نتيجة", "نتيجتان", "نتائج", "نتيجة"]);
  const statusLabels: Record<Status, string> = {
    all: t("Tous les chapitres", "جميع الدروس"),
    unread: t("Pas encore lus", "لم تُقرأ بعد"),
    read: t("Déjà lus", "مقروءة"),
    errors: t("Avec des erreurs à revoir", "بها أخطاء للمراجعة"),
  };

  const filters = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[15px] font-semibold">{t("Axe de formation", "محور التكوين")}</p>
        {MODULES.map((m) => (
          <Checkbox
            key={m.id}
            checked={axes.includes(m.id)}
            onChange={() => toggleAxe(m.id)}
            label={<span className="inline-flex items-center gap-2"><ModuleIcon id={m.id} size="xs" />{nameOf(m, lang)}</span>}
            count={m.chapters.length}
          />
        ))}
      </div>
      <div>
        <p className="mb-2 text-[15px] font-semibold">{t("Statut", "الحالة")}</p>
        {(["all", "unread", "read", "errors"] as Status[]).map((id) => (
          <Checkbox key={id} checked={status === id} onChange={() => setStatus(id)} label={statusLabels[id]} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("Accueil", "الرئيسية"), href: "/" },
          { label: t("Cours", "الدروس"), href: single ? "/cours/" : undefined },
          ...(single ? [{ label: nameOf(single, lang) }] : []),
        ]}
      />
      <PageHeader
        title={single ? nameOf(single, lang) : t("Tous les cours du code de la route", "جميع دروس مدونة السير")}
        desc={
          single
            ? moduleDesc(single, lang)
            : t(
                "Les 54 chapitres du programme Perminou-NARSA, résumés en fiches et en cartes mentales, avec les panneaux à connaître et un quiz corrigé pour chacun.",
                "الدروس الأربعة والخمسون لبرنامج Perminou-NARSA، ملخصة في بطاقات وخرائط ذهنية، مع العلامات التي يجب معرفتها واختبار مصحح لكل درس.",
              )
        }
      />

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" className="lg:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setFiltersOpen(true)}>
              {t("Filtres", "التصفية")}
            </Button>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Filtrer par titre…", "تصفية حسب العنوان…")}
              className="h-9 min-w-0 flex-1 rounded-[12px] border-2 border-line-strong px-3 text-sm focus:border-brand focus:outline-none sm:max-w-xs"
            />
            <p className="text-sm text-muted">
              <b className="font-semibold text-ink">{results}</b>
            </p>
            <label className="ms-auto flex items-center gap-2 text-sm text-muted">
              {t("Trier par", "ترتيب حسب")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 rounded-[12px] border-2 border-line-strong bg-white px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none"
              >
                <option value="programme">{t("Ordre du programme", "ترتيب البرنامج")}</option>
                <option value="az">{t("Titre (A → Z)", "العنوان (أ ← ي)")}</option>
                <option value="errors">{t("Erreurs à revoir", "الأخطاء للمراجعة")}</option>
              </select>
            </label>
          </div>

          {(axes.length > 0 || status !== "all") && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {axes.map((a) => {
                const m = MODULES.find((x) => x.id === a);
                return (
                  <Chip key={a} selected onClick={() => toggleAxe(a)} icon={<X className="size-3.5" />}>
                    {m ? nameOf(m, lang) : a}
                  </Chip>
                );
              })}
              {status !== "all" && (
                <Chip selected onClick={() => setStatus("all")} icon={<X className="size-3.5" />}>
                  {statusLabels[status]}
                </Chip>
              )}
              <button onClick={reset} className="link text-sm">
                {t("Tout effacer", "مسح الكل")}
              </button>
            </div>
          )}

          {list.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {list.map((c) => {
                const st = ficheStats(c);
                const err = errors.get(c.slug) ?? 0;
                const mod = moduleOf(c.slug);
                const idx = (mod?.chapters.findIndex((x) => x.slug === c.slug) ?? 0) + 1;
                return (
                  <ProductCard
                    key={c.slug}
                    href={`/cours/${c.slug}/`}
                    square
                    media={<ChapterCover module={c.module} img={coverOf(c)} />}
                    eyebrow={
                      <>
                        <ModuleIcon id={c.module} size="xs" /> {mod ? nameOf(mod, lang) : ""} · {t("Chapitre", "الدرس")} {idx}
                      </>
                    }
                    title={nameOf(c, lang)}
                    meta={
                      <span>
                        {lang === "ar"
                          ? `ملخص · ${countLabel("ar", st.sections, ["section"], ["قسم", "قسمان", "أقسام", "قسما"])} · ${st.minutes} د${c.nCards ? ` · ${c.nCards} علامة` : ""}`
                          : `Fiche · ${st.sections} sections · ${st.minutes} min${c.nCards ? ` · ${c.nCards} panneaux` : ""}`}
                      </span>
                    }
                    footer={
                      <div className={cx("flex flex-wrap gap-1.5", (read[c.slug] || err > 0) && "pt-2")}>
                        {read[c.slug] && <Badge tone="success">{t("Lu", "مقروء")}</Badge>}
                        {err > 0 && <Badge tone="error">{countLabel(lang, err, ["erreur"], ["خطأ", "خطآن", "أخطاء", "خطأ"])}</Badge>}
                      </div>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              mascot="search"
              title={t("Aucun chapitre ne correspond", "لا يوجد درس مطابق")}
              desc={t("Modifie les filtres ou efface la recherche.", "غيّر معايير التصفية أو امسح البحث.")}
              action={
                <Button variant="secondary" onClick={reset}>
                  {t("Réinitialiser les filtres", "إعادة تعيين التصفية")}
                </Button>
              }
            />
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] bg-[#1f1f1f]/50 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="animate-pop absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[12px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="t-h3">{t("Filtres", "التصفية")}</p>
              <button onClick={() => setFiltersOpen(false)} className="link text-sm">
                {t("Fermer", "إغلاق")}
              </button>
            </div>
            {filters}
            <Button block className="mt-6" onClick={() => setFiltersOpen(false)}>
              {t(`Afficher ${results}`, `عرض ${results}`)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
