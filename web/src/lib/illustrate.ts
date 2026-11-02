import { asset } from "./base";

/**
 * Lisibilité des fiches : mise en valeur des chiffres et des flèches, et illustration d'une section
 * par un visuel de l'app (tuile, véhicule, voyant, mascotte) choisi d'après ses mots-clés.
 */

/** Chiffres avec leur unité éventuelle (km/h, m, %, points, DH…). */
const NUM =
  /(\d+(?:[.,]\d+)?(?:\s?(?:%|كلم\/س|كلم\/الساعة|كلم|km\/h|km|متر|أمتار|سنتيمتر|ثانية|ثوان|ثوانٍ|دقيقة|دقائق|ساعة|ساعات|سنة|سنوات|يوما|أيام|درهم|دراهم|DH|نقطة|نقط|طن|غرام|g\/l|ملغ|°|jours?|ans|mois|heures?|secondes?|minutes?|mètres?|points?|pts|dirhams?|tonnes?|(?:m|s|h|t|g)(?=[\s.,;:)\]]|$)|م(?=[\s.,،؛:)\]]|$)|ث(?=[\s.,،؛:)\]]|$)))?)/g;

/** Met en évidence chiffres et flèches dans le HTML d'une ligne de fiche (sans toucher aux balises). */
export function enrich(html: string) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) =>
      part.startsWith("<")
        ? part
        : part
            .replace(NUM, '<b class="fiche-num">$1</b>')
            .replace(/\s*(←|→|⬅|➡|⟵|⟶)\s*/g, ' <span class="fiche-arrow" aria-hidden="true">$1</span> ')
            .replace(/\s=\s/g, ' <span class="fiche-eq">=</span> '),
    )
    .join("");
}

interface Pic {
  src: string;
  kind: "tile" | "vehicle" | "mascot" | "icon" | "voyant";
}

/** Mots-clés (arabe ou français) → visuel. L'ordre compte : la première correspondance gagne. */
const RULES: [RegExp, string, Pic["kind"]][] = [
  [/نفق|tunnel/i, "tiles/tunnel", "tile"],
  [/سكة|قطار|ترامواي|passage à niveau|tram/i, "tiles/passage-niveau", "tile"],
  [/مدار|دوراني|giratoire|rond-point/i, "tiles/rond-point-palmier", "tile"],
  [/الطريق السيار|autoroute/i, "tiles/peage-barrieres", "tile"],
  [/ثلج|جليد|neige|verglas/i, "tiles/neige", "tile"],
  [/مطر|مائي|pluie|aquaplaning/i, "tiles/flaques", "tile"],
  [/ورش|أشغال|travaux|temporaire/i, "tiles/travaux-carrefour", "tile"],
  [/منعرج|virage|منحدر|pente/i, "tiles/epingle", "tile"],
  [/راجل|راجلين|piéton/i, "tiles/passage-pietons", "tile"],
  [/دراج|cycl|vélo/i, "vehicles/velo", "vehicle"],
  [/إسعاف|أولوية|prioritaire|ambulance/i, "vehicles/ambulance", "vehicle"],
  [/جرار|tracteur|بطيئة|lent/i, "vehicles/tracteur", "vehicle"],
  [/دواب|مجرورة|حيوان|animal|animaux/i, "vehicles/charrette", "vehicle"],
  [/شاحنة|camion|poids lourd/i, "vehicles/camion", "vehicle"],
  [/حافلة|bus|autocar|النقل الجماعي/i, "vehicles/bus", "vehicle"],
  [/أجرة|taxi/i, "vehicles/petit-taxi", "vehicle"],
  [/شرطة|درك|عون|agent|police|gendarmerie/i, "vehicles/police", "vehicle"],
  [/عطب|حادث|panne|accident|dépann/i, "vehicles/depanneuse", "vehicle"],
  [/وقوف|توقف|stationnement|arrêt/i, "tiles/parking-taxis", "tile"],
  [/تجاوز|dépassement|تقابل|croisement/i, "tiles/ligne-continue-jaune", "tile"],
  [/ملتقى|تقاطع|intersection|carrefour|أسبقية|priorité/i, "tiles/carrefour", "tile"],
  [/أضواء|ضوء|إنارة|éclairage|feux|phares/i, "voyants/feux-croisement", "voyant"],
  [/فرامل|frein/i, "voyants/frein", "voyant"],
  [/زيت|محرك|moteur|huile|mécani/i, "voyants/moteur", "voyant"],
  [/حزام|ceinture/i, "voyants/ceinture", "voyant"],
  [/نقط|رخصة|permis|points/i, "icons/permis", "icon"],
  [/سرعة|vitesse/i, "icons/speed90", "icon"],
  [/كحول|مخدر|دواء|alcool|médicament/i, "mascot/worried", "mascot"],
  [/تعب|نوم|يقظة|fatigue|vigilance|sommeil/i, "mascot/sleep", "mascot"],
  [/غرامة|عقوب|غرامات|amende|sanction|délit|حبس/i, "mascot/police", "mascot"],
  [/مسافة|distance/i, "mascot/timer", "mascot"],
  [/وثائق|بطاقة|تأمين|document|assurance|carte grise/i, "mascot/permis", "mascot"],
  [/بيئة|تلوث|environnement|pollution|وقود|carburant/i, "mascot/vacation", "mascot"],
  [/علامة|علامات|panneau|signalisation|إشارة/i, "mascot/yield", "mascot"],
];

export function illustrationFor(text: string): (Pic & { url: string }) | null {
  for (const [re, src, kind] of RULES) if (re.test(text)) return { src, kind, url: asset(`/${src}.webp`) };
  return null;
}
