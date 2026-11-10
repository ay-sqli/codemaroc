import { Car, Scale, ShieldCheck, Signpost, TrafficCone, UserRound, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** Icône et teintes de chaque axe de formation (remplace les emojis). */
export const MODULE_ICONS: Record<string, { Icon: LucideIcon; tint: string; ink: string; label: string; from: string; to: string }> = {
  "01": { Icon: Signpost, tint: "bg-[#e3f0fa]", ink: "text-[#1f618d]", label: "La route", from: "#123a5a", to: "#2980b9" },
  "02": { Icon: TrafficCone, tint: "bg-[#fdeedd]", ink: "text-[#ba5a0c]", label: "Règles de circulation", from: "#7a3b08", to: "#e08e2b" },
  "03": { Icon: UserRound, tint: "bg-[#efe8fb]", ink: "text-[#6741b3]", label: "Le conducteur", from: "#33206b", to: "#7d5ac9" },
  "04": { Icon: Car, tint: "bg-[#dcf5ef]", ink: "text-[#0e7c66]", label: "Le véhicule", from: "#0b4a3f", to: "#17a589" },
  "05": { Icon: Scale, tint: "bg-[#fdecea]", ink: "text-[#c0392b]", label: "Infractions et sanctions", from: "#6e1a14", to: "#d92b2b" },
  "06": { Icon: ShieldCheck, tint: "bg-[#e8ecf1]", ink: "text-[#34495e]", label: "Sécurité routière", from: "#1c2833", to: "#566b80" },
};

/** Logo carré d'un axe (équivalent du logo de l'établissement sur une carte). */
export function ModuleIcon({ id, size = "sm", className }: { id: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const m = MODULE_ICONS[id] ?? MODULE_ICONS["01"];
  const box = { xs: "size-5", sm: "size-6", md: "size-10", lg: "size-14" }[size];
  const ico = { xs: "size-3", sm: "size-3.5", md: "size-5", lg: "size-7" }[size];
  return (
    <span className={cx("inline-grid shrink-0 place-items-center rounded-[12px]", m.tint, m.ink, box, className)} aria-hidden>
      <m.Icon className={ico} strokeWidth={2.4} />
    </span>
  );
}

/**
 * Visuel de couverture d'un chapitre : la couleur de l'axe forme un cadre autour d'un grand
 * panneau blanc. Le fond blanc absorbe le détourage des images, l'image remplit tout le cadre
 * (object-cover) et garde ses vraies couleurs.
 * `compact` : cadre plus fin pour les petites vignettes.
 */
export function ChapterCover({ module, img, className, compact = false }: { module: string; img?: string; className?: string; compact?: boolean }) {
  const m = MODULE_ICONS[module] ?? MODULE_ICONS["01"];
  return (
    <div
      className={cx("cover relative size-full overflow-hidden", className)}
      style={{ "--cover-from": m.from, "--cover-to": m.to } as React.CSSProperties}
    >
      <span className={cx("absolute grid place-items-center overflow-hidden bg-white", compact ? "inset-1 rounded-[9px]" : "inset-2.5 rounded-[12px]")}>
        {img ? (
          // Position absolue : la taille naturelle de l'image ne peut pas agrandir le cadre.
          <img src={img} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <m.Icon className={cx("size-1/2", m.ink)} strokeWidth={1.75} />
        )}
      </span>
    </div>
  );
}
