import type { Pose } from "@/components/game/Mascot";
import type { IconName } from "@/components/game/GameIcon";

/**
 * Texte du guide interactif, en français et en arabe.
 * Dans les textes : **gras**, et {flame} insère la petite icône du même nom (GameIcon).
 * Les captures et la position de chaque élément viennent de scripts/capture-guide.mjs :
 * l'identifiant d'un élément (`id`) doit exister dans ce script.
 */
export type L = [fr: string, ar: string];

export type PointIcon = IconName | "book" | "target" | "clock" | "check" | "hand" | "cloud" | "keyboard" | "list" | "phone" | "download" | "sound" | "schema" | "bulb" | "stairs";

export interface Point {
  ic: PointIcon;
  t: L;
}

export interface Spot {
  id: string;
  title: L;
  body: L;
}

export type DemoId =
  | "lang" | "score" | "map" | "nodes" | "lesson" | "zoom" | "reveal" | "picker" | "leitner" | "flip" | "badges" | "day" | "quiz";

export type Step =
  | { kind: "intro"; pose: Pose; title: L; body: L; points?: Point[] }
  | { kind: "shot"; shot: string; title: L; lead?: L; spots: Spot[] }
  | { kind: "demo"; demo: DemoId; title: L; body: L };

export interface Chapter {
  id: string;
  pose: Pose;
  title: L;
  desc: L;
  steps: Step[];
}

