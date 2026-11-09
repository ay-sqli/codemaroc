"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BellRing, BookOpen, ClipboardCheck, Lightbulb, NotebookPen, Shapes, Target } from "lucide-react";
import { CHAPTERS, MODULES, coverOf, getChapter, moduleOf, nameOf } from "@/lib/courses";
import { streak, today, useStore } from "@/lib/store";
import { useBank } from "@/lib/questions";
import { SCHEMAS, SCHEMA_ICONS } from "@/components/schemas";
import { schemaTitle } from "@/lib/schemaMeta";
import { MEMO_ITEMS, memoText, type MemoItem } from "@/lib/memo";
import { countLabel, useLang } from "@/lib/i18n";
import { daysLabel } from "@/components/AppShell";
import {
  Accordion, ActionCard, Badge, ButtonLink, ChapterCover, Chip, GradientBanner, HeroBanner, LightBanner, ListItem, ModuleIcon,
  Panel, PillTabs, ProductCard, ProgressBar, SectionHeader, StatBanner,
} from "@/components/ui";

const FAQ_FR = [
  {
    q: "Comment se déroule l'examen théorique du permis B au Maroc ?",
    a: "L'examen comporte 40 questions projetées en image avec un commentaire audio en arabe. Pour chaque question, tu coches une ou plusieurs cases (1 à 4). Tu disposes d'environ 30 secondes par question. Il faut au moins 32 bonnes réponses sur 40 pour réussir.",
  },
  {
    q: "Par où commencer mes révisions ?",
    a: "Lis les fiches de l'axe « La route » (signalisation), puis « Règles de circulation » : elles représentent la majorité des questions. Après chaque fiche, lance le quiz du chapitre. Les erreurs partent automatiquement dans ton carnet.",
  },
  {
    q: "Comment fonctionne le carnet d'erreurs ?",
    a: "Chaque question ratée revient selon la méthode Leitner : le lendemain, puis après 2, 4, 8 et 16 jours. Une bonne réponse la fait monter d'une boîte, une erreur la renvoie au début. Au bout de 5 bonnes réponses espacées, elle est considérée comme maîtrisée.",
  },
  {
    q: "Les corrigés des questions officielles sont-ils fiables ?",
    a: "Ils sont rédigés à partir des cours Perminou et du code de la route. Quand l'image est peu lisible, la question est marquée « corrigé avec réserve ». Si tu constates une autre réponse sur Perminou, utilise le bouton « Signaler le corrigé ».",
  },
  {
    q: "Ma progression est-elle sauvegardée ?",
    a: "Oui, dans ce navigateur uniquement (aucun compte n'est nécessaire). Depuis la page Progression, tu peux exporter un fichier de sauvegarde et l'importer sur un autre appareil.",
  },
];

const FAQ_AR = [
  {
    q: "كيف يمر الامتحان النظري لرخصة السياقة صنف ب في المغرب ؟",
    a: "يتكون الامتحان من 40 سؤالا تُعرض على شكل صور مع تعليق صوتي باللغة العربية. في كل سؤال تختار خانة واحدة أو أكثر (من 1 إلى 4). لديك حوالي 30 ثانية لكل سؤال. يجب الحصول على 32 جوابا صحيحا على الأقل من أصل 40 للنجاح.",
  },
  {
    q: "من أين أبدأ المراجعة ؟",
    a: "اقرأ ملخصات محور « الطريق » (التشوير)، ثم محور « قواعد السير »: فهما يمثلان أغلب الأسئلة. بعد كل ملخص، أطلق اختبار الدرس. الأخطاء تُضاف تلقائيا إلى دفترك.",
  },
  {
    q: "كيف يعمل دفتر الأخطاء ؟",
    a: "كل سؤال أخطأت فيه يعود إليك حسب طريقة لايتنر: في اليوم الموالي، ثم بعد 2 و4 و8 و16 يوما. الجواب الصحيح يرفعه درجة، والخطأ يعيده إلى البداية. بعد 5 أجوبة صحيحة متباعدة، يُعتبر السؤال متقنا.",
  },
  {
    q: "هل تصحيحات الأسئلة الرسمية موثوقة ؟",
    a: "حُررت انطلاقا من دروس Perminou ومدونة السير. عندما تكون الصورة غير واضحة، يُشار إلى السؤال بعبارة « تصحيح مع تحفظ ». إذا وجدت جوابا مختلفا على Perminou، استعمل زر « الإبلاغ عن التصحيح ».",
  },
  {
    q: "هل يتم حفظ تقدمي ؟",
    a: "نعم، في هذا المتصفح فقط (لا حاجة لإنشاء حساب). من صفحة التقدم، يمكنك تصدير ملف الحفظ واستيراده على جهاز آخر.",
  },
];

