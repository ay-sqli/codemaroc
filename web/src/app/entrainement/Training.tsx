"use client";

import { BackBar } from "@/components/BackButton";
import { BookMarked, Brain, Flame, Images, NotebookPen, Scale, Sparkles, type LucideIcon } from "lucide-react";
import { MODULES, nameOf } from "@/lib/courses";
import { countLabel, useLang } from "@/lib/i18n";
import { BankCounts } from "@/components/BankCounts";
import { ActionCard, Badge, ModuleIcon, PageHeader, ProductCard, SectionHeader } from "@/components/ui";

type ModeCard = { mode: string; icon: LucideIcon; title: [string, string]; desc: [string, string]; badge?: [string, string]; tint: string };

const MODES: ModeCard[] = [
  {
    mode: "mix",
    icon: Sparkles,
    title: ["Session du jour", "حصة اليوم"],
    desc: ["Priorité à ce que tu n'as jamais vu ou que tu rates.", "الأولوية لما لم تره من قبل أو لما تخطئ فيه."],
    badge: ["Recommandé", "موصى به"],
    tint: "bg-[#e3eefe] text-[#0056d2]",
  },
  {
    mode: "official",
    icon: BookMarked,
    title: ["Questions officielles", "الأسئلة الرسمية"],
    desc: ["La banque Perminou : questions officielles corrigées et expliquées.", "بنك أسئلة Perminou: صورة + صوت بالعربية، مصحح."],
    tint: "bg-[#efeafd] text-[#5c3de8]",
  },
  {
    mode: "rules",
    icon: Scale,
    title: ["Règles et chiffres", "القواعد والأرقام"],
    desc: ["Vitesses, distances, points, amendes, priorités.", "السرعات، المسافات، النقط، الغرامات، الأسبقية."],
    tint: "bg-[#fdecec] text-[#b00020]",
  },
  {
    mode: "signs",
    icon: Images,
    title: ["Panneaux et schémas", "العلامات والرسوم"],
    desc: ["Reconnaître les panneaux de tous les chapitres.", "التعرف على علامات جميع الدروس."],
    tint: "bg-[#fff1df] text-[#a35200]",
  },
  {
    mode: "weak",
    icon: Flame,
    title: ["Mes points faibles", "نقاط ضعفي"],
    desc: ["Les questions où tu te trompes le plus souvent.", "الأسئلة التي تخطئ فيها أكثر."],
    tint: "bg-[#fff6e0] text-[#8a5300]",
  },
  {
    mode: "notebook",
    icon: NotebookPen,
    title: ["Carnet d'erreurs", "دفتر الأخطاء"],
    desc: ["Révision espacée de tes erreurs (méthode Leitner).", "مراجعة متباعدة لأخطائك (طريقة لايتنر)."],
    tint: "bg-[#e6f4ea] text-[#137333]",
  },
  {
    mode: "new",
    icon: Brain,
    title: ["Jamais vues", "أسئلة جديدة"],
    desc: ["Uniquement des questions que tu n'as jamais faites.", "فقط الأسئلة التي لم تجب عنها من قبل."],
    tint: "bg-[#e5f4f1] text-[#0b7a6b]",
  },
];

export function Training() {
  const { lang, t } = useLang();
  const L = (p: [string, string]) => (lang === "ar" ? p[1] : p[0]);
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <BackBar items={[{ label: t("Accueil", "الرئيسية"), href: "/" }, { label: t("S'entraîner", "التمرن") }]} />
        <PageHeader
          title={t("S'entraîner", "التمرن")}
          desc={t(
            "Correction immédiate après chaque question : explication, règle à retenir, schéma interactif et lien vers le cours. Chaque erreur part dans ton carnet pour revenir au bon moment.",
            "تصحيح فوري بعد كل سؤال: شرح، قاعدة للحفظ، رسم تفاعلي ورابط نحو الدرس. كل خطأ يُضاف إلى دفترك ليعود إليك في الوقت المناسب.",
          )}
        />
        <BankCounts />
      </div>

      <section>
        <SectionHeader title={t("Modes d'entraînement", "أنماط التمرن")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map(({ mode, icon: Icon, title, desc, badge, tint }) => (
            <ProductCard
              key={mode}
              href={`/entrainement/session/?mode=${mode}`}
              media={
                <div className={`grid size-full place-items-center ${tint.split(" ")[0]}`}>
                  <Icon className={`size-12 ${tint.split(" ")[1]}`} strokeWidth={1.5} />
                </div>
              }
              eyebrow={badge ? <Badge tone="brand">{L(badge)}</Badge> : <span>{t("Entraînement", "تمرين")}</span>}
              title={L(title)}
              meta={L(desc)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard
          href="/examen/"
          title={t("Passer un examen blanc", "اجتز امتحانا تجريبيا")}
          desc={t("40 questions, 30 s chacune, 32/40 pour réussir", "40 سؤالا، 30 ثانية لكل سؤال، 32/40 للنجاح")}
          icon={<BookMarked className="size-9" strokeWidth={1.5} />}
        />
        <ActionCard
          href="/memo/"
          title={t("Revoir les astuces mémo", "راجع حيل الحفظ")}
          desc={t("Avant une session, 5 minutes de rappel", "قبل كل حصة، 5 دقائق من التذكير")}
          icon={<Brain className="size-9" strokeWidth={1.5} />}
        />
      </section>

      <section>
        <SectionHeader title={t("Par axe de formation", "حسب محور التكوين")} desc={t("30 questions mélangées sur l'ensemble d'un axe.", "30 سؤالا ممزوجة تشمل محورا كاملا.")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <a
              key={m.id}
              href={`/entrainement/session/?mode=module&c=${m.id}&n=30`}
              className="group flex items-center gap-4 rounded-[16px] border-2 border-line p-4 transition-shadow hover:shadow-md"
            >
              <ModuleIcon id={m.id} size="lg" />
              <span className="min-w-0">
                <span className="block font-semibold text-ink group-hover:underline">{nameOf(m, lang)}</span>
                <span className="text-sm text-muted">{countLabel(lang, m.chapters.length, ["chapitre"], ["درس", "درسان", "دروس", "درسا"])}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
