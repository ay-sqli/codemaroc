"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * Visionneuse plein écran : un clic sur n'importe quelle <img data-zoom> l'agrandit.
 * Fermeture par le bouton X, un clic sur le fond ou la touche Échap.
 */
export function ImageZoom() {
  const { t } = useLang();
  const [img, setImg] = useState<{ src: string; caption: string } | null>(null);

  useEffect(() => {
    const open = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("img[data-zoom]") as HTMLImageElement | null;
      if (!el) return;
      e.preventDefault();
      setImg({ src: el.currentSrc || el.src, caption: el.dataset.caption ?? el.alt });
    };
    document.addEventListener("click", open);
    return () => document.removeEventListener("click", open);
  }, []);

  useEffect(() => {
    if (!img) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setImg(null);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [img]);

  if (!img) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Image agrandie", "صورة مكبرة")}
      className="animate-pop fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-[#1f1f1f]/90 p-4 pt-16"
      onClick={() => setImg(null)}
    >
      <button
        autoFocus
        onClick={() => setImg(null)}
        aria-label={t("Fermer l'image", "إغلاق الصورة")}
        className="absolute end-4 top-4 grid size-11 place-items-center rounded-full bg-white text-ink shadow-lg hover:bg-panel"
      >
        <X className="size-6" />
      </button>
      {/* Largeur fixe + object-contain : les petits panneaux sont agrandis, les grandes photos restent dans l'écran. */}
      <img
        src={img.src}
        alt={img.caption}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[75dvh] w-[min(92vw,720px)] rounded-[8px] bg-white object-contain p-3"
      />
      {img.caption && (
        <p className="ar max-w-[720px] text-center text-base leading-relaxed text-white" onClick={(e) => e.stopPropagation()}>
          {img.caption}
        </p>
      )}
    </div>
  );
}