export function Dashboard() {
  const { lang, t } = useLang();
  const answers = useStore((s) => s.answers);
  const srs = useStore((s) => s.srs);
  const read = useStore((s) => s.read);
  const days = useStore((s) => s.days);
  const exams = useStore((s) => s.exams);
  const settings = useStore((s) => s.settings);
  const { bank } = useBank();
  const [tipItem, setTip] = useState<MemoItem | null>(null);
  const [tab, setTab] = useState(MODULES[0].id);
  // Tirage côté client uniquement (évite un écart de rendu serveur / client)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTip(MEMO_ITEMS[Math.floor(Math.random() * MEMO_ITEMS.length)]), []);
  const tip = tipItem ? memoText(tipItem, lang) : null;

  const [now] = useState(() => Date.now());
  const dueByChapter = useMemo(() => {
    const m = new Map<string, number>();
    Object.values(srs).forEach((i) => i.box < 5 && i.due <= now && m.set(i.chapter, (m.get(i.chapter) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [srs, now]);
  const due = dueByChapter.reduce((s, [, n]) => s + n, 0);

  const weak = useMemo(() => {
    const m = new Map<string, { ko: number; seen: number }>();
    bank?.all.forEach((q, id) => {
      const a = answers[id];
      if (!a) return;
      const v = m.get(q.chapter) ?? { ko: 0, seen: 0 };
      v.seen += 1;
      v.ko += a.lastOk ? 0 : 1;
      m.set(q.chapter, v);
    });
    return [...m.entries()].filter(([, v]) => v.ko > 0).sort((a, b) => b[1].ko / b[1].seen - a[1].ko / a[1].seen).slice(0, 3);
  }, [answers, bank]);

  const unread = CHAPTERS.filter((c) => !read[c.slug]);
  const next = unread[0];
  const readCount = CHAPTERS.length - unread.length;
  const todayCount = days[today()] ?? 0;
  const vals = Object.values(answers);
  const successRate = vals.length ? Math.round((vals.filter((a) => a.lastOk).length / vals.length) * 100) : null;
  const lastExam = exams[exams.length - 1];
  const total = bank ? bank.official.length + bank.rules.length + bank.signs.length : 0;
  const tabModule = MODULES.find((m) => m.id === tab)!;
  const modName = (slug: string) => {
    const m = moduleOf(slug);
    return m ? nameOf(m, lang) : "";
  };
  const s = streak(days);

  const qN = (n: number) => countLabel(lang, n, ["question"], ["سؤال", "سؤالان", "أسئلة", "سؤالا"]);
  const errN = (n: number) => countLabel(lang, n, ["erreur"], ["خطأ", "خطآن", "أخطاء", "خطأ"]);

  return (
    <div className="space-y-12">
      {/* Bandeaux principaux */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HeroBanner
          title={t("Prêt pour l'examen du code ?", "هل أنت مستعد لامتحان رخصة السياقة ؟")}
          desc={t(
            "40 questions en conditions réelles : image et 30 secondes par question. Il faut 32 bonnes réponses pour réussir.",
            "40 سؤالا في ظروف حقيقية: صورة، تعليق صوتي بالعربية، و30 ثانية لكل سؤال. يلزمك 32 جوابا صحيحا للنجاح.",
          )}
          actions={
            <ButtonLink href="/examen/" variant="inverse" iconEnd={<ArrowRight className="size-4" />}>
              {t("Passer un examen blanc", "اجتز امتحانا تجريبيا")}
            </ButtonLink>
          }
          visual={
            <div className="relative size-full">
              <div className="absolute end-6 top-1/2 w-44 -translate-y-1/2 rotate-[-4deg] rounded-[16px] bg-white p-3 text-ink shadow-lg">
                <p className="text-xs text-muted">{t("Dernier examen", "آخر امتحان")}</p>
                <p className="text-3xl font-semibold" dir="ltr">{lastExam ? `${lastExam.score}/${lastExam.total}` : "— /40"}</p>
                <div className="mt-2">
                  <ProgressBar value={lastExam ? lastExam.score : 0} max={40} tone={lastExam && lastExam.score >= 32 ? "ok" : "brand"} />
                </div>
                <p className="mt-2 text-xs text-muted">{t("Seuil de réussite : 32", "عتبة النجاح: 32")}</p>
              </div>
              <div className="absolute end-40 top-6 grid size-12 rotate-[6deg] place-items-center rounded-[16px] bg-brand text-white shadow-lg">
                <ClipboardCheck className="size-6" />
              </div>
            </div>
          }
        />
        <LightBanner
          overline={
            next ? (
              <span className="inline-flex items-center gap-2">
                <ModuleIcon id={next.module} size="xs" /> {modName(next.slug)}
              </span>
            ) : (
              t("Programme terminé", "انتهى البرنامج")
            )
          }
          title={next ? nameOf(next, lang) : t("Toutes les fiches sont lues", "قرأت جميع الملخصات")}
          desc={next ? t("Fiche résumée, mindmap, panneaux et quiz corrigé.", "ملخص، خريطة ذهنية، علامات واختبار مصحح.") : t("Passe maintenant aux examens blancs et à ton carnet d'erreurs.", "انتقل الآن إلى الامتحانات التجريبية ودفتر أخطائك.")}
          actions={
            next ? (
              <ButtonLink href={`/cours/${next.slug}/`} iconEnd={<ArrowRight className="size-4" />}>
                {readCount ? t("Reprendre le cours", "تابع الدرس") : t("Commencer le premier cours", "ابدأ الدرس الأول")}
              </ButtonLink>
            ) : (
              <ButtonLink href="/examen/">{t("Examen blanc", "امتحان تجريبي")}</ButtonLink>
            )
          }
          visual={next ? <ChapterCover module={next.module} img={coverOf(next)} className="rounded-s-[12px]" /> : undefined}
        />
      </div>

      {/* Aujourd'hui : trois panneaux */}
      <section>
        <SectionHeader
          title={t("Ton programme du jour", "برنامجك اليوم")}
          desc={
            lang === "ar"
              ? `${qN(todayCount)} اليوم من أصل هدف ${settings.dailyGoal} · سلسلة ${daysLabel(s, "ar")}`
              : `${todayCount} question${todayCount > 1 ? "s" : ""} faite${todayCount > 1 ? "s" : ""} aujourd'hui sur un objectif de ${settings.dailyGoal} · série de ${daysLabel(s, "fr")}`
          }
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title={t("À réviser maintenant", "للمراجعة الآن")} href="/erreurs/">
            {dueByChapter.length ? (
              dueByChapter.slice(0, 3).map(([slug, n]) => {
                const c = getChapter(slug);
                if (!c) return null;
                return (
                  <ListItem
                    key={slug}
                    href="/entrainement/session/?mode=notebook"
                    thumb={<ChapterCover compact module={c.module} img={coverOf(c)} />}
                    eyebrow={<span className="inline-flex items-center gap-1.5"><ModuleIcon id={c.module} size="xs" />{modName(slug)}</span>}
                    title={nameOf(c, lang)}
                    meta={t(`${errN(n)} à revoir`, `${errN(n)} للمراجعة`)}
                  />
                );
              })
            ) : (
              <div className="rounded-[16px] bg-white p-4 text-sm text-muted shadow-sm">
                {t("Aucune erreur à revoir. Les questions ratées reviendront ici au bon moment.", "لا توجد أخطاء للمراجعة. الأسئلة التي تخطئ فيها ستعود هنا في الوقت المناسب.")}
              </div>
            )}
          </Panel>
          <Panel title={t("Reprendre les cours", "تابع الدروس")} href="/cours/">
            {unread.slice(0, 3).map((c) => (
              <ListItem
                key={c.slug}
                href={`/cours/${c.slug}/`}
                thumb={<ChapterCover compact module={c.module} img={coverOf(c)} />}
                eyebrow={<span className="inline-flex items-center gap-1.5"><ModuleIcon id={c.module} size="xs" />{modName(c.slug)}</span>}
                title={nameOf(c, lang)}
                meta={t(`Fiche · Mindmap${c.nCards ? ` · ${c.nCards} panneaux` : ""}`, `ملخص · خريطة ذهنية${c.nCards ? ` · ${c.nCards} علامة` : ""}`)}
              />
            ))}
            {!unread.length && <div className="rounded-[16px] bg-white p-4 text-sm text-muted shadow-sm">{t("Toutes les fiches sont lues.", "قرأت جميع الملخصات.")}</div>}
          </Panel>
          <Panel title={t("Tes points faibles", "نقاط ضعفك")} href="/entrainement/session/?mode=weak">
            {weak.length ? (
              weak.map(([slug, v]) => {
                const c = getChapter(slug);
                if (!c) return null;
                const pct = Math.round(((v.seen - v.ko) / v.seen) * 100);
                return (
                  <ListItem
                    key={slug}
                    href={`/entrainement/session/?mode=chapter&c=${slug}`}
                    thumb={<ChapterCover compact module={c.module} img={coverOf(c)} />}
                    eyebrow={<span className="inline-flex items-center gap-1.5"><ModuleIcon id={c.module} size="xs" />{modName(slug)}</span>}
                    title={nameOf(c, lang)}
                    meta={t(`${pct} % de réussite · ${qN(v.seen)}`, `${pct} % أجوبة صحيحة · ${qN(v.seen)}`)}
                  />
                );
              })
            ) : (
              <div className="rounded-[16px] bg-white p-4 text-sm text-muted shadow-sm">
                {t("Fais quelques sessions : les chapitres où tu te trompes le plus apparaîtront ici.", "أنجز بعض الحصص: الدروس التي تخطئ فيها أكثر ستظهر هنا.")}
              </div>
            )}
          </Panel>
        </div>
      </section>

      {/* Axes (rangée de « partenaires ») */}
      <section>
        <h2 className="t-h4 mb-3">{t("Les 6 axes du programme Perminou", "المحاور الستة لبرنامج Perminou")}</h2>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {MODULES.map((m) => (
            <Chip key={m.id} href={`/cours/?axe=${m.id}`} icon={<ModuleIcon id={m.id} size="xs" />}>
              {nameOf(m, lang)}
            </Chip>
          ))}
        </div>
      </section>

      {/* Bandeau dégradé avec onglets */}
      <GradientBanner>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-center">
          <div className="space-y-3 lg:ps-2">
            <h2 className="text-xl font-semibold leading-snug">{t("Révise axe par axe, comme dans le programme officiel", "راجع محورا بمحور، كما في البرنامج الرسمي")}</h2>
            <p className="text-sm text-white/85">
              {t(
                "Chaque chapitre combine une fiche résumée, une carte mentale, les panneaux à connaître et un quiz corrigé.",
                "كل درس يجمع بين ملخص، وخريطة ذهنية، والعلامات التي يجب معرفتها، واختبار مصحح.",
              )}
            </p>
            <ButtonLink href={`/cours/?axe=${tab}`} variant="inverse" size="sm" iconEnd={<ArrowRight className="size-4" />}>
              {t("Voir l'axe", "عرض المحور")}
            </ButtonLink>
          </div>
          <div className="min-w-0 space-y-4">
            <PillTabs onDark items={MODULES.map((m) => ({ id: m.id, label: nameOf(m, lang) }))} value={tab} onChange={setTab} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {tabModule.chapters.slice(0, 4).map((c) => (
                <ProductCard
                  key={c.slug}
                  href={`/cours/${c.slug}/`}
                  square
                media={<ChapterCover module={c.module} img={coverOf(c)} />}
                  eyebrow={<><ModuleIcon id={c.module} size="xs" /> {t("Axe", "المحور")} {c.module}</>}
                  title={nameOf(c, lang)}
                  meta={read[c.slug] ? t("Lu · Fiche + mindmap", "مقروء · ملخص + خريطة ذهنية") : t("Fiche + mindmap", "ملخص + خريطة ذهنية")}
                />
              ))}
            </div>
          </div>
        </div>
      </GradientBanner>

      {/* Cartes d'action */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          href="/entrainement/session/?mode=mix"
          title={t("Lancer la session du jour", "ابدأ حصة اليوم")}
          desc={t("20 questions choisies pour toi", "20 سؤالا مختارة لك")}
          icon={<Target className="size-9" strokeWidth={1.5} />}
        />
        <ActionCard
          href={due ? "/entrainement/session/?mode=notebook" : "/erreurs/"}
          title={due ? t(`Réviser ${errN(due)}`, `راجع ${errN(due)}`) : t("Ouvrir le carnet d'erreurs", "افتح دفتر الأخطاء")}
          desc={t("Répétition espacée", "التكرار المتباعد")}
          icon={<BellRing className="size-9" strokeWidth={1.5} />}
        />
        <ActionCard
          href="/memo/"
          title={t("Apprendre les astuces", "تعلّم حيل الحفظ")}
          desc={t("Points, amendes, vitesses, distances", "النقط، الغرامات، السرعات، المسافات")}
          icon={<Lightbulb className="size-9" strokeWidth={1.5} />}
        />
      </section>

      {/* Catégories : schémas */}
      <section>
        <SectionHeader title={t("Comprendre avec les schémas interactifs", "افهم بواسطة الرسوم التفاعلية")} href="/schemas/" />
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCHEMAS).map(([id, sc]) => {
            const Icon = SCHEMA_ICONS[id] ?? Shapes;
            return (
              <Chip key={id} href={`/schemas/#${id}`} icon={<Icon className="size-4 text-brand" />}>
                {schemaTitle(sc, lang)}
              </Chip>
            );
          })}
        </div>
      </section>

      {/* Deux bandeaux : mémo + progression */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="relative flex min-h-[180px] flex-col justify-center gap-2 overflow-hidden rounded-[12px] bg-[#1f1f1f] p-6 text-white">
          <p className="text-sm font-semibold text-white/70">{t("Astuce mémo", "حيلة للحفظ")}</p>
          <p className="text-lg font-semibold leading-snug">
            {tip ? `${tip.q} ${tip.a}` : t("Retiens les chiffres difficiles grâce aux moyens mnémotechniques.", "احفظ الأرقام الصعبة بفضل حيل التذكر.")}
          </p>
          {tip && <p className="text-sm text-white/75">{tip.hook}</p>}
          <div className="mt-2">
            <ButtonLink href="/memo/" variant="inverse" size="sm" iconEnd={<ArrowRight className="size-4" />}>
              {t("Toutes les astuces", "جميع الحيل")}
            </ButtonLink>
          </div>
        </div>
        <div className="relative flex min-h-[180px] flex-col justify-center gap-3 overflow-hidden rounded-[12px] bg-brand p-6 text-white">
          <p className="text-sm font-semibold text-white/80">{t("Ta progression", "تقدمك")}</p>
          <p className="text-lg font-semibold">
            {lang === "ar"
              ? `${readCount} من ${CHAPTERS.length} ملخصا مقروءا · ${Object.keys(answers).length} من ${total || "…"} سؤالا تمت رؤيتها`
              : `${readCount} fiche${readCount > 1 ? "s" : ""} lue${readCount > 1 ? "s" : ""} sur ${CHAPTERS.length} · ${Object.keys(answers).length} questions vues sur ${total || "…"}`}
          </p>
          <div className="max-w-sm [&_[role=progressbar]]:bg-white/25 [&_[role=progressbar]>div]:bg-white">
            <ProgressBar value={readCount} max={CHAPTERS.length} label={t("Fiches lues", "الملخصات المقروءة")} />
          </div>
          <div>
            <ButtonLink href="/progression/" variant="inverse" size="sm" iconEnd={<ArrowRight className="size-4" />}>
              {t("Voir mes statistiques", "عرض إحصائياتي")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Que veux-tu faire ? */}
      <section className="flex flex-col items-center gap-4 rounded-[16px] border-2 border-line px-4 py-5 md:flex-row md:justify-center md:gap-6">
        <p className="text-[15px] font-semibold">{t("Que veux-tu faire aujourd'hui ?", "ماذا تريد أن تفعل اليوم ؟")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {(
            [
              ["/cours/", t("Apprendre un chapitre", "تعلّم درسا"), BookOpen],
              ["/entrainement/", t("M'entraîner", "أتمرن"), Target],
              ["/examen/", t("Passer l'examen blanc", "اجتياز الامتحان التجريبي"), ClipboardCheck],
              ["/erreurs/", t("Revoir mes erreurs", "مراجعة أخطائي"), NotebookPen],
            ] as [string, string, typeof BookOpen][]
          ).map(([h, l, Icon]) => (
            <Chip key={h} href={h} icon={<span className="grid size-6 place-items-center rounded-[12px] bg-brand text-white"><Icon className="size-3.5" /></span>}>
              {l}
            </Chip>
          ))}
        </div>
      </section>

      {/* Chiffre clé */}
      <StatBanner
        title={
          successRate !== null
            ? t("Ton taux de bonnes réponses au dernier essai", "نسبة أجوبتك الصحيحة في آخر محاولة")
            : t("Le seuil de réussite à l'examen", "عتبة النجاح في الامتحان")
        }
        desc={
          successRate !== null
            ? t(
                `Calculé sur ${vals.length} questions travaillées. Vise au moins 80 % de façon régulière avant le jour J.`,
                `محسوبة على ${qN(vals.length)} اشتغلت عليها. استهدف 80 % على الأقل بانتظام قبل يوم الامتحان.`,
              )
            : t(
                "32 bonnes réponses sur 40, soit 80 %. Entraîne-toi jusqu'à dépasser ce score de façon régulière.",
                "32 جوابا صحيحا من أصل 40، أي 80 %. تمرّن حتى تتجاوز هذه النتيجة بانتظام.",
              )
        }
        value={successRate !== null ? `${successRate} %` : "80 %"}
        action={
          <ButtonLink href="/entrainement/" variant="inverse" size="sm">
            {t("S'entraîner", "تمرّن")}
          </ButtonLink>
        }
      />

      {/* Chapitres populaires */}
      <section>
        <SectionHeader title={t("Les chapitres les plus utiles pour l'examen", "الدروس الأكثر فائدة للامتحان")} href="/cours/" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {["07_regles_priorite", "03_vitesse", "12_distances", "01_permis_a_points"].map((slug) => {
            const c = getChapter(slug);
            if (!c) return null;
            return (
              <ProductCard
                key={slug}
                href={`/cours/${slug}/`}
                square
                media={<ChapterCover module={c.module} img={coverOf(c)} />}
                eyebrow={<><ModuleIcon id={c.module} size="xs" /> {modName(slug)}</>}
                title={nameOf(c, lang)}
                meta={<Badge tone="brand">{t("Prioritaire", "ذو أولوية")}</Badge>}
              />
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="t-h3 mb-4">{t("Questions fréquentes", "أسئلة شائعة")}</h2>
        <Accordion key={lang} items={lang === "ar" ? FAQ_AR : FAQ_FR} />
      </section>
    </div>
  );
}
