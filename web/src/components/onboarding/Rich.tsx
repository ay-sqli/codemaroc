import { Fragment } from "react";
import { Globe } from "lucide-react";
import { GameIcon, type IconName } from "@/components/game/GameIcon";

/** Texte du guide : **gras** et {icone} (petite image au milieu de la phrase). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\{[\w-]+\})/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i} className="font-[800] text-[var(--duo-ink)]">{p.slice(2, -2)}</strong>;
        if (p.startsWith("{")) {
          const name = p.slice(1, -1);
          if (name === "globe") return <Globe key={i} className="inline size-[1.15em] align-[-0.2em] text-[var(--duo-muted)]" aria-hidden="true" />;
          return <GameIcon key={i} name={name as IconName} size={22} className="inline align-[-0.3em]" />;
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
