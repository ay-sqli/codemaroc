/** Métadonnées des schémas interactifs (utilisables côté serveur comme côté client). */
export interface SchemaMeta {
  title: string;
  desc: string;
  titleAr: string;
  descAr: string;
  chapters: string[];
}

export const SCHEMA_META: Record<string, SchemaMeta> = {
  priorite: {
    title: "Qui passe en premier ?",
    desc: "Simulateur d'intersections : priorité à droite, STOP, cédez, route prioritaire, ambulance, agent.",
    titleAr: "من يمر أولا ؟",
    descAr: "محاكي ملتقيات الطرق: الأسبقية لليمين، علامة قف، فسح المجال، الطريق ذات الأولوية، سيارة الإسعاف، عون المرور.",
    chapters: ["07_regles_priorite", "02_dangers_priorites", "08_changement_direction"],
  },
  giratoire: {
    title: "Les ronds-points",
    desc: "ممر دائري ou ملتقى دوراني : qui a la priorité, quelle voie, quel clignotant.",
    titleAr: "المدارات",
    descAr: "ممر دائري أو ملتقى دوراني: من له الأسبقية، أي ممر تسلك، وأي إشارة ضوئية تستعمل.",
    chapters: ["09_parties_speciales"],
  },
  distance: {
    title: "Distance d'arrêt",
    desc: "Réaction, freinage, arrêt et distance de sécurité avec les formules du cours.",
    titleAr: "مسافة التوقف",
    descAr: "رد الفعل، الفرملة، التوقف ومسافة الأمان بالصيغ الواردة في الدرس.",
    chapters: ["12_distances", "02_distance_arret", "04_perception_reaction", "01_principes_securite"],
  },
  vitesses: {
    title: "Limitations de vitesse",
    desc: "Selon le véhicule, la route et la période probatoire.",
    titleAr: "تحديد السرعة",
    descAr: "حسب نوع المركبة والطريق والفترة الاختبارية.",
    chapters: ["03_vitesse", "13_types_de_routes", "11_autoroute"],
  },
  sanctions: {
    title: "Amendes & points",
    desc: "Échelle des excès de vitesse, montants selon le délai de paiement, points retirés.",
    titleAr: "الغرامات والنقط",
    descAr: "سلّم تجاوز السرعة، المبالغ حسب أجل الأداء، والنقط المسحوبة.",
    chapters: ["02_amendes", "07_annexe_infractions", "04_delits"],
  },
  points: {
    title: "Permis à points",
    desc: "Capital 20 / 30, alertes, récupération des points, annulation.",
    titleAr: "رخصة السياقة بالنقط",
    descAr: "الرصيد 20 / 30، التنبيهات، استرجاع النقط، والإلغاء.",
    chapters: ["01_permis_a_points", "06_suspension_retrait"],
  },
  feux: {
    title: "Quels feux allumer ?",
    desc: "Position, croisement, route, antibrouillards, détresse : situation par situation.",
    titleAr: "أي أضواء تشعل ؟",
    descAr: "أضواء الوضعية، أضواء التقابل، أضواء الطريق، أضواء الضباب، وأضواء الخطر: حالة بحالة.",
    chapters: ["14_conditions_eclairage", "15_conditions_climatiques"],
  },
  marquage: {
    title: "Lignes au sol",
    desc: "Continue, discontinue, annonce, flèches de rabattement, ligne mixte.",
    titleAr: "الخطوط الأرضية",
    descAr: "الخط المتصل، الخط المتقطع، خط الإنذار، أسهم الرجوع، والخط المزدوج.",
    chapters: ["10_signalisation_horizontale"],
  },
  formes: {
    title: "Formes & couleurs des panneaux",
    desc: "Le code visuel qui permet de deviner un panneau inconnu.",
    titleAr: "أشكال العلامات وألوانها",
    descAr: "الرمز البصري الذي يسمح بتخمين معنى علامة لا تعرفها.",
    chapters: ["01_signalisation_verticale", "03_interdictions", "04_obligations", "05_indications", "12_signalisation_temporaire"],
  },
  hierarchie: {
    title: "Qui commande ?",
    desc: "Agent > feux > panneaux > règles.",
    titleAr: "لمن الكلمة ؟",
    descAr: "عون المرور > الأضواء > العلامات > القواعد العامة.",
    chapters: ["09_feux_et_agents", "11_signaux_lumineux"],
  },
  depassement: {
    title: "Dépasser & croiser",
    desc: "Les 5 conditions du dépassement et qui recule quand le croisement est impossible.",
    titleAr: "التجاوز والتقابل",
    descAr: "الشروط الخمسة للتجاوز، ومن يرجع إلى الخلف عندما يستحيل التقابل.",
    chapters: ["05_croisement_depassement", "10_virages", "16_virages_et_pentes"],
  },
  stationnement: {
    title: "Arrêt & stationnement",
    desc: "الوقوف / التوقف, distances 5 m et 12 m, emplacements interdits.",
    titleAr: "الوقوف والتوقف",
    descAr: "الفرق بين الوقوف والتوقف، مسافتا 5 م و12 م، والأماكن الممنوعة.",
    chapters: ["06_arret_stationnement", "08_panonceaux"],
  },
  alcool: {
    title: "Alcool : le seuil",
    desc: "Convertisseur sang ↔ air et seuil légal.",
    titleAr: "الكحول: العتبة القانونية",
    descAr: "محوّل الدم ↔ الهواء المنبعث، والعتبة القانونية.",
    chapters: ["02_alcool_medicaments", "05_sous_influence"],
  },
  energie: {
    title: "Énergie d'un choc",
    desc: "Pourquoi doubler la vitesse multiplie la violence du choc par 4.",
    titleAr: "طاقة الاصطدام",
    descAr: "لماذا تتضاعف قوة الاصطدام 4 مرات عندما تتضاعف السرعة.",
    chapters: ["06_environnement", "04_equipements_securite", "03_perte_controle"],
  },
  etat: {
    title: "État de la route",
    desc: "Pluie, neige, gravillons, piste, chute de pierres : la voiture freine, la distance d'arrêt s'allonge.",
    titleAr: "حالة الطريق",
    descAr: "مطر، ثلج، حصى، طريق ترابية، تساقط الأحجار: السيارة تفرمل ومسافة التوقف تطول.",
    chapters: ["15_conditions_climatiques", "14_dangers_exceptionnels", "03_perte_controle"],
  },
  usagers: {
    title: "Usagers de la route",
    desc: "Ambulance, gendarmerie, tracteur, charrette… à qui céder le passage ?",
    titleAr: "مستعملو الطريق",
    descAr: "سيارة الإسعاف، الدرك، الجرار، العربة المجرورة… لمن تفسح الطريق ؟",
    chapters: ["05_vehicules_prioritaires", "13_autres_usagers"],
  },
  passage: {
    title: "Passage à niveau",
    desc: "Feux rouges clignotants, barrières, train : quand s'arrêter et quand traverser.",
    titleAr: "الممر السككي",
    descAr: "أضواء حمراء وامضة، حواجز، قطار: متى تتوقف ومتى تعبر.",
    chapters: ["02_dangers_priorites", "09_feux_et_agents"],
  },
  autoroute: {
    title: "Autoroute et péage",
    desc: "S'insérer par la voie d'accélération, passer le péage, vitesses et interdits.",
    titleAr: "الطريق السيار والأداء",
    descAr: "الاندماج عبر مسلك التسريع، محطة الأداء، السرعات والممنوعات.",
    chapters: ["11_autoroute", "13_types_de_routes"],
  },
  tunnel: {
    title: "Le tunnel",
    desc: "Mini-jeu : allume tes feux de croisement avant d'entrer.",
    titleAr: "النفق",
    descAr: "لعبة: شغّل أضواء التقابل قبل الدخول.",
    chapters: ["05_indications", "14_conditions_eclairage"],
  },
  pas: {
    title: "Accident : P.A.S.",
    desc: "Protéger, Alerter, Secourir et les numéros d'urgence.",
    titleAr: "الحادثة: احمِ، أخبِر، أسعِف",
    descAr: "الحماية، الإخبار، الإسعاف، وأرقام الاستعجال.",
    chapters: ["15_panne_accident", "05_homicide_blessures"],
  },
};

/** Tous les schémas liés à un chapitre. */
export function schemasForChapter(slug: string) {
  return Object.entries(SCHEMA_META)
    .filter(([, s]) => s.chapters.includes(slug))
    .map(([id]) => id);
}

export function schemaForChapter(slug: string) {
  return Object.entries(SCHEMA_META).find(([, s]) => s.chapters.includes(slug))?.[0];
}

export function schemaTitle(m: SchemaMeta, lang: "fr" | "ar") {
  return lang === "ar" ? m.titleAr : m.title;
}
export function schemaDesc(m: SchemaMeta, lang: "fr" | "ar") {
  return lang === "ar" ? m.descAr : m.desc;
}
