"use client";

import { Callout, Segmented } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/base";

/** Petits composants partagés par les schémas interactifs. */

export function Slider({
  label, value, min, max, step = 1, unit, onChange,
}: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="block rounded-[16px] border-2 border-line bg-white p-4">
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
        className="mt-3 w-full accent-[#d92b2b]"
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
    <div className="rounded-[16px] border-2 border-line bg-white p-3">
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

/** Véhicules vus de dessus (public/vehicles), tous dessinés « face vers le haut ». */
export type Vehicle =
  | "autoecole" | "petit-taxi" | "grand-taxi" | "police" | "voiture-bleue" | "voiture-verte" | "4x4" | "camion" | "camionnette"
  | "benne" | "bus" | "autocar" | "pompiers" | "ambulance" | "pickup" | "depanneuse" | "tracteur" | "moto-police" | "scooter"
  | "moto" | "velo" | "triporteur" | "charrette" | "moto-chargee" | "fourgon-charge" | "pickup-charge" | "camion-moutons"
  | "citerne" | "porte-voitures" | "gendarmerie" | "benne-ordures" | "fourgon-jaune" | "bulldozer" | "rouleau" | "quad"
  | "side-car" | "velo-cargo";

/** Anciennes couleurs des schémas → véhicule illustré. */
const COLOR_VEHICLE: Record<string, Vehicle> = {
  "#ff7a00": "autoecole",
  "#2563eb": "voiture-bleue",
  "#7c3aed": "petit-taxi",
  "#059669": "voiture-verte",
  "#f8fafc": "ambulance",
};

export const vehicleSrc = (v: Vehicle) => asset(`/vehicles/${v}.webp`);

/**
 * Véhicule vu de dessus dans un schéma SVG. `to` déplace le véhicule avec une animation
 * (après `delay` secondes) ; `beacon` fait clignoter un gyrophare.
 */
export function Car({
  x, y, rot = 0, color = "#2563eb", label, vehicle, size = 26, to, delay = 0, duration = 1.4, beacon,
}: {
  x: number;
  y: number;
  rot?: number;
  color?: string;
  label?: string;
  vehicle?: Vehicle;
  size?: number;
  to?: { x: number; y: number; rot?: number } | null;
  delay?: number;
  duration?: number;
  beacon?: boolean;
}) {
  const v = vehicle ?? COLOR_VEHICLE[color] ?? "voiture-bleue";
  const p = to ?? { x, y, rot };
  return (
    <>
      <g
        style={{
          transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot ?? rot}deg)`,
          transition: to ? `transform ${duration}s cubic-bezier(0.45, 0, 0.55, 1) ${delay}s` : "transform 0.4s ease",
        }}
      >
        <ellipse cx={0} cy={2} rx={size * 0.5} ry={size * 0.95} fill="#000" opacity={0.18} />
        <image href={vehicleSrc(v)} x={-size / 2} y={-size} width={size} height={size * 2} preserveAspectRatio="xMidYMid meet" />
        {beacon && (
          <g>
            <circle cx={-size * 0.18} cy={-size * 0.1} r={size * 0.16} className="schema-beacon-red" />
            <circle cx={size * 0.18} cy={-size * 0.1} r={size * 0.16} className="schema-beacon-blue" />
          </g>
        )}
      </g>
      {label && !to && (
        <g transform={`translate(${x} ${y + size + 10})`} style={{ pointerEvents: "none" }}>
          <rect x={-18} y={-9} width={36} height={17} rx={8.5} fill="#d92b2b" stroke="#fff" strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff">
            {label}
          </text>
        </g>
      )}
    </>
  );
}
