import { asset } from "@/lib/base";
import { cx } from "@/components/ui";

/** Icônes illustrées du jeu (public/icons) : permis, flamme, XP, couronne, coffres, badges. */
export type IconName =
  | "permis" | "flame" | "xp" | "crown" | "chest" | "chest-open" | "speed90"
  | "walker-bronze" | "walker-gold" | "first-step" | "learner" | "wheel" | "mountain" | "champion";

export function GameIcon({ name, size = 28, className, dim }: { name: IconName; size?: number; className?: string; dim?: boolean }) {
  return (
    <img
      src={asset(`/icons/${name}.webp`)}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      className={cx("shrink-0 select-none", dim && "opacity-35 grayscale", className)}
    />
  );
}
