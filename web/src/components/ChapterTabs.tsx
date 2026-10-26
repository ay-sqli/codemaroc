"use client";

import { useState } from "react";
import { BookText, GitBranch, Images, Target } from "lucide-react";
import { MindMap } from "./MindMap";
import { SignGallery } from "./SignGallery";
import { ButtonLink, Callout, Tabs } from "./ui";
import { useLang } from "@/lib/i18n";

type Tab = "fiche" | "mindmap" | "panneaux" | "quiz";

export function ChapterTabs({
  md, title, titleAr, slug, hasCards, children,
}: { md: string; title: string; titleAr: string; slug: string; hasCards: boolean; children: React.ReactNode }) {
  const { lang, t } = useLang();
  const [tab, setTab] = useState<Tab>("fiche");
  const items = [
    { id: "fiche" as const, label: t("Fiche résumée", "الملخص"), icon: <BookText className="size-4" /> },
    { id: "mindmap" as const, label: t("Mindmap", "الخريطة الذهنية"), icon: <GitBranch className="size-4" /> },
    ...(hasCards ? [{ id: "panneaux" as const, label: t("Panneaux", "العلامات"), icon: <Images className="size-4" /> }] : []),
    { id: "quiz" as const, label: t("Quiz", "الاختبار"), icon: <Target className="size-4" /> },
  ];
  const name = lang === "ar" ? titleAr : title;
  return (
    <div className="space-y-6">
      <div className="sticky top-[68px] z-20 -mx-1 bg-white px-1 pt-1">
        <Tabs items={items} value={tab} onChange={setTab} />
      </div>
      <div className={tab === "fiche" ? "" : "hidden"}>{children}</div>
      {tab === "mindmap" && <MindMap md={md} title={name} />}
      {tab === "panneaux" && <SignGallery chapter={slug} />}
      {tab === "quiz" && (
        <div className="space-y-4">
          <h2 className="t-h3">{t("Teste tes connaissances", "اختبر معلوماتك")}</h2>
          <p className="text-[15px] text-ink-2">
            {t(
              `Le quiz mélange des questions de reconnaissance des panneaux, des questions de règles et les questions officielles liées à « ${name} ». Chaque réponse est corrigée immédiatement, et tes erreurs sont ajoutées au carnet.`,
              `يمزج الاختبار بين أسئلة التعرف على العلامات، وأسئلة القواعد، والأسئلة الرسمية المرتبطة بدرس « ${name} ». يُصحَّح كل جواب فورا، وتُضاف أخطاؤك إلى الدفتر.`,
            )}
          </p>
          <Callout tone="info" title={t("Comment ça marche", "طريقة الاستعمال")}>
            {t(
              "Choisis ta réponse, valide avec le bouton ou la touche Entrée. Les touches 1 à 4 permettent de répondre au clavier.",
              "اختر جوابك، ثم أكّد بالزر أو بمفتاح Entrée. تسمح المفاتيح من 1 إلى 4 بالإجابة عبر لوحة المفاتيح.",
            )}
          </Callout>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/entrainement/session/?mode=chapter&c=${slug}`} size="lg">
              {t("Commencer (20 questions)", "ابدأ (20 سؤالا)")}
            </ButtonLink>
            <ButtonLink href={`/entrainement/session/?mode=chapter&c=${slug}&n=999`} variant="secondary" size="lg">
              {t("Toutes les questions", "جميع الأسئلة")}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
