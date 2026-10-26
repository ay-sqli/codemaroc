"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Shapes } from "lucide-react";
import { SCHEMAS, SCHEMA_ICONS, SchemaModal } from "@/components/schemas";
import { getChapter, nameOf } from "@/lib/courses";
import { schemaDesc, schemaTitle } from "@/lib/schemaMeta";
import { useLang } from "@/lib/i18n";
import { Breadcrumbs, PageHeader } from "@/components/ui";

export function SchemasGrid() {
  const { lang, t } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (h && SCHEMAS[h]) setOpen(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Schémas interactifs", "الرسوم التفاعلية") }]} />
        <PageHeader
          title={t("Schémas interactifs", "الرسوم التفاعلية")}
          desc={t(
            "Comprendre plutôt qu'apprendre par cœur : manipule les situations (vitesse, priorités, ronds-points, feux, sanctions…). Ces schémas s'ouvrent aussi depuis la correction d'une question ratée.",
            "افهم بدل أن تحفظ عن ظهر قلب: جرّب الوضعيات بنفسك (السرعة، الأسبقية، المدارات، الأضواء، العقوبات…). تُفتح هذه الرسوم أيضا من تصحيح كل سؤال أخطأت فيه.",
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(SCHEMAS).map(([id, s]) => {
          const Icon = SCHEMA_ICONS[id] ?? Shapes;
          const ch = s.chapters
            .map((c) => getChapter(c))
            .filter((c) => !!c)
            .map((c) => nameOf(c!, lang))
            .slice(0, 2);
          return (
            <button
              key={id}
              onClick={() => setOpen(id)}
              className="group flex flex-col overflow-hidden rounded-[8px] border border-line bg-white text-start transition-shadow hover:shadow-md"
            >
              <span className="grid aspect-[16/7] w-full place-items-center bg-panel">
                <span className="grid size-14 place-items-center rounded-[8px] bg-white text-brand shadow-sm">
                  <Icon className="size-7" strokeWidth={1.75} />
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-1 p-4">
                <span className="text-xs text-muted">{t("Schéma interactif", "رسم تفاعلي")}</span>
                <span className="text-base font-semibold text-ink group-hover:underline">{schemaTitle(s, lang)}</span>
                <span className="text-sm text-ink-2">{schemaDesc(s, lang)}</span>
                {ch.length > 0 && (
                  <span className="mt-auto pt-2 text-xs text-muted">
                    {t("Lié à :", "مرتبط بـ:")} {ch.join(" · ")}
                  </span>
                )}
                <span className="link mt-2 inline-flex items-center gap-1 text-sm">
                  {t("Ouvrir", "فتح")} <ArrowRight className="size-4" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {open && (
        <SchemaModal
          id={open}
          onClose={() => {
            setOpen(null);
            history.replaceState(null, "", window.location.pathname);
          }}
        />
      )}
    </div>
  );
}
