"use client";

import type { ComponentType } from "react";
import {
  Ambulance, Ban, Car, CircleParking, CloudRain, Flame, Gauge, Hash, Lightbulb, Ruler, ShieldAlert, Shapes, Siren, Split, Triangle, Waves, Wine, type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { SCHEMA_META, schemaDesc, schemaForChapter, schemaTitle, type SchemaMeta } from "@/lib/schemaMeta";
import { useLang } from "@/lib/i18n";
import Distance from "./Distance";
import Priorite from "./Priorite";
import Giratoire from "./Giratoire";
import Vitesses from "./Vitesses";
import Sanctions from "./Sanctions";
import Feux from "./Feux";
import Marquage from "./Marquage";
import { Alcool, Depassement, Energie, Formes, Hierarchie, Pas, Points, Stationnement } from "./Divers";
import EtatRoute from "./EtatRoute";
import Usagers from "./Usagers";

export interface SchemaDef extends SchemaMeta {
  C: ComponentType;
}

const COMPONENTS: Record<string, ComponentType> = {
  priorite: Priorite,
  giratoire: Giratoire,
  distance: Distance,
  vitesses: Vitesses,
  sanctions: Sanctions,
  points: Points,
  feux: Feux,
  marquage: Marquage,
  formes: Formes,
  hierarchie: Hierarchie,
  depassement: Depassement,
  stationnement: Stationnement,
  alcool: Alcool,
  energie: Energie,
  pas: Pas,
  etat: EtatRoute,
  usagers: Usagers,
};

/** Registre des schémas interactifs (id utilisé dans les corrigés : champ `s`). */
export const SCHEMAS: Record<string, SchemaDef> = Object.fromEntries(
  Object.entries(SCHEMA_META).map(([id, m]) => [id, { ...m, C: COMPONENTS[id] }]),
);

export { schemaForChapter };

/** Icônes du design system (remplacent les emojis des schémas). */
export const SCHEMA_ICONS: Record<string, LucideIcon> = {
  priorite: Triangle,
  giratoire: Split,
  distance: Ruler,
  vitesses: Gauge,
  sanctions: Ban,
  points: Hash,
  feux: Lightbulb,
  marquage: Waves,
  formes: Shapes,
  hierarchie: ShieldAlert,
  depassement: Car,
  stationnement: CircleParking,
  alcool: Wine,
  energie: Flame,
  pas: Siren,
  etat: CloudRain,
  usagers: Ambulance,
};

export function SchemaModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { lang, t } = useLang();
  const s = SCHEMAS[id];
  if (!s) return null;
  return (
    <Modal open onClose={onClose} overline={t("Schéma interactif", "رسم تفاعلي")} title={schemaTitle(s, lang)} desc={schemaDesc(s, lang)} size="md">
      <s.C />
    </Modal>
  );
}
