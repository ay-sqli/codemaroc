"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { markRead, useStore } from "@/lib/store";
import { useBank } from "@/lib/questions";
import { Button, ButtonLink } from "./ui";
import { countLabel, useLang } from "@/lib/i18n";

/** Boutons d'action de l'en-tête d'un chapitre. */
export function ChapterActions({ slug }: { slug: string }) {
  const { t } = useLang();
  const read = useStore((s) => s.read[slug]);
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <ButtonLink href={`/entrainement/session/?mode=chapter&c=${slug}`} size="lg">
        {t("Commencer le quiz", "ابدأ الاختبار")}
      </ButtonLink>
      <Button variant="secondary" size="lg" onClick={() => markRead(slug)} icon={read ? <Check className="size-4" /> : undefined}>
        {read ? t("Fiche lue", "تمت القراءة") : t("Marquer comme lu", "وضع علامة مقروء")}
      </Button>
    </div>
  );
}

/** Score de l'utilisateur sur les questions du chapitre. */
export function ChapterScore({ slug }: { slug: string }) {
  const { lang, t } = useLang();
  const answers = useStore((s) => s.answers);
  const { bank } = useBank();
  const qN = (n: number) => countLabel(lang, n, ["question"], ["سؤال", "سؤالان", "أسئلة", "سؤالا"]);
  const s = useMemo(() => {
    let total = 0;
    let seen = 0;
    let ok = 0;
    bank?.all.forEach((q, id) => {
      if (q.chapter !== slug) return;
      total++;
      const a = answers[id];
      if (a) {
        seen++;
        if (a.lastOk) ok++;
      }
    });
    return { total, seen, ok };
  }, [answers, bank, slug]);
  return (
    <>
      <p className="text-base font-semibold">
        {s.seen ? t(`${Math.round((s.ok / s.seen) * 100)} % de réussite`, `${Math.round((s.ok / s.seen) * 100)} % أجوبة صحيحة`) : s.total ? qN(s.total) : "—"}
      </p>
      <p className="text-sm text-muted">
        {s.seen ? t(`${s.seen} questions faites sur ${s.total}`, `${s.seen} من ${s.total} سؤالا تمت الإجابة عنها`) : t("Pas encore commencé", "لم تبدأ بعد")}
      </p>
    </>
  );
}
