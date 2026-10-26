"use client";

import { Callout, Segmented } from "@/components/ui";
import { useLang } from "@/lib/i18n";

/** Petits composants partagés par les schémas interactifs. */

export function Slider({
  label, value, min, max, step = 1, unit, onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-[8px] border border-line bg-white p-4">
      <span className="flex items-baseline justify-between text-sm font-semibold text-ink-2">
        {label}
        <span className="text-2xl font-semibold text-ink">
          {value}
          {unit && <span className="ms-1 text-sm font-normal text-muted">{unit}</span>}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[#0056d2]"
      />
    </label>
  );
}

export function Toggle<T extends string>({
  options, value, onChange,
}: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <Segmented options={options} value={value} onChange={onChange} />;
}

export function Stat({ label, value, tone = "brand", sub }: { label: string; value: string; tone?: "brand" | "accent" | "ok" | "ko"; sub?: string }) {
  const c = { brand: "text-ink", accent: "text-warn", ok: "text-ok", ko: "text-ko" }[tone];
  return (
    <div className="rounded-[8px] border border-line bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold leading-tight ${c}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <Callout tone="tip" title={t("Astuce du moniteur", "نصيحة المدرب")}>
      {children}
    </Callout>
  );
}

/** Petite voiture vue de dessus (SVG) */
export function Car({ x, y, rot = 0, color = "#2563eb", label }: { x: number; y: number; rot?: number; color?: string; label?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-11} y={-19} width={22} height={38} rx={6} fill={color} stroke="#0f172a" strokeOpacity={0.25} />
      <rect x={-8} y={-11} width={16} height={9} rx={2} fill="#dbeafe" opacity={0.85} />
      <rect x={-8} y={6} width={16} height={6} rx={2} fill="#dbeafe" opacity={0.6} />
      {label && (
        <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={900} fill="#fff" transform={`rotate(${-rot})`}>
          {label}
        </text>
      )}
    </g>
  );
}
