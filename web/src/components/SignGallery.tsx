"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { asset } from "@/lib/base";
import { useBank } from "@/lib/questions";
import { Button, Skeleton } from "./ui";
import { countLabel, useLang } from "@/lib/i18n";

/** Galerie des panneaux d'un chapitre, en mode « flashcards » (cacher / révéler l'intitulé). */
export function SignGallery({ chapter }: { chapter?: string }) {
  const { lang, t } = useLang();
  const { bank } = useBank();
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [q, setQ] = useState("");
  const cards = useMemo(() => {
    const all = bank?.cards.filter((c) => !chapter || c.chapter === chapter) ?? [];
    if (!q) return all;
    const needle = q.toLowerCase();
    return all.filter((c) => (lang === "ar" ? `${c.label} ${c.section}` : `${c.labelFr} ${c.sectionFr}`).toLowerCase().includes(needle));
  }, [bank, chapter, q, lang]);

  if (!bank) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[12px] border-2 border-line-strong px-3 focus-within:border-brand sm:max-w-sm">
          <Search className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Rechercher un panneau…", "ابحث عن علامة…")}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <Button
          variant={hide ? "primary" : "secondary"}
          icon={hide ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          onClick={() => {
            setHide((h) => !h);
            setRevealed(new Set());
          }}
        >
          {hide ? t("Mode flashcards activé", "وضع البطاقات مفعّل") : t("Me tester (cacher les réponses)", "اختبر نفسي (إخفاء الأجوبة)")}
        </Button>
        <span className="text-sm text-muted">{countLabel(lang, cards.length, ["carte"], ["بطاقة", "بطاقتان", "بطاقات", "بطاقة"])}</span>
      </div>
      {hide && <p className="text-sm text-muted">{t("Clique sur une carte pour révéler sa signification.", "انقر على بطاقة لإظهار معناها.")}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c, i) => {
          const show = !hide || revealed.has(i);
          const label = lang === "ar" ? c.label : c.labelFr;
          return (
            <button
              key={c.img + i}
              onClick={() => setRevealed((r) => new Set(r).add(i))}
              className="flex flex-col items-center gap-2 rounded-[16px] border-2 border-line bg-white p-3 text-center transition-shadow hover:shadow-md"
            >
              <img src={asset(c.img)} alt="" data-zoom data-caption={show ? label : ""} loading="lazy" className="h-24 w-full object-contain" />
              <span className={`${lang === "ar" ? "ar " : ""}text-[13px] leading-snug text-ink-2 ${show ? "" : "select-none blur-sm"}`}>
                {show ? label : "••••••••••"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
