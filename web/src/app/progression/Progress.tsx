"use client";

import { useMemo, useRef } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { MODULES, nameOf } from "@/lib/courses";
import { exportState, importState, resetState, streak, updateSettings, useStore } from "@/lib/store";
import { useBank } from "@/lib/questions";
import { useLang } from "@/lib/i18n";
import { LangSwitch } from "@/components/AppShell";
import { Breadcrumbs, Button, Field, Input, ModuleIcon, PageHeader, SectionHeader, Stat, cx } from "@/components/ui";

export function Progress() {
  const { lang, t } = useLang();
  const answers = useStore((s) => s.answers);
  const read = useStore((s) => s.read);
  const days = useStore((s) => s.days);
  const exams = useStore((s) => s.exams);
  const settings = useStore((s) => s.settings);
  const flags = useStore((s) => s.flags);
  const { bank } = useBank();
  const file = useRef<HTMLInputElement>(null);

  const perModule = useMemo(
    () =>
      MODULES.map((m) => {
        const slugs = new Set(m.chapters.map((c) => c.slug));
        let seen = 0, ok = 0, total = 0;
        bank?.all.forEach((q, id) => {
          if (!slugs.has(q.chapter)) return;
          total++;
          const a = answers[id];
          if (a) {
            seen++;
            if (a.lastOk) ok++;
          }
        });
        return { m, seen, ok, total, read: m.chapters.filter((c) => read[c.slug]).length };
      }),
    [answers, bank, read],
  );

  const last30 = useMemo(() => {
    const out: { d: string; n: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const x = new Date(now);
      x.setDate(now.getDate() - i);
      const k = x.toISOString().slice(0, 10);
      out.push({ d: k, n: days[k] ?? 0 });
    }
    return out;
  }, [days]);
  const maxDay = Math.max(1, ...last30.map((d) => d.n));
  const totalSeen = Object.keys(answers).length;
  const totalOk = Object.values(answers).filter((a) => a.lastOk).length;
  const nFlags = Object.keys(flags).length;

  const download = () => {
    const blob = new Blob([exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progression-code-maroc-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("Progression", "التقدم") }]} />
        <PageHeader
          title={t("Ma progression", "تقدمي")}
          desc={t("Tes statistiques de révision, tes réglages et la sauvegarde de tes données.", "إحصائيات مراجعتك، إعداداتك، وحفظ بياناتك.")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("Questions vues", "الأسئلة المُطّلع عليها")} value={totalSeen} hint={bank ? t(`sur ${bank.all.size}`, `من أصل ${bank.all.size}`) : undefined} />
        <Stat
          label={t("Réussies au dernier essai", "صحيحة في آخر محاولة")}
          value={totalSeen ? `${Math.round((totalOk / totalSeen) * 100)} %` : "—"}
          tone="ok"
        />
        <Stat
          label={t("Examens blancs", "الامتحانات التجريبية")}
          value={exams.length}
          hint={exams.length ? t(`meilleure note ${Math.max(...exams.map((e) => e.score))}/40`, `أفضل نقطة ${Math.max(...exams.map((e) => e.score))}/40`) : undefined}
        />
        <Stat label={t("Série de jours", "أيام متتالية")} value={t(`${streak(days)} j`, `${streak(days)} ي`)} tone="brand" />
      </div>

      <section>
        <SectionHeader title={t("Activité des 30 derniers jours", "النشاط خلال آخر 30 يوما")} />
        <div className="rounded-[8px] border border-line p-5">
          <div className="flex h-32 items-end gap-1">
            {last30.map((d) => (
              <div
                key={d.d}
                className={cx("flex-1 rounded-t-[2px]", d.n ? "bg-brand" : "bg-[#e1e6ee]")}
                style={{ height: `${Math.max(4, (d.n / maxDay) * 100)}%` }}
                title={t(`${d.d} : ${d.n} questions`, `${d.d}: ${d.n} سؤالا`)}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{t("Il y a 30 jours", "قبل 30 يوما")}</span>
            <span>{t("Aujourd'hui", "اليوم")}</span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title={t("Maîtrise par axe", "الإتقان حسب المحور")}
          desc={t(
            "Barre bleue : questions réussies au dernier essai. Barre orange : vues mais ratées.",
            "الشريط الأزرق: أسئلة صحيحة في آخر محاولة. الشريط البرتقالي: أسئلة رأيتها لكنك أخطأت فيها.",
          )}
        />
        <div className="divide-y divide-line rounded-[8px] border border-line">
          {perModule.map(({ m, seen, ok, total, read: r }) => (
            <div key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-72">
                <ModuleIcon id={m.id} size="md" />
                <div>
                  <p className="font-semibold">{nameOf(m, lang)}</p>
                  <p className="text-xs text-muted">{t(`${r}/${m.chapters.length} fiches lues`, `${r}/${m.chapters.length} ملخصات مقروءة`)}</p>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-[#e1e6ee]">
                  <div className="bg-brand" style={{ width: `${total ? (ok / total) * 100 : 0}%` }} />
                  <div className="bg-warn-500" style={{ width: `${total ? ((seen - ok) / total) * 100 : 0}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {t(`${seen}/${total} questions vues · ${ok} réussies`, `${seen}/${total} سؤالا تمت رؤيتها · ${ok} صحيحة`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[8px] border border-line p-5">
          <h2 className="t-h4 mb-4">{t("Réglages", "الإعدادات")}</h2>
          <div className="space-y-4">
            <Field label={t("Langue du site", "لغة الموقع")} hint={t("Le site existe en français et en arabe.", "الموقع متوفر بالفرنسية والعربية.")}>
              <LangSwitch className="h-auto px-0" />
            </Field>
            <Field label={t("Date de mon examen", "تاريخ امتحاني")} hint={t("Affiche un compte à rebours dans l'en-tête.", "يعرض العد التنازلي في أعلى الصفحة.")}>
              <Input type="date" value={settings.examDate ?? ""} onChange={(e) => updateSettings({ examDate: e.target.value })} className="max-w-xs" />
            </Field>
            <Field label={t("Objectif quotidien (questions par jour)", "الهدف اليومي (عدد الأسئلة في اليوم)")}>
              <Input
                type="number"
                min={10}
                max={300}
                step={10}
                value={settings.dailyGoal}
                onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}
                className="max-w-[140px]"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[8px] border border-line p-5">
          <h2 className="t-h4 mb-2">{t("Sauvegarde", "الحفظ")}</h2>
          <p className="mb-4 text-sm text-ink-2">
            {t(
              "Ta progression est enregistrée uniquement dans ce navigateur. Exporte-la pour la transférer sur un autre appareil.",
              "يُحفظ تقدمك في هذا المتصفح فقط. قم بتصديره لنقله إلى جهاز آخر.",
            )}
            {nFlags > 0 &&
              t(
                ` Tu as signalé ${nFlags} corrigé(s) à vérifier (inclus dans l'export).`,
                ` لقد أبلغت عن ${nFlags} تصحيح(ات) للتحقق (مضمنة في ملف التصدير).`,
              )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Download className="size-4" />} onClick={download}>
              {t("Exporter", "تصدير")}
            </Button>
            <Button variant="secondary" icon={<Upload className="size-4" />} onClick={() => file.current?.click()}>
              {t("Importer", "استيراد")}
            </Button>
            <Button
              variant="danger"
              icon={<RotateCcw className="size-4" />}
              onClick={() =>
                confirm(t("Effacer toute ta progression ? Cette action est définitive.", "هل تريد مسح كل تقدمك؟ هذا الإجراء نهائي.")) && resetState()
              }
            >
              {t("Réinitialiser", "إعادة التعيين")}
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  importState(await f.text());
                  alert(t("Progression importée.", "تم استيراد التقدم."));
                } catch {
                  alert(t("Fichier invalide", "ملف غير صالح"));
                }
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