export const CHAPTERS: Chapter[] = [
  /* ───────────────────────── 1. Bienvenue ───────────────────────── */
  {
    id: "welcome",
    pose: "welcome",
    title: ["Bienvenue", "مرحبا بك"],
    desc: ["Le but de l'application et ce qu'elle contient", "هدف التطبيق وما يحتوي عليه"],
    steps: [
      {
        kind: "intro",
        pose: "welcome",
        title: ["Salut, moi c'est le petit taxi !", "مرحبا، أنا سيارة الأجرة الصغيرة !"],
        body: [
          "Je vais te montrer **toute l'application** : chaque page, chaque bouton et chaque astuce. Tu sauras exactement comment avancer jusqu'à ton permis.",
          "سأريك **التطبيق كله**: كل صفحة وكل زر وكل حيلة. ستعرف بالضبط كيف تتقدم حتى تحصل على رخصتك.",
        ],
        points: [
          { ic: "hand", t: ["Sur les écrans, **touche les numéros** pour découvrir chaque élément.", "في الشاشات، **المس الأرقام** لتكتشف كل عنصر."] },
          { ic: "target", t: ["Certains écrans sont des **exercices à essayer** : rien n'est compté, tu ne peux rien casser.", "بعض الشاشات **تمارين للتجربة**: لا يُحتسب شيء ولا يمكنك إفساد أي شيء."] },
          { ic: "list", t: ["Le bouton **Sommaire**, en haut, permet d'aller directement à un chapitre.", "زر **المحتوى** في الأعلى يأخذك مباشرة إلى أي فصل."] },
          { ic: "clock", t: ["Tu peux arrêter à tout moment : tu reprendras au même endroit, depuis **Plus** ou **Mon profil**.", "يمكنك التوقف في أي وقت: ستعود إلى المكان نفسه من **المزيد** أو **ملفي**."] },
        ],
      },
      {
        kind: "demo",
        demo: "lang",
        title: ["Choisis ta langue", "اختر لغتك"],
        body: [
          "Toute l'application s'affiche dans la langue choisie. Tu peux en changer à tout moment avec le bouton {globe} en haut de l'écran.",
          "يظهر التطبيق كله باللغة التي تختارها. يمكنك تغييرها في أي وقت بزر {globe} في أعلى الشاشة.",
        ],
      },
      {
        kind: "intro",
        pose: "permis",
        title: ["Ton objectif : réussir le code", "هدفك: النجاح في امتحان رخصة السياقة"],
        body: [
          "Tout dans Code Maroc prépare ce moment. L'examen se passe toujours de la même manière :",
          "كل شيء في كود المغرب يهيئك لهذه اللحظة. يجري الامتحان دائما بالطريقة نفسها:",
        ],
        points: [
          { ic: "list", t: ["**40 questions** projetées en image, avec un commentaire audio en arabe.", "**40 سؤالا** تُعرض على شكل صور مع تعليق صوتي بالعربية."] },
          { ic: "clock", t: ["Environ **30 secondes** par question.", "حوالي **30 ثانية** لكل سؤال."] },
          { ic: "check", t: ["Tu coches **une ou plusieurs** cases, de 1 à 4.", "تختار خانة **واحدة أو أكثر**، من 1 إلى 4."] },
          { ic: "champion", t: ["Il faut **32 bonnes réponses sur 40** pour réussir.", "يجب الحصول على **32 جوابا صحيحا من 40** للنجاح."] },
        ],
      },
      {
        kind: "demo",
        demo: "score",
        title: ["Essaie : combien d'erreurs as-tu le droit de faire ?", "جرّب: كم خطأ يُسمح لك به ؟"],
        body: ["Fais glisser le curseur pour voir à partir de quel score l'examen est réussi.", "حرّك المؤشر لترى ابتداء من أي نتيجة تنجح في الامتحان."],
      },
      {
        kind: "demo",
        demo: "map",
        title: ["Tout ce que tu trouveras ici", "كل ما ستجده هنا"],
        body: [
          "Dix espaces, un seul but. **Touche une carte** pour aller directement à son explication, ou continue pour tout voir dans l'ordre.",
          "عشرة فضاءات وهدف واحد. **المس بطاقة** لتنتقل مباشرة إلى شرحها، أو تابع لترى كل شيء بالترتيب.",
        ],
      },
    ],
  },

  /* ───────────────────────── 2. Se repérer ───────────────────────── */
  {
    id: "nav",
    pose: "directions",
    title: ["Se repérer", "كيف تتنقل"],
    desc: ["La barre du haut, les onglets et le menu", "الشريط العلوي والتبويبات والقائمة"],
    steps: [
      {
        kind: "shot",
        shot: "home",
        title: ["La barre du haut", "الشريط العلوي"],
        lead: ["Elle reste visible sur toutes les pages.", "يبقى ظاهرا في كل الصفحات."],
        spots: [
          { id: "streak", title: ["Ta série de jours", "سلسلة أيامك"], body: ["{flame} Le nombre de jours d'affilée où tu as répondu à au moins une question. Un seul jour sans question, et elle repart de zéro.", "{flame} عدد الأيام المتتالية التي أجبت فيها عن سؤال واحد على الأقل. يوم واحد بدون أسئلة، فتعود السلسلة إلى الصفر."] },
          { id: "xp", title: ["Tes points XP", "نقاط XP"], body: ["{xp} Tu en gagnes chaque fois que tu valides une étape du Parcours. Ils montrent ton effort, pas ton niveau.", "{xp} تربحها كلما أكملت مرحلة من المسار. فهي تعبّر عن مجهودك وليس عن مستواك."] },
          { id: "crown", title: ["Tes étapes validées", "مراحلك المكتملة"], body: ["{crown} Le nombre d'étapes réussies sur le total du Parcours. C'est le vrai compteur de ton avancement.", "{crown} عدد المراحل التي نجحت فيها من مجموع مراحل المسار. هذا هو العداد الحقيقي لتقدمك."] },
          { id: "lang", title: ["La langue", "اللغة"], body: ["Passe du français à l'arabe en un geste. Ta progression ne change pas.", "انتقل من الفرنسية إلى العربية بلمسة واحدة. لا يتغير تقدمك."] },
          { id: "avatar", title: ["Ton profil", "ملفك"], body: ["La première lettre de ton nom. Touche-la pour ouvrir ton profil, ton grade et ton compte.", "الحرف الأول من اسمك. المسه لفتح ملفك ورتبتك وحسابك."] },
        ],
      },
      {
        kind: "shot",
        shot: "home",
        title: ["Les onglets du bas", "التبويبات السفلية"],
        lead: ["Sur téléphone, ils te suivent partout.", "على الهاتف، ترافقك في كل مكان."],
        spots: [
          { id: "tab-path", title: ["Parcours", "المسار"], body: ["Ta route principale, étape par étape. C'est ici que tu commences chaque jour.", "طريقك الرئيسي، مرحلة بعد مرحلة. من هنا تبدأ كل يوم."] },
          { id: "tab-courses", title: ["Cours", "الدروس"], body: ["Les 54 chapitres complets du programme, à lire quand tu veux.", "الدروس الـ54 الكاملة للبرنامج، تقرؤها متى شئت."] },
          { id: "tab-exam", title: ["Examen blanc", "امتحان تجريبي"], body: ["40 questions en conditions réelles pour mesurer ton niveau.", "40 سؤالا في ظروف حقيقية لقياس مستواك."] },
          { id: "tab-errors", title: ["Mes erreurs", "أخطائي"], body: ["Tes questions ratées. Une pastille rouge indique combien sont à revoir aujourd'hui.", "الأسئلة التي أخطأت فيها. تشير نقطة حمراء إلى عدد ما يجب مراجعته اليوم."] },
          { id: "tab-more", title: ["Plus", "المزيد"], body: ["Tout le reste : s'entraîner, schémas, mémo, tableau de bord, progression, profil et ce guide.", "كل الباقي: التمرن، الرسوم، المذكرة، لوحة القيادة، التقدم، الملف وهذا الدليل."] },
        ],
      },
      {
        kind: "shot",
        shot: "more",
        title: ["Le menu Plus", "قائمة المزيد"],
        lead: ["Touche **Plus** pour ouvrir ce menu.", "المس **المزيد** لفتح هذه القائمة."],
        spots: [
          { id: "list", title: ["Tous les autres espaces", "كل الفضاءات الأخرى"], body: ["S'entraîner, Schémas, Mémo, Tableau de bord, Progression et Mon profil sont réunis ici.", "التمرن والرسوم والمذكرة ولوحة القيادة والتقدم وملفي مجموعة هنا."] },
          { id: "guide", title: ["Revoir ce guide", "إعادة مشاهدة هذا الدليل"], body: ["Un doute plus tard ? Rouvre le guide ici, au chapitre de ton choix.", "هل عندك شك لاحقا ؟ أعد فتح الدليل من هنا، في الفصل الذي تريد."] },
        ],
      },
      {
        kind: "shot",
        shot: "desktop",
        title: ["Sur ordinateur", "على الحاسوب"],
        lead: ["Mêmes pages, autre disposition.", "الصفحات نفسها بترتيب مختلف."],
        spots: [
          { id: "nav", title: ["Le menu de gauche", "القائمة الجانبية"], body: ["Toutes les pages sont listées ici, dans l'ordre où tu en as besoin.", "كل الصفحات موجودة هنا، بالترتيب الذي تحتاجها به."] },
          { id: "close", title: ["Fermer le menu", "إغلاق القائمة"], body: ["Ce bouton replie le menu pour gagner de la place. Un petit bouton permet de le rouvrir, et ton choix est mémorisé.", "هذا الزر يطوي القائمة لربح مساحة. يتيح لك زر صغير إعادة فتحها، ويتم حفظ اختيارك."] },
          { id: "numbers", title: ["Tes chiffres", "أرقامك"], body: ["Série, XP et étapes validées, toujours visibles sur le Parcours.", "السلسلة وXP والمراحل المكتملة، ظاهرة دائما في المسار."] },
          { id: "quests", title: ["La colonne de droite", "العمود الأيمن"], body: ["Tes défis du jour, tes badges et ta sauvegarde, à côté du Parcours.", "تحديات اليوم وشاراتك وحفظ تقدمك، بجانب المسار."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 3. Parcours ───────────────────────── */
  {
    id: "path",
    pose: "travel",
    title: ["Le Parcours", "المسار"],
    desc: ["Avancer étape par étape jusqu'au sommet", "التقدم مرحلة بعد مرحلة حتى القمة"],
    steps: [
      {
        kind: "intro",
        pose: "travel",
        title: ["Une route, du plus facile au plus difficile", "طريق واحد، من الأسهل إلى الأصعب"],
        body: [
          "Le Parcours range **toutes les questions** dans le meilleur ordre. Si tu ne sais pas quoi faire, suis simplement la route.",
          "يرتب المسار **كل الأسئلة** في أفضل ترتيب. إذا لم تعرف ماذا تفعل، فاتبع الطريق فقط.",
        ],
        points: [
          { ic: "mountain", t: ["**6 sections** : la route, le conducteur, le véhicule, les règles, la sécurité, les sanctions.", "**6 أقسام**: الطريق، السائق، المركبة، القواعد، السلامة، العقوبات."] },
          { ic: "book", t: ["Chaque section contient des **unités**, une par chapitre du cours.", "يضم كل قسم **وحدات**، وحدة لكل درس."] },
          { ic: "first-step", t: ["Chaque unité contient des **étapes** d'environ 12 questions.", "تضم كل وحدة **مراحل** من حوالي 12 سؤالا."] },
          { ic: "chest", t: ["Un **défi** chronométré clôt chaque unité.", "**تحدٍّ** بتوقيت يختم كل وحدة."] },
          { ic: "champion", t: ["Tout en haut, **le Sommet** : l'examen final de 40 questions.", "في النهاية **القمة**: الامتحان النهائي من 40 سؤالا."] },
        ],
      },
      {
        kind: "shot",
        shot: "path",
        title: ["Lire la route", "كيف تقرأ الطريق"],
        spots: [
          { id: "unit", title: ["L'unité en cours", "الوحدة الحالية"], body: ["Son nom reste affiché en haut pendant que tu fais défiler la route.", "يبقى اسمها ظاهرا في الأعلى وأنت تتصفح الطريق."] },
          { id: "guide", title: ["Le bouton livre", "زر الكتاب"], body: ["Ouvre directement la fiche complète du chapitre de cette unité.", "يفتح مباشرة الملخص الكامل لدرس هذه الوحدة."] },
          { id: "done", title: ["Une étape validée", "مرحلة مكتملة"], body: ["Tu peux la refaire quand tu veux pour gagner quelques XP et réviser.", "يمكنك إعادتها متى شئت لربح بعض نقاط XP والمراجعة."] },
          { id: "current", title: ["L'étape en cours", "المرحلة الحالية"], body: ["Le petit taxi t'y attend. Touche-la pour commencer.", "سيارة الأجرة الصغيرة تنتظرك هناك. المسها لتبدأ."] },
          { id: "locked", title: ["Une étape verrouillée", "مرحلة مقفلة"], body: ["Elle s'ouvre quand tu as réussi toutes celles d'avant. On ne peut pas sauter d'étape.", "تُفتح عندما تنجح في كل ما قبلها. لا يمكن تجاوز أي مرحلة."] },
        ],
      },
      {
        kind: "demo",
        demo: "nodes",
        title: ["Les panneaux de la route", "علامات الطريق"],
        body: ["Chaque visuel a un sens. **Touche-les** pour savoir lequel.", "لكل شكل معنى. **المسها** لتعرف معناها."],
      },
      {
        kind: "shot",
        shot: "popover",
        title: ["Ouvrir une étape", "فتح مرحلة"],
        spots: [
          { id: "card", title: ["La carte de l'étape", "بطاقة المرحلة"], body: ["Elle indique le sujet, le numéro de l'étape et le nombre de questions.", "تبين الموضوع ورقم المرحلة وعدد الأسئلة."] },
          { id: "start", title: ["Commencer", "ابدأ"], body: ["Le bouton affiche aussi les XP que tu vas gagner.", "يبين الزر أيضا نقاط XP التي ستربحها."] },
        ],
      },
      {
        kind: "shot",
        shot: "lesson-intro",
        title: ["D'abord, le cours express", "أولا، الدرس السريع"],
        lead: ["Lis-le : les réponses y sont.", "اقرأه: الأجوبة موجودة فيه."],
        spots: [
          { id: "scene", title: ["Ton moniteur", "مدربك"], body: ["Le petit taxi explique le nombre de questions et les règles de l'étape.", "تشرح سيارة الأجرة الصغيرة عدد الأسئلة وقواعد المرحلة."] },
          { id: "content", title: ["L'essentiel à retenir", "الأساسي الذي يجب حفظه"], body: ["Exactement ce qu'il faut savoir pour cette étape : les panneaux à reconnaître ou les règles à retenir.", "بالضبط ما يجب أن تعرفه لهذه المرحلة: العلامات التي يجب التعرف عليها أو القواعد التي يجب حفظها."] },
          { id: "fiche", title: ["Aller plus loin", "للتعمق أكثر"], body: ["Ouvre la fiche complète, ou un schéma animé quand il y en a un pour le sujet.", "افتح الملخص الكامل، أو رسما متحركا إذا كان متوفرا للموضوع."] },
          { id: "go", title: ["Aux questions !", "إلى الأسئلة !"], body: ["Quand tu te sens prêt, lance les questions.", "عندما تشعر أنك مستعد، ابدأ الأسئلة."] },
        ],
      },
      {
        kind: "shot",
        shot: "lesson-q",
        title: ["Répondre aux questions", "الإجابة عن الأسئلة"],
        spots: [
          { id: "bar", title: ["La barre d'avancement", "شريط التقدم"], body: ["Elle se remplit à chaque bonne réponse.", "يمتلئ مع كل جواب صحيح."] },
          { id: "points", title: ["Tes points de permis", "نقط رخصتك"], body: ["{permis} Tu commences avec 3 points. Chaque erreur en retire un.", "{permis} تبدأ بـ3 نقط. كل خطأ يسحب نقطة."] },
          { id: "tile", title: ["Ta réponse", "جوابك"], body: ["Touche une proposition pour la choisir. Certaines questions ont plusieurs bonnes réponses : c'est alors indiqué au-dessus.", "المس اقتراحا لاختياره. لبعض الأسئلة عدة أجوبة صحيحة، ويُشار إلى ذلك في الأعلى."] },
          { id: "check", title: ["Vérifier", "تحقق"], body: ["Valide ton choix. Sur ordinateur, les touches 1 à 4 puis Entrée vont plus vite.", "أكّد اختيارك. على الحاسوب، المفاتيح من 1 إلى 4 ثم مفتاح الإدخال أسرع."] },
          { id: "quit", title: ["Quitter", "مغادرة"], body: ["La croix arrête l'étape. Si tu confirmes, ta progression dans cette étape est perdue.", "يوقف الرمز × المرحلة. إذا أكدت، تفقد تقدمك في هذه المرحلة."] },
        ],
      },
      {
        kind: "shot",
        shot: "lesson-ko",
        title: ["Quand tu te trompes", "عندما تخطئ"],
        spots: [
          { id: "points", title: ["Un point en moins", "نقطة أقل"], body: ["{permis} Le compteur baisse. À zéro, ton permis est suspendu et l'étape s'arrête.", "{permis} ينقص العداد. عند الصفر، توقف رخصتك وتنتهي المرحلة."] },
          { id: "sheet", title: ["La correction", "التصحيح"], body: ["La bonne réponse et l'explication s'affichent aussitôt. Cette question **reviendra à la fin** de l'étape.", "يظهر الجواب الصحيح والشرح فورا. وسيعود هذا السؤال **في نهاية** المرحلة."] },
          { id: "next", title: ["Continuer", "متابعة"], body: ["Passe à la suite. L'erreur est aussi rangée dans ton carnet pour plus tard.", "انتقل إلى ما يلي. ويُرتَّب الخطأ أيضا في دفترك لوقت لاحق."] },
        ],
      },
      {
        kind: "demo",
        demo: "lesson",
        title: ["À toi : une mini-étape", "دورك: مرحلة صغيرة"],
        body: ["Essaie, et trompe-toi exprès pour voir ce qui se passe. Rien n'est enregistré.", "جرّب، وأخطئ عمدا لترى ما يحدث. لا يُسجَّل أي شيء."],
      },
      {
        kind: "intro",
        pose: "timer",
        title: ["Les défis et le Sommet", "التحديات والقمة"],
        body: ["Plus de cours express ici : tu montres ce que tu as retenu, au chrono.", "لا يوجد درس سريع هنا: تُظهر ما حفظته، بتوقيت."],
        points: [
          { ic: "chest", t: ["**Défi d'unité** : 10 questions, 30 secondes chacune, 2 erreurs permises. {xp} +20 XP.", "**تحدي الوحدة**: 10 أسئلة، 30 ثانية لكل سؤال، خطآن مسموحان. {xp} ‎+20 XP."] },
          { ic: "champion", t: ["**Le Sommet** : 40 questions, 30 secondes chacune, 8 erreurs au maximum, comme le jour de l'examen. {xp} +100 XP.", "**القمة**: 40 سؤالا، 30 ثانية لكل سؤال، 8 أخطاء على الأكثر، كما في يوم الامتحان. {xp} ‎+100 XP."] },
          { ic: "clock", t: ["Si le temps se termine avant ta réponse, cela compte comme une erreur.", "إذا انتهى الوقت قبل جوابك، يُحتسب ذلك خطأ."] },
          { ic: "target", t: ["Les questions du défi sont choisies en priorité parmi celles que tu rates ou n'as jamais vues.", "تُختار أسئلة التحدي بالأولوية مما تخطئ فيه أو لم تره من قبل."] },
        ],
      },
      {
        kind: "intro",
        pose: "cheer",
        title: ["À la fin d'une étape", "في نهاية المرحلة"],
        body: ["Trois chiffres résument ta tentative : les XP gagnés, ta précision et ton temps.", "ثلاثة أرقام تلخص محاولتك: نقاط XP المكتسبة، ودقتك، والمدة."],
        points: [
          { ic: "xp", t: ["**+10 XP** pour une étape réussie, **+5** de plus si tu ne fais aucune erreur, **+5** quand tu en refais une.", "**‎+10 XP** لكل مرحلة ناجحة، و**‎+5** إضافية بدون أي خطأ، و**‎+5** عند إعادة مرحلة."] },
          { ic: "permis", t: ["**Permis suspendu ?** Pas de panique : relis le cours express et réessaie, autant de fois que tu veux.", "**رخصة موقوفة ؟** لا تقلق: أعد قراءة الدرس السريع وحاول مجددا، كما تشاء من المرات."] },
          { ic: "phone", t: ["Téléphone éteint ou page fermée ? Rouvre l'étape : le bouton **Reprendre** te ramène à la même question.", "انطفأ الهاتف أو أُغلقت الصفحة ؟ أعد فتح المرحلة: زر **استأنف** يعيدك إلى السؤال نفسه."] },
          { ic: "sound", t: ["Sur ordinateur, l'icône du haut-parleur coupe ou active les sons.", "على الحاسوب، أيقونة مكبر الصوت تكتم الأصوات أو تشغلها."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 4. Cours ───────────────────────── */
  {
    id: "courses",
    pose: "reading",
    title: ["Les cours", "الدروس"],
    desc: ["54 chapitres, fiches, cartes mentales et panneaux", "54 درسا، ملخصات، خرائط ذهنية وعلامات"],
    steps: [
      {
        kind: "shot",
        shot: "catalog",
        title: ["Trouver un chapitre", "إيجاد درس"],
        lead: ["Tout le programme, classé en 6 axes.", "البرنامج كله، مرتب في 6 محاور."],
        spots: [
          { id: "filters", title: ["Filtres", "التصفية"], body: ["Affiche un seul axe, les chapitres pas encore lus, déjà lus, ou ceux où tu as des erreurs à revoir.", "اعرض محورا واحدا، أو الدروس غير المقروءة، أو المقروءة، أو التي بها أخطاء للمراجعة."] },
          { id: "search", title: ["Recherche", "البحث"], body: ["Tape un mot du titre pour trouver un chapitre.", "اكتب كلمة من العنوان لتجد درسا."] },
          { id: "sort", title: ["Trier", "الترتيب"], body: ["Par ordre du programme, par titre, ou en commençant par tes erreurs.", "حسب ترتيب البرنامج، أو العنوان، أو بدءا بأخطائك."] },
          { id: "card", title: ["Un chapitre", "درس"], body: ["La carte indique le nombre de sections, le temps de lecture et les panneaux. Les badges **Lu** et **erreurs** montrent où tu en es.", "تبين البطاقة عدد الأقسام ومدة القراءة والعلامات. وتوضح شارتا **مقروء** و**أخطاء** أين وصلت."] },
        ],
      },
      {
        kind: "shot",
        shot: "chapter",
        title: ["La page d'un chapitre", "صفحة الدرس"],
        spots: [
          { id: "quiz", title: ["Commencer le quiz", "ابدأ الاختبار"], body: ["20 questions sur ce chapitre uniquement.", "20 سؤالا عن هذا الدرس فقط."] },
          { id: "read", title: ["Marquer comme lu", "وضع علامة مقروء"], body: ["À toucher quand tu as fini la fiche : le chapitre sort de ta liste à lire.", "المسه عند إنهاء الملخص: يخرج الدرس من قائمة ما يجب قراءته."] },
          { id: "info", title: ["En un coup d'œil", "نظرة سريعة"], body: ["Sections, panneaux, temps de lecture et ton score sur ce chapitre.", "الأقسام، العلامات، مدة القراءة ونتيجتك في هذا الدرس."] },
          { id: "tabs", title: ["Les quatre onglets", "التبويبات الأربعة"], body: ["**Fiche résumée**, **Mindmap**, **Panneaux** et **Quiz** : quatre façons d'apprendre le même chapitre.", "**الملخص** و**الخريطة الذهنية** و**العلامات** و**الاختبار**: أربع طرق لتعلم الدرس نفسه."] },
          { id: "outline", title: ["Le sommaire", "المحتوى"], body: ["Touche une pastille pour sauter à une partie. Le **!** mène aux astuces, le **×** aux pièges.", "المس علامة للانتقال إلى جزء معين. **!** يقود إلى النصائح و**×** إلى الفخاخ."] },
        ],
      },
      {
        kind: "shot",
        shot: "fiche",
        title: ["La fiche résumée", "الملخص"],
        spots: [
          { id: "section", title: ["Des parties courtes", "أجزاء قصيرة"], body: ["Chaque partie traite une seule idée, avec des images à côté du texte.", "يعالج كل جزء فكرة واحدة، مع صور بجانب النص."] },
          { id: "image", title: ["Les images", "الصور"], body: ["Toutes les images s'agrandissent quand tu les touches.", "كل الصور تكبر عندما تلمسها."] },
        ],
      },
      {
        kind: "demo",
        demo: "zoom",
        title: ["Essaie : agrandis ce panneau", "جرّب: كبّر هذه العلامة"],
        body: ["Touche l'image. Ça marche partout : cours, questions, corrections. Touche à côté pour fermer.", "المس الصورة. يعمل ذلك في كل مكان: الدروس والأسئلة والتصحيحات. المس خارجها للإغلاق."],
      },
      {
        kind: "shot",
        shot: "tips",
        title: ["Astuces et pièges", "النصائح والفخاخ"],
        lead: ["À lire absolument, à la fin de chaque fiche.", "يجب قراءتها في نهاية كل ملخص."],
        spots: [
          { id: "tips", title: ["Astuces du moniteur", "نصائح المدرب"], body: ["Les moyens simples de retenir l'essentiel du chapitre.", "طرق بسيطة لحفظ أساسيات الدرس."] },
          { id: "traps", title: ["Pièges d'examen", "فخاخ الامتحان"], body: ["Les confusions les plus fréquentes dans les questions. Lis-les juste avant de t'entraîner.", "أكثر الالتباسات شيوعا في الأسئلة. اقرأها قبل التمرن مباشرة."] },
        ],
      },
      {
        kind: "shot",
        shot: "mindmap",
        title: ["La Mindmap", "الخريطة الذهنية"],
        lead: ["Tout le chapitre sur une seule carte.", "الدرس كله في خريطة واحدة."],
        spots: [
          { id: "unfold", title: ["Déplier", "فتح الكل"], body: ["Ouvre ou referme toutes les branches d'un coup. Tu peux aussi toucher une branche seule.", "افتح أو أغلق كل الفروع دفعة واحدة. ويمكنك أيضا لمس فرع واحد."] },
          { id: "center", title: ["Recentrer", "إعادة التوسيط"], body: ["Perdu dans la carte ? Ce bouton la replace au centre. Un autre l'affiche en plein écran.", "ضعت في الخريطة ؟ هذا الزر يعيدها إلى الوسط. وزر آخر يعرضها في ملء الشاشة."] },
        ],
      },
      {
        kind: "shot",
        shot: "signs",
        title: ["L'onglet Panneaux", "تبويب العلامات"],
        spots: [
          { id: "search", title: ["Chercher un panneau", "البحث عن علامة"], body: ["Tape un mot pour le retrouver dans le chapitre.", "اكتب كلمة لتجدها في الدرس."] },
          { id: "test", title: ["Me tester", "اختبر نفسي"], body: ["Cache les noms pour transformer la page en cartes de révision.", "أخفِ الأسماء لتتحول الصفحة إلى بطاقات مراجعة."] },
          { id: "card", title: ["Une carte", "بطاقة"], body: ["En mode test, touche-la pour révéler sa signification.", "في وضع الاختبار، المسها لإظهار معناها."] },
        ],
      },
      {
        kind: "demo",
        demo: "reveal",
        title: ["Essaie le mode test", "جرّب وضع الاختبار"],
        body: ["Essaie de deviner, puis touche chaque carte pour vérifier.", "حاول أن تخمّن، ثم المس كل بطاقة للتحقق."],
      },
      {
        kind: "intro",
        pose: "search",
        title: ["Encore trois choses utiles", "ثلاثة أشياء مفيدة أخرى"],
        body: ["Sur la page d'un chapitre, ne manque pas :", "في صفحة الدرس، لا تفوّت:"],
        points: [
          { ic: "schema", t: ["**Les schémas animés** liés au chapitre, sous le contenu.", "**الرسوم المتحركة** المرتبطة بالدرس، أسفل المحتوى."] },
          { ic: "download", t: ["**Les cartes Anki** : un fichier à importer dans une application de révision, pour les chapitres avec des panneaux.", "**بطاقات Anki**: ملف تستورده في تطبيق للمراجعة، للدروس التي بها علامات."] },
          { ic: "stairs", t: ["**Chapitre précédent et suivant**, tout en bas de la page.", "**الدرس السابق والموالي**، في أسفل الصفحة."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 5. S'entraîner ───────────────────────── */
  {
    id: "practice",
    pose: "study",
    title: ["S'entraîner", "التمرن"],
    desc: ["Les modes de questions et la correction détaillée", "أنماط الأسئلة والتصحيح المفصل"],
    steps: [
      {
        kind: "shot",
        shot: "training",
        title: ["Choisir un mode", "اختيار نمط"],
        lead: ["Va dans **Plus**, puis **S'entraîner**.", "اذهب إلى **المزيد** ثم **التمرن**."],
        spots: [
          { id: "mix", title: ["Session du jour", "حصة اليوم"], body: ["Le mode conseillé : 20 questions, avec en priorité ce que tu n'as jamais vu ou que tu rates.", "النمط الموصى به: 20 سؤالا، بالأولوية لما لم تره أو تخطئ فيه."] },
          { id: "official", title: ["Questions officielles", "الأسئلة الرسمية"], body: ["398 questions au format de l'examen, corrigées et expliquées.", "398 سؤالا بصيغة الامتحان، مصححة ومشروحة."] },
          { id: "weak", title: ["Mes points faibles", "نقاط ضعفي"], body: ["Uniquement les questions où tu te trompes le plus souvent.", "فقط الأسئلة التي تخطئ فيها أكثر."] },
          { id: "new", title: ["Jamais vues", "أسئلة جديدة"], body: ["Pour découvrir des questions que tu n'as encore jamais faites.", "لاكتشاف أسئلة لم تجب عنها من قبل."] },
        ],
      },
      {
        kind: "demo",
        demo: "picker",
        title: ["Quel mode choisir ?", "أي نمط تختار ؟"],
        body: ["Touche ta situation, je te dis quoi ouvrir.", "المس وضعيتك وسأخبرك بما يجب فتحه."],
      },
      {
        kind: "shot",
        shot: "quiz",
        title: ["Pendant une session", "أثناء الحصة"],
        spots: [
          { id: "counter", title: ["Où tu en es", "أين وصلت"], body: ["Le numéro de la question, sur le total de la session.", "رقم السؤال من مجموع أسئلة الحصة."] },
          { id: "bar", title: ["L'avancement", "التقدم"], body: ["Ici, pas de points de permis : tu peux aller jusqu'au bout quoi qu'il arrive.", "هنا لا توجد نقط رخصة: يمكنك الوصول إلى النهاية مهما حدث."] },
          { id: "end", title: ["Terminer la session", "إنهاء الحصة"], body: ["Pressé ? Arrête quand tu veux : tes réponses sont déjà enregistrées.", "مستعجل ؟ توقف متى شئت: أجوبتك محفوظة."] },
          { id: "ok", title: ["Valider", "تأكيد"], body: ["La correction s'affiche juste après chaque réponse.", "يظهر التصحيح مباشرة بعد كل جواب."] },
        ],
      },
      {
        kind: "shot",
        shot: "correction",
        title: ["Une correction complète", "تصحيح كامل"],
        lead: ["C'est ici que tu progresses le plus.", "هنا تتقدم أكثر."],
        spots: [
          { id: "answer", title: ["Le résultat", "النتيجة"], body: ["La réponse attendue et l'explication de la règle.", "الجواب المنتظر وشرح القاعدة."] },
          { id: "tip", title: ["À retenir", "للحفظ"], body: ["Une phrase courte pour ne plus te tromper.", "جملة قصيرة حتى لا تخطئ مرة أخرى."] },
          { id: "links", title: ["Comprendre", "الفهم"], body: ["Selon la question : schéma animé, lien vers le cours, **Je veux la revoir** pour la garder dans ton carnet, **Signaler le corrigé** si une réponse te semble fausse.", "حسب السؤال: رسم متحرك، رابط نحو الدرس، **أريد مراجعته** لحفظه في دفترك، **الإبلاغ عن التصحيح** إذا بدا لك الجواب خاطئا."] },
          { id: "next", title: ["Question suivante", "السؤال الموالي"], body: ["Prends le temps de lire avant de continuer.", "خذ وقتك في القراءة قبل المتابعة."] },
        ],
      },
      {
        kind: "shot",
        shot: "results",
        title: ["Le bilan", "الحصيلة"],
        spots: [
          { id: "note", title: ["Ta note", "نقطتك"], body: ["Ton score, le temps passé et le nombre d'erreurs ajoutées au carnet.", "نتيجتك والمدة وعدد الأخطاء المضافة إلى الدفتر."] },
          { id: "again", title: ["Recommencer", "إعادة المحاولة"], body: ["Lance une nouvelle session du même type.", "ابدأ حصة جديدة من النوع نفسه."] },
          { id: "weak", title: ["Chapitres à retravailler", "دروس يجب مراجعتها"], body: ["Les chapitres où se concentrent tes erreurs, avec un lien vers chacun. Plus bas, la correction de chaque question ratée.", "الدروس التي تتركز فيها أخطاؤك مع رابط لكل منها. وفي الأسفل، تصحيح كل سؤال أخطأت فيه."] },
        ],
      },
      {
        kind: "intro",
        pose: "phone",
        title: ["Les autres façons de t'entraîner", "طرق أخرى للتمرن"],
        body: ["Tu as encore d'autres choix sur la page :", "لديك خيارات أخرى في الصفحة:"],
        points: [
          { ic: "list", t: ["**Règles et chiffres** : vitesses, distances, points, amendes, priorités.", "**القواعد والأرقام**: السرعات، المسافات، النقط، الغرامات، الأسبقية."] },
          { ic: "speed90", t: ["**Panneaux et schémas** : reconnaître les panneaux de tous les chapitres.", "**العلامات والرسوم**: التعرف على علامات جميع الدروس."] },
          { ic: "mountain", t: ["**Par axe** : 30 questions mélangées sur un axe complet, en bas de la page.", "**حسب المحور**: 30 سؤالا ممزوجة تشمل محورا كاملا، في أسفل الصفحة."] },
          { ic: "keyboard", t: ["Sur ordinateur : **touches 1 à 4** pour répondre et **Entrée** pour valider.", "على الحاسوب: **المفاتيح من 1 إلى 4** للإجابة و**مفتاح الإدخال** للتأكيد."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 6. Examen blanc ───────────────────────── */
  {
    id: "exam",
    pose: "timer",
    title: ["L'examen blanc", "الامتحان التجريبي"],
    desc: ["Se mettre en conditions réelles", "التدرب في ظروف حقيقية"],
    steps: [
      {
        kind: "shot",
        shot: "exam",
        title: ["Préparer l'examen", "الاستعداد للامتحان"],
        spots: [
          { id: "rules", title: ["Les règles", "القواعد"], body: ["40 questions tirées au hasard, 30 secondes par question. Il faut 32/40.", "40 سؤالا تُختار عشوائيا، 30 ثانية لكل سؤال. يجب الحصول على 32/40."] },
          { id: "start", title: ["Commencer", "ابدأ"], body: ["Installe-toi au calme avant de lancer : l'examen s'enchaîne sans pause.", "اجلس في مكان هادئ قبل البدء: الأسئلة تتوالى بدون توقف."] },
          { id: "settings", title: ["Réglages", "الإعدادات"], body: ["Désactive le chronomètre au début si tu veux prendre ton temps.", "عطّل المؤقت في البداية إذا أردت أن تأخذ وقتك."] },
          { id: "history", title: ["Tes tentatives", "محاولاتك"], body: ["Tes 10 derniers examens, avec la note, la durée et le résultat.", "آخر 10 امتحانات، مع النقطة والمدة والنتيجة."] },
        ],
      },
      {
        kind: "shot",
        shot: "exam-q",
        title: ["Pendant l'examen", "أثناء الامتحان"],
        lead: ["Comme le jour J : pas de correction avant la fin.", "كما في يوم الامتحان: لا تصحيح قبل النهاية."],
        spots: [
          { id: "timer", title: ["Le chrono", "المؤقت"], body: ["Il repart de 30 secondes à chaque question. À zéro, ta réponse est prise telle quelle.", "يعود إلى 30 ثانية مع كل سؤال. عند الصفر، يُعتمد جوابك كما هو."] },
          { id: "image", title: ["L'image officielle", "الصورة الرسمية"], body: ["Touche-la pour l'agrandir si un détail est difficile à voir.", "المسها لتكبيرها إذا صعبت رؤية تفصيل ما."] },
          { id: "boxes", title: ["Les cases", "الخانات"], body: ["Coche une ou plusieurs cases : il peut y avoir plusieurs bonnes réponses.", "اختر خانة واحدة أو أكثر: قد تكون هناك عدة أجوبة صحيحة."] },
          { id: "ok", title: ["Valider et continuer", "تأكيد ومتابعة"], body: ["Impossible de revenir en arrière après avoir validé.", "لا يمكن الرجوع بعد التأكيد."] },
        ],
      },
      {
        kind: "intro",
        pose: "stats",
        title: ["Bien utiliser les examens blancs", "كيف تستفيد من الامتحانات التجريبية"],
        body: ["Le score compte, mais ce que tu fais après compte encore plus.", "النتيجة مهمة، لكن ما تفعله بعدها أهم."],
        points: [
          { ic: "target", t: ["Vise **80 % ou plus de façon régulière** avant de te présenter.", "استهدف **80 % أو أكثر بانتظام** قبل التقدم للامتحان."] },
          { ic: "clock", t: ["La dernière semaine, fais **au moins un examen blanc par jour**.", "في الأسبوع الأخير، اجتز **امتحانا تجريبيا واحدا على الأقل كل يوم**."] },
          { ic: "book", t: ["À la fin, lis la correction de chaque erreur et ouvre les chapitres à retravailler.", "في النهاية، اقرأ تصحيح كل خطأ وافتح الدروس التي يجب مراجعتها."] },
          { ic: "check", t: ["Si tu quittes en cours de route, l'examen n'est pas compté.", "إذا غادرت أثناء الامتحان، فلن يُحتسب."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 7. Mes erreurs ───────────────────────── */
  {
    id: "errors",
    pose: "notes",
    title: ["Mes erreurs", "أخطائي"],
    desc: ["Le carnet qui fait revenir chaque erreur au bon moment", "الدفتر الذي يعيد كل خطأ في الوقت المناسب"],
    steps: [
      {
        kind: "shot",
        shot: "notebook",
        title: ["Ton carnet d'erreurs", "دفتر أخطائك"],
        lead: ["Il se remplit tout seul, à chaque erreur, partout dans l'app.", "يمتلئ تلقائيا مع كل خطأ، في كل مكان من التطبيق."],
        spots: [
          { id: "review", title: ["Réviser maintenant", "راجع الآن"], body: ["Lance les questions à revoir aujourd'hui. Le chiffre indique combien il y en a.", "ابدأ الأسئلة التي يجب مراجعتها اليوم. يبين الرقم عددها."] },
          { id: "reminders", title: ["Tes rappels", "تذكيراتك"], body: ["Les règles que tu oublies le plus, à relire en deux minutes.", "القواعد التي تنساها أكثر، تقرؤها في دقيقتين."] },
          { id: "tabs", title: ["Les boîtes", "العلب"], body: ["À réviser, boîtes 1 à 4 et questions maîtrisées. Fais défiler les onglets pour les voir toutes.", "للمراجعة، العلب من 1 إلى 4 والأسئلة المتقنة. مرر التبويبات لرؤيتها كلها."] },
          { id: "item", title: ["Une question", "سؤال"], body: ["Touche-la pour relire sa correction complète.", "المسه لقراءة تصحيحه الكامل."] },
          { id: "remove", title: ["Retirer", "إزالة"], body: ["La corbeille enlève la question du carnet si tu estimes la connaître.", "تزيل سلة المهملات السؤال من الدفتر إذا رأيت أنك تعرفه."] },
        ],
      },
      {
        kind: "demo",
        demo: "leitner",
        title: ["Comprendre les boîtes", "فهم العلب"],
        body: [
          "Une question ratée entre dans la boîte 1. **Essaie** : réponds juste ou faux et regarde où elle va.",
          "يدخل السؤال الخاطئ إلى العلبة 1. **جرّب**: أجب صحيحا أو خطأ وانظر إلى أين يذهب.",
        ],
      },
    ],
  },

  /* ───────────────────────── 8. Schémas et Mémo ───────────────────────── */
  {
    id: "tools",
    pose: "teacher",
    title: ["Schémas et Mémo", "الرسوم والمذكرة"],
    desc: ["Comprendre en manipulant, retenir les chiffres", "الفهم بالتجربة وحفظ الأرقام"],
    steps: [
      {
        kind: "shot",
        shot: "schemas",
        title: ["Les schémas animés", "الرسوم المتحركة"],
        lead: ["Dans **Plus**, puis **Schémas**.", "في **المزيد** ثم **الرسوم**."],
        spots: [
          { id: "card", title: ["20 situations à manipuler", "20 وضعية للتجربة"], body: ["Priorités, ronds-points, feux, vitesse, sanctions… Comprendre est plus solide qu'apprendre par cœur.", "الأسبقية، المدارات، الأضواء، السرعة، العقوبات… الفهم أقوى من الحفظ عن ظهر قلب."] },
        ],
      },
      {
        kind: "shot",
        shot: "schema-open",
        title: ["Un schéma ouvert", "رسم مفتوح"],
        lead: [
          "Change les réglages et observe le résultat. Les schémas s'ouvrent aussi depuis la correction d'une question ratée : **Comprendre mon erreur**.",
          "غيّر الإعدادات ولاحظ النتيجة. تُفتح الرسوم أيضا من تصحيح سؤال أخطأت فيه: **افهم خطئي**.",
        ],
        spots: [],
      },
      {
        kind: "shot",
        shot: "memo",
        title: ["Le Mémo", "المذكرة"],
        lead: ["Tous les chiffres à connaître, avec un moyen de les retenir.", "كل الأرقام التي يجب معرفتها، مع طريقة لحفظها."],
        spots: [
          { id: "test", title: ["Test éclair", "اختبار سريع"], body: ["6 cartes au hasard pour te tester en 3 minutes.", "6 بطاقات عشوائية لتختبر نفسك في 3 دقائق."] },
          { id: "groups", title: ["Les thèmes", "المواضيع"], body: ["Points, amendes, vitesses, distances, âges… Choisis un thème.", "النقط، الغرامات، السرعات، المسافات، السن… اختر موضوعا."] },
          { id: "answer", title: ["La réponse", "الجواب"], body: ["Le chiffre exact, mis en évidence.", "الرقم بالضبط، بشكل بارز."] },
          { id: "hook", title: ["L'astuce", "الحيلة"], body: ["Un petit « crochet » pour que le chiffre reste dans ta mémoire.", "« خطّاف » صغير ليبقى الرقم في ذاكرتك."] },
        ],
      },
      {
        kind: "demo",
        demo: "flip",
        title: ["Essaie une carte", "جرّب بطاقة"],
        body: ["Réfléchis d'abord, puis touche la carte. Chercher la réponse de tête, c'est ce qui la grave.", "فكّر أولا، ثم المس البطاقة. البحث عن الجواب من ذاكرتك هو ما يرسخه."],
      },
    ],
  },

  /* ───────────────────────── 9. Progrès ───────────────────────── */
  {
    id: "follow",
    pose: "stats",
    title: ["Suivre tes progrès", "تتبع تقدمك"],
    desc: ["Tableau de bord, statistiques, grades et badges", "لوحة القيادة، الإحصائيات، الرتب والشارات"],
    steps: [
      {
        kind: "shot",
        shot: "dashboard",
        title: ["Le tableau de bord", "لوحة القيادة"],
        lead: ["Ce qu'il te reste à faire aujourd'hui, au même endroit.", "ما تبقى لك اليوم، في مكان واحد."],
        spots: [
          { id: "exam", title: ["Ton dernier examen", "آخر امتحان لك"], body: ["Ta dernière note et un accès direct à l'examen blanc.", "آخر نقطة لك ووصول مباشر إلى الامتحان التجريبي."] },
          { id: "resume", title: ["Le prochain cours", "الدرس الموالي"], body: ["Le premier chapitre que tu n'as pas encore marqué comme lu.", "أول درس لم تضع عليه بعد علامة مقروء."] },
          { id: "program", title: ["Ton programme du jour", "برنامجك اليوم"], body: ["Trois listes : les erreurs à réviser, les cours à reprendre et tes points faibles. Plus bas : session du jour, schémas, chapitres utiles et questions fréquentes.", "ثلاث قوائم: الأخطاء للمراجعة، الدروس للمتابعة، ونقاط ضعفك. وفي الأسفل: حصة اليوم، الرسوم، الدروس المفيدة والأسئلة الشائعة."] },
        ],
      },
      {
        kind: "shot",
        shot: "progress",
        title: ["La page Progression", "صفحة التقدم"],
        spots: [
          { id: "stats", title: ["Tes chiffres clés", "أرقامك الأساسية"], body: ["Questions vues, taux de réussite, examens passés et série de jours.", "الأسئلة التي رأيتها، نسبة النجاح، الامتحانات والأيام المتتالية."] },
          { id: "activity", title: ["Ton activité", "نشاطك"], body: ["Une barre par jour sur 30 jours : la régularité se voit ici.", "شريط لكل يوم خلال 30 يوما: هنا يظهر انتظامك."] },
          { id: "axes", title: ["Maîtrise par axe", "الإتقان حسب المحور"], body: ["Bleu : réussi au dernier essai. Orange : vu mais raté.", "الأزرق: صحيح في آخر محاولة. البرتقالي: تمت رؤيته مع الخطأ."] },
          { id: "settings", title: ["Réglages", "الإعدادات"], body: ["Ta langue, ton objectif de questions par jour et la date de ton examen.", "لغتك، هدفك اليومي من الأسئلة وتاريخ امتحانك."] },
          { id: "backup", title: ["Exporter, importer", "تصدير واستيراد"], body: ["Une copie de ta progression en fichier. **Réinitialiser** efface tout, définitivement.", "نسخة من تقدمك في ملف. **إعادة التعيين** تمسح كل شيء نهائيا."] },
        ],
      },
      {
        kind: "shot",
        shot: "profile",
        title: ["Mon profil", "ملفي"],
        spots: [
          { id: "rank", title: ["Ton grade", "رتبتك"], body: ["Il monte avec tes étapes validées, et le bouton **Continuer** te ramène à la route.", "ترتفع مع مراحلك المكتملة، وزر **متابعة** يعيدك إلى الطريق."] },
          { id: "tabs", title: ["Deux onglets", "تبويبان"], body: ["**Mon avancement** pour tes résultats, **Mon compte** pour tes informations.", "**تقدمي** لنتائجك و**حسابي** لمعلوماتك."] },
          { id: "numbers", title: ["Six chiffres", "ستة أرقام"], body: ["XP, série, questions vues, réussite, meilleur examen et jours de révision.", "XP، السلسلة، الأسئلة، النجاح، أفضل امتحان وأيام المراجعة."] },
          { id: "activity", title: ["Et plus bas", "وفي الأسفل"], body: ["Ton activité, tes examens, ton parcours par section, les chapitres à retravailler et tes badges.", "نشاطك، امتحاناتك، مسارك حسب القسم، الدروس للمراجعة وشاراتك."] },
        ],
      },
      {
        kind: "shot",
        shot: "home-cards",
        title: ["Défis, badges et sauvegarde", "التحديات والشارات والحفظ"],
        lead: ["Tout en bas du Parcours sur téléphone.", "في أسفل المسار على الهاتف."],
        spots: [
          { id: "quests", title: ["Les défis du jour", "تحديات اليوم"], body: ["{xp} Gagner 50 XP, {crown} valider 3 étapes, {flame} enchaîner 10 bonnes réponses. Ils se renouvellent chaque jour.", "{xp} اربح 50 نقطة، {crown} أكمل 3 مراحل، {flame} 10 أجوبة صحيحة متتالية. تتجدد كل يوم."] },
          { id: "badges", title: ["Tes badges", "شاراتك"], body: ["9 récompenses à débloquer le long de la route.", "9 مكافآت تفتحها على طول الطريق."] },
          { id: "backup", title: ["Ta sauvegarde", "حفظ تقدمك"], body: ["L'heure de la dernière sauvegarde, avec une copie de secours en fichier.", "وقت آخر حفظ، مع نسخة احتياطية في ملف."] },
        ],
      },
      {
        kind: "demo",
        demo: "badges",
        title: ["Grades et badges", "الرتب والشارات"],
        body: ["**Touche un badge** pour savoir comment l'obtenir.", "**المس شارة** لتعرف كيف تحصل عليها."],
      },
    ],
  },

  /* ───────────────────────── 10. Compte ───────────────────────── */
  {
    id: "account",
    pose: "phone",
    title: ["Ton compte", "حسابك"],
    desc: ["Sauvegarde, appareils et sécurité", "الحفظ والأجهزة والأمان"],
    steps: [
      {
        kind: "intro",
        pose: "hero",
        title: ["Ta progression ne se perd pas", "تقدمك لا يضيع"],
        body: ["Tu n'as rien à faire : tout se sauvegarde tout seul.", "لا شيء عليك فعله: كل شيء يُحفظ تلقائيا."],
        points: [
          { ic: "cloud", t: ["Enregistrée **dans ton compte** quelques secondes après chaque réponse.", "يُحفظ **في حسابك** بعد ثوان من كل جواب."] },
          { ic: "phone", t: ["Connecte-toi sur un autre appareil : **tu retrouves tout**.", "سجّل الدخول من جهاز آخر: **ستجد كل شيء**."] },
          { ic: "clock", t: ["Plus de réseau ? Continue : la sauvegarde repart dès son retour.", "انقطعت الشبكة ؟ واصل: سيعود الحفظ بمجرد عودتها."] },
          { ic: "download", t: ["La **copie de secours** en fichier est facultative.", "**النسخة الاحتياطية** في ملف اختيارية."] },
        ],
      },
      {
        kind: "shot",
        shot: "account",
        title: ["L'onglet Mon compte", "تبويب حسابي"],
        lead: ["Dans **Mon profil**, deuxième onglet.", "في **ملفي**، التبويب الثاني."],
        spots: [
          { id: "save", title: ["Sauvegarder", "حفظ"], body: ["Force une sauvegarde immédiate, par exemple avant de changer de téléphone.", "يفرض حفظا فوريا، مثلا قبل تغيير هاتفك."] },
          { id: "name", title: ["Ton nom", "اسمك"], body: ["Ton prénom ou un pseudo, modifiable à tout moment.", "اسمك الشخصي أو لقب، يمكن تغييره في أي وقت."] },
          { id: "password", title: ["Ton mot de passe", "كلمة مرورك"], body: ["Change-le en donnant l'actuel. Il doit faire au moins 8 caractères.", "غيّرها بإدخال الحالية. يجب أن تتكون من 8 أحرف على الأقل."] },
          { id: "logout", title: ["Se déconnecter", "تسجيل الخروج"], body: ["Ta progression reste dans ton compte. Plus bas, tu peux aussi supprimer définitivement ton compte.", "يبقى تقدمك في حسابك. وفي الأسفل يمكنك أيضا حذف حسابك نهائيا."] },
        ],
      },
    ],
  },

  /* ───────────────────────── 11. Méthode ───────────────────────── */
  {
    id: "plan",
    pose: "trophy",
    title: ["Ta méthode", "طريقتك"],
    desc: ["Comment avancer chaque jour jusqu'au permis", "كيف تتقدم كل يوم حتى تحصل على الرخصة"],
    steps: [
      {
        kind: "demo",
        demo: "day",
        title: ["Une journée type", "يوم نموذجي"],
        body: ["Voici la routine que je te conseille. Coche chaque étape pour t'en souvenir.", "هذا هو الروتين الذي أنصحك به. ضع علامة على كل خطوة لتتذكرها."],
      },
      {
        kind: "intro",
        pose: "directions",
        title: ["Les trois périodes", "المراحل الثلاث"],
        body: ["Avance à ton rythme, mais garde cet ordre :", "تقدم حسب وتيرتك، لكن احتفظ بهذا الترتيب:"],
        points: [
          { ic: "first-step", t: ["**Apprendre** : suis le Parcours chaque jour, et ouvre la fiche dès qu'une notion résiste.", "**التعلم**: اتبع المسار كل يوم، وافتح الملخص كلما صعب عليك مفهوم."] },
          { ic: "walker-gold", t: ["**Consolider** : vide ton carnet d'erreurs et utilise **Mes points faibles** et le Mémo.", "**الترسيخ**: أفرغ دفتر أخطائك واستعمل **نقاط ضعفي** والمذكرة."] },
          { ic: "champion", t: ["**Se tester** : enchaîne les examens blancs jusqu'à dépasser 32/40 de façon régulière, puis monte au Sommet.", "**اختبار النفس**: واصل الامتحانات التجريبية حتى تتجاوز 32/40 بانتظام، ثم اصعد إلى القمة."] },
        ],
      },
      {
        kind: "demo",
        demo: "quiz",
        title: ["Dernier contrôle !", "اختبار أخير !"],
        body: ["Quatre questions pour vérifier que tout est clair.", "أربعة أسئلة للتأكد من أن كل شيء واضح."],
      },
      {
        kind: "intro",
        pose: "trophy",
        title: ["Tu sais tout. En route !", "أنت تعرف كل شيء. إلى الطريق !"],
        body: [
          "Ta première étape t'attend sur le Parcours. Tu peux rouvrir ce guide à tout moment depuis **Plus** ou **Mon profil**.",
          "مرحلتك الأولى تنتظرك في المسار. يمكنك إعادة فتح هذا الدليل في أي وقت من **المزيد** أو **ملفي**.",
        ],
      },
    ],
  },
];
