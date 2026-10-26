import { Car, Scale, ShieldCheck, Signpost, TrafficCone, UserRound, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** Icône et teinte de chaque axe de formation (remplace les emojis). */
export const MODULE_ICONS: Record<string, { Icon: LucideIcon; tint: string; ink: string; label: string }> = {
  "01": { Icon: Signpost, tint: "bg-[#e3eefe]", ink: "text-[#0056d2]", label: "La route" },
  "02": { Icon: TrafficCone, tint: "bg-[#e5f4f1]", ink: "text-[#0b7a6b]", label: "Règles de circulation" },
  "03": { Icon: UserRound, tint: "bg-[#efeafd]", ink: "text-[#5c3de8]", label: "Le conducteur" },
  "04": { Icon: Car, tint: "bg-[#fff1df]", ink: "text-[#a35200]", label: "Le véhicule" },
  "05": { Icon: Scale, tint: "bg-[#fdecec]", ink: "text-[#b00020]", label: "Infractions et sanctions" },
  "06": { Icon: ShieldCheck, tint: "bg-[#e6f4ea]", ink: "text-[#137333]", label: "Sécurité routière" },
};

/** Logo carré d'un axe (équivalent du logo de l'établissement sur une carte). */
export function ModuleIcon({ id, size = "sm", className }: { id: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const m = MODULE_ICONS[id] ?? MODULE_ICONS["01"];
  const box = { xs: "size-5", sm: "size-6", md: "size-10", lg: "size-14" }[size];
  const ico = { xs: "size-3", sm: "size-3.5", md: "size-5", lg: "size-7" }[size];
  return (
    <span className={cx("inline-grid shrink-0 place-items-center rounded-[4px]", m.tint, m.ink, box, className)} aria-hidden>
      <m.Icon className={ico} strokeWidth={2} />
    </span>
  );
}

/** Visuel de couverture d'un chapitre : teinte de l'axe + illustration du cours. */
export function ChapterCover({ module, img, className }: { module: string; img?: string; className?: string }) {
  const m = MODULE_ICONS[module] ?? MODULE_ICONS["01"];
  return (
    <div className={cx("relative grid size-full place-items-center", m.tint, className)}>
      {img ? (
        <img src={img} alt="" loading="lazy" className="absolute inset-0 m-auto h-[68%] w-[78%] object-contain mix-blend-multiply" />
      ) : (
        <m.Icon className={cx("size-1/3", m.ink)} strokeWidth={1.5} />
      )}
    </div>
  );
}
