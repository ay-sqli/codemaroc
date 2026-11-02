import type { CSSProperties, ReactNode } from "react";
import { asset } from "@/lib/base";
import { cx } from "@/components/ui";

/**
 * Mascotte Code Maroc : le petit taxi rouge au tarbouche, en 36 poses (public/mascot/<pose>.webp).
 * `size` = hauteur affichée en pixels.
 */
export const POSES = [
  "wave", "yield", "study", "trophy", "worried", "police", "sleep", "happy", "fast", "permis", "thinking", "excellent",
  "cheer", "stats", "teacher", "confused", "directions", "thumbs", "tired", "medal", "forbidden", "travel", "angry", "notes",
  "phone", "reading", "joy", "scared", "mechanic", "hero", "search", "welcome", "wrong", "timer", "vacation", "clap",
] as const;
export type Pose = (typeof POSES)[number];

/** Poses tirées au hasard pour féliciter ou consoler. */
export const PRAISE_POSES: Pose[] = ["excellent", "thumbs", "clap", "joy", "cheer"];
export const OOPS_POSES: Pose[] = ["confused", "worried", "thinking", "wrong"];

export function Mascot({ pose = "happy", size = 96, className, style }: { pose?: Pose; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={asset(`/mascot/${pose}.webp`)}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ height: size, width: "auto", ...style }}
      className={cx("select-none", className)}
    />
  );
}

/** Mascotte + bulle de dialogue. */
export function MascotSays({ children, pose, size = 110 }: { children: ReactNode; pose?: Pose; size?: number }) {
  return (
    <div className="flex items-end gap-2">
      <Mascot pose={pose} size={size} className="duo-mascot-in shrink-0" />
      <div className="duo-card relative mb-5 !rounded-[18px] px-4 py-3 text-[15px] font-[600] text-[var(--duo-ink)]">
        <span className="absolute -start-[9px] bottom-4 size-4 rotate-45 border-b-2 border-s-2 border-[var(--duo-grey)] bg-white rtl:-rotate-45" />
        {children}
      </div>
    </div>
  );
}
