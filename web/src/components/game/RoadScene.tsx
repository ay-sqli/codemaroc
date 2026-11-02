"use client";

import { asset } from "@/lib/base";
import { cx } from "@/components/ui";

/**
 * Bandeau animé « vu du ciel » en tête du cours express : une tuile de route liée au chapitre,
 * traversée en boucle par un véhicule (et parfois un second en sens inverse).
 */
const UNIT_TILE: Record<string, string> = {
  "01_signalisation_verticale": "carrefour-zebre",
  "02_dangers_priorites": "passage-niveau",
  "03_interdictions": "route-2-voies",
  "04_obligations": "carrefour-fleches",
  "05_indications": "voie-bus",
  "06_directions": "bifurcation",
  "07_localisations": "route-4-voies",
  "08_panonceaux": "parking",
  "09_feux_et_agents": "carrefour-pietons",
  "10_signalisation_horizontale": "zebras-chevrons",
  "11_signaux_lumineux": "carrefour",
  "12_signalisation_temporaire": "gravillons",
  "13_types_de_routes": "route-4-voies",
  "14_conditions_eclairage": "route-2-voies",
  "15_conditions_climatiques": "flaques",
  "16_virages_et_pentes": "eboulement",
  "01_montee_descente": "parking",
  "02_demarrage": "parking",
  "03_vitesse": "route-4-voies",
  "04_position_sur_route": "route-2-voies",
  "05_croisement_depassement": "ligne-continue-jaune",
  "06_arret_stationnement": "parking",
  "07_regles_priorite": "carrefour",
  "08_changement_direction": "carrefour-fleches",
  "09_parties_speciales": "giratoire",
  "10_virages": "eboulement",
  "11_autoroute": "route-4-voies",
  "12_distances": "route-2-voies",
  "13_autres_usagers": "carrefour-pietons",
  "14_dangers_exceptionnels": "neige",
  "15_panne_accident": "bordure-jaune-blanche",
  "01_categories_permis": "voie-bus",
  "02_alcool_medicaments": "route-2-voies",
  "03_vigilance": "marquage-croise",
  "04_perception_reaction": "carrefour-zebre",
  "01_regles_administratives": "parking",
  "02_elements_mecaniques": "terre",
  "03_aides_conduite": "route-4-voies",
  "04_precautions_portieres": "parking",
  "05_vehicules_prioritaires": "carrefour",
  "06_environnement": "avenue-terre-plein",
  "03_perte_controle": "eboulement",
  "04_equipements_securite": "route-4-voies",
};
const SECTION_TILE: Record<string, string> = { "01": "carrefour", "02": "route-2-voies", "03": "route-2-voies", "04": "parking", "05": "carrefour-zebre", "06": "route-4-voies" };
const UNIT_VEHICLES: Record<string, [string, string?]> = {
  "05_vehicules_prioritaires": ["ambulance", "police"],
  "13_autres_usagers": ["charrette", "velo"],
  "11_autoroute": ["autoecole", "camion"],
  "01_categories_permis": ["bus", "moto"],
  "02_elements_mecaniques": ["4x4", "tracteur"],
  "02_dangers_priorites": ["autoecole", "tracteur"],
  "14_dangers_exceptionnels": ["4x4"],
  "15_panne_accident": ["depanneuse", "autoecole"],
  "09_parties_speciales": ["petit-taxi", "grand-taxi"],
};
/** Tuiles où la route est horizontale : la voiture roule de gauche à droite. */
const HORIZONTAL = new Set(["route-2-voies", "route-4-voies", "avenue-terre-plein"]);

export function RoadScene({ unit, section }: { unit: string; section: string }) {
  const tile = UNIT_TILE[unit] ?? SECTION_TILE[section] ?? "carrefour";
  const [a, b] = UNIT_VEHICLES[unit] ?? ["autoecole", "petit-taxi"];
  const h = HORIZONTAL.has(tile);
  return (
    <div className="relative mt-5 h-[150px] overflow-hidden rounded-[24px] border-2 border-[var(--duo-grey)] bg-[#eadfc6]" aria-hidden="true">
      <img src={asset(`/tiles/${tile}.webp`)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <img
        src={asset(`/vehicles/${a}.webp`)}
        alt=""
        className={cx("absolute w-auto", h ? "scene-drive-h h-[64px]" : "scene-drive-v h-[70px]")}
        style={h ? { top: "54%" } : { left: "calc(50% + 10px)" }}
      />
      {b && (
        <img
          src={asset(`/vehicles/${b}.webp`)}
          alt=""
          className={cx("absolute w-auto", h ? "scene-drive-h-back h-[64px]" : "scene-drive-v-back h-[70px]")}
          style={h ? { top: "14%" } : { left: "calc(50% - 46px)" }}
        />
      )}
    </div>
  );
}
