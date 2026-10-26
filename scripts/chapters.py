"""
Registre central des sous-chapitres Perminou (NARSA, permis B).

Chaque entrée : (slug, id_perminou, emoji, titre_ar, titre_fr, couleur)
  - slug        : nom du dossier dans inputs/<module>/ et préfixe des fichiers outputs/
  - id_perminou : identifiant P<n> de l'URL /cours/chapter/(?P<n>[\\d.]+)/$/
  - couleur     : couleur Tailwind de la carte dans index.html
"""

MODULES = [
    {
        'id': '01', 'dir': '01_la_route', 'emoji': '🛣️',
        'ar': 'الطريق', 'fr': 'La Route', 'perminou': 3,
        'desc': 'التشوير العمودي، الأفقي، علامات الخطر، المنع، الإجبار، الإرشاد وملتقيات الطرق.',
        'chapters': [
            ('01_signalisation_verticale', 4, '🚦', 'التشوير العمودي', 'Signalisation Verticale', 'blue'),
            ('02_dangers_priorites', 17, '⚠️', 'علامات الخطر والأسبقية', 'Dangers et Priorités', 'amber'),
            ('03_interdictions', 41, '⛔', 'علامات المنع ونهاية المنع', 'Interdictions et Fins', 'rose'),
            ('04_obligations', 35, '🔵', 'علامات الإجبار ونهاية الإجبار', 'Obligations et Fins', 'sky'),
            ('05_indications', 36, 'ℹ️', 'علامات الإرشاد', 'Indications', 'indigo'),
            ('06_directions', 34, '🧭', 'علامات الاتجاه', 'Directions', 'emerald'),
            ('07_localisations', 39, '📍', 'علامات المواقع', 'Localisations', 'teal'),
            ('08_panonceaux', 42, '🪧', 'اللويحات', 'Panonceaux', 'slate'),
            ('09_feux_et_agents', 32, '👮', 'الإشارات الضوئية وإشارات أعوان المرور', 'Feux et Agents', 'red'),
            ('10_signalisation_horizontale', 37, '〰️', 'التشوير الأفقي', 'Signalisation Horizontale', 'cyan'),
            ('11_signaux_lumineux', 40, '💡', 'العلامات الضوئية', 'Signaux Lumineux', 'yellow'),
            ('12_signalisation_temporaire', 85, '🚧', 'علامات وأجهزة التشوير المؤقت', 'Signalisation Temporaire', 'orange'),
            ('13_types_de_routes', 30, '🛤️', 'خصائص مختلف أنواع الطريق', 'Types de Routes', 'lime'),
            ('14_conditions_eclairage', 28, '🌙', 'السياقة في الظروف الخاصة للإضاءة', 'Conditions d\'Éclairage', 'violet'),
            ('15_conditions_climatiques', 29, '🌧️', 'السياقة في الظروف المناخية السيئة', 'Conditions Climatiques', 'sky'),
            ('16_virages_et_pentes', 31, '⛰️', 'المنعرجات الخطيرة والعقبة والمنحدر', 'Virages et Pentes', 'stone'),
        ],
    },
    {
        'id': '02', 'dir': '02_regles_circulation', 'emoji': '🚦',
        'ar': 'قواعد السير', 'fr': 'Règles de circulation', 'perminou': 16,
        'desc': 'السرعة، الأسبقية، التجاوز، الوقوف والتوقف، الطريق السيار، مسافات الأمان والعطب والحوادث.',
        'chapters': [
            ('01_montee_descente', 45, '🚪', 'الركوب والنزول من المركبة', 'Montée et Descente', 'blue'),
            ('02_demarrage', 47, '🔑', 'الإقلاع وولوج حركة السير', 'Démarrage et Insertion', 'emerald'),
            ('03_vitesse', 46, '⏱️', 'السرعة', 'La Vitesse', 'rose'),
            ('04_position_sur_route', 22, '↔️', 'الوضعية على الطريق', 'Position sur la Route', 'teal'),
            ('05_croisement_depassement', 50, '🚗', 'التقابل والتجاوز', 'Croisement et Dépassement', 'amber'),
            ('06_arret_stationnement', 20, '🅿️', 'الوقوف والتوقف', 'Arrêt et Stationnement', 'indigo'),
            ('07_regles_priorite', 52, '🔺', 'قواعد الأسبقية', 'Règles de Priorité', 'red'),
            ('08_changement_direction', 53, '↪️', 'تغيير الاتجاه', 'Changement de Direction', 'cyan'),
            ('09_parties_speciales', 49, '🔀', 'الاقتراب من الأجزاء المميزة للطريق', 'Endroits Particuliers', 'violet'),
            ('10_virages', 51, '〽️', 'السياقة في المنعرجات', 'Les Virages', 'orange'),
            ('11_autoroute', 19, '🛣️', 'السير على الطريق السيار', 'L\'Autoroute', 'sky'),
            ('12_distances', 48, '📏', 'مسافة الأمان والحصر والوقوف', 'Distances de Sécurité', 'lime'),
            ('13_autres_usagers', 54, '🚶', 'مستعملو الطريق الآخرون', 'Autres Usagers', 'yellow'),
            ('14_dangers_exceptionnels', 55, '⚡', 'بعض الأخطار الاستثنائية', 'Dangers Exceptionnels', 'stone'),
            ('15_panne_accident', 56, '🚨', 'عطب المركبة أو حادثة سير', 'Panne et Accident', 'slate'),
        ],
    },
    {
        'id': '03', 'dir': '03_le_conducteur', 'emoji': '👤',
        'ar': 'السائق', 'fr': 'Le Conducteur', 'perminou': 8,
        'desc': 'أصناف رخص السياقة، الكحول والأدوية، اليقظة، زمن رد الفعل واتخاذ القرار.',
        'chapters': [
            ('01_categories_permis', 58, '🪪', 'أصناف رخصة السياقة والسن الأدنى', 'Catégories de Permis', 'blue'),
            ('02_alcool_medicaments', 60, '🍷', 'الكحول والأدوية والمخدرات', 'Alcool et Médicaments', 'rose'),
            ('03_vigilance', 61, '👀', 'اليقظة والموقف تجاه الآخرين', 'Vigilance et Attitude', 'amber'),
            ('04_perception_reaction', 62, '🧠', 'التمييز والتقييم وزمن رد الفعل', 'Perception et Réaction', 'violet'),
        ],
    },
    {
        'id': '04', 'dir': '04_le_vehicule', 'emoji': '🚗',
        'ar': 'المركبة', 'fr': 'Le Véhicule', 'perminou': 10,
        'desc': 'الوثائق الإدارية، العناصر الميكانيكية، أنظمة المساعدة، المركبات ذات الأولوية والبيئة.',
        'chapters': [
            ('01_regles_administratives', 15, '📄', 'القواعد الإدارية المتعلقة بالمركبات', 'Règles Administratives', 'blue'),
            ('02_elements_mecaniques', 63, '🔧', 'العناصر الميكانيكية وسلامة السياقة', 'Éléments Mécaniques', 'slate'),
            ('03_aides_conduite', 64, '🛰️', 'أنظمة المساعدة على السياقة', 'Aides à la Conduite', 'cyan'),
            ('04_precautions_portieres', 66, '🚪', 'الاحتياطات عند الصعود أو النزول', 'Précautions Montée/Descente', 'amber'),
            ('05_vehicules_prioritaires', 69, '🚑', 'المركبات ذات الأولوية وبطيئة السير', 'Véhicules Prioritaires', 'red'),
            ('06_environnement', 70, '🌱', 'المركبة واحترام البيئة', 'Véhicule et Environnement', 'emerald'),
        ],
    },
    {
        'id': '05', 'dir': '05_infractions_sanctions', 'emoji': '⚖️',
        'ar': 'المخالفات والعقوبات', 'fr': 'Infractions & Sanctions', 'perminou': 9,
        'desc': 'رخصة السياقة بالنقط، الغرامات، الجنح، الحجز، توقيف وسحب الرخصة.',
        'chapters': [
            ('01_permis_a_points', 11, '🔢', 'رخصة السياقة بالنقط', 'Permis à Points', 'blue'),
            ('02_amendes', 65, '💰', 'الغرامات التصالحية الجزافية', 'Amendes Transactionnelles', 'amber'),
            ('03_immobilisation_fourriere', 74, '🔒', 'توقيف المركبات وإيداعها بالمحجز', 'Immobilisation et Fourrière', 'slate'),
            ('04_delits', 71, '🚔', 'الجنح والعقوبات المتعلقة بها', 'Délits et Peines', 'rose'),
            ('05_homicide_blessures', 73, '🩹', 'القتل والجروح غير العمدية', 'Homicide et Blessures', 'red'),
            ('06_suspension_retrait', 75, '🚫', 'توقيف وسحب رخصة السياقة', 'Suspension et Retrait', 'violet'),
            ('07_annexe_infractions', 106, '📋', 'ملحق خاص بجميع المخالفات', 'Annexe des Infractions', 'teal'),
        ],
    },
    {
        'id': '06', 'dir': '06_principes_securite', 'emoji': '🛡️',
        'ar': 'المبادئ الأولية في السلامة الطرقية', 'fr': 'Sécurité Routière', 'perminou': 6,
        'desc': 'زمن رد الفعل، مسافة الوقوف، فقدان السيطرة، تجهيزات السلامة، السياقة تحت التأثير والحالة الصحية.',
        'chapters': [
            ('01_principes_securite', 76, '🛡️', 'مبادئ السلامة الطرقية', 'Principes de Sécurité', 'blue'),
            ('02_distance_arret', 77, '🛑', 'مسافة الوقوف', 'Distance d\'Arrêt', 'red'),
            ('03_perte_controle', 78, '🌀', 'فقدان السيطرة على المركبة', 'Perte de Contrôle', 'amber'),
            ('04_equipements_securite', 86, '🦺', 'تجهيزات السلامة', 'Équipements de Sécurité', 'emerald'),
            ('05_sous_influence', 80, '🍺', 'السياقة تحت التأثير', 'Conduite sous Influence', 'rose'),
            ('06_etat_sante', 81, '❤️', 'الحالة الصحية', 'État de Santé', 'violet'),
        ],
    },
]

# Chapitres déjà réalisés à la main avant l'automatisation (mindmaps historiques)
LEGACY_MINDMAPS = {
    '01_signalisation_verticale': 'mindmap_01.html',
    '02_dangers_priorites': 'mindmap_02_finale.html',
    '03_interdictions': 'mindmap_03_finale.html',
}


def find_chapter(slug_or_id):
    for mod in MODULES:
        for ch in mod['chapters']:
            if ch[0] == slug_or_id or str(ch[1]) == str(slug_or_id):
                return mod, ch
    return None, None
