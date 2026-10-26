"use client";

import { useBank } from "@/lib/questions";
import { Skeleton } from "./ui";
import { useLang } from "@/lib/i18n";

export function BankCounts() {
  const { t } = useLang();
  const { bank } = useBank();
  if (!bank) return <Skeleton className="h-6 w-96" />;
  const items = [
    [bank.official.length, t("questions officielles", "سؤالا رسميا")],
    [bank.rules.length, t("questions de règles", "سؤالا في القواعد")],
    [bank.signs.length, t("questions de panneaux", "سؤالا في العلامات")],
  ] as const;
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
      {items.map(([n, l]) => (
        <span key={l}>
          <b className="font-semibold text-ink">{n}</b> {l}
        </span>
      ))}
      <span>
        · <b className="font-semibold text-ink">{bank.official.length + bank.rules.length + bank.signs.length}</b> {t("au total", "في المجموع")}
      </span>
    </p>
  );
}
