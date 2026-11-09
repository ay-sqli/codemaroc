"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, BellRing, Download, Search, Target } from "lucide-react";
import {
  Accordion, ActionCard, Badge, Breadcrumbs, Button, ButtonLink, Callout, ChapterCover, Checkbox, Chip, ChoiceOption, CountDot, EmptyState, Field,
  GradientBanner, HeroBanner, Input, LightBanner, ListItem, Modal, ModuleIcon, MODULE_ICONS, PageHeader, Panel, PillTabs, ProductCard, ProgressBar,
  ProgressRing, SearchField, SectionHeader, Segmented, Skeleton, Stat, StatBanner, Switch, Tabs,
} from "@/components/ui";

const COLORS: [string, string, string][] = [
  ["Primaire", "#0056d2", "Actions, liens, sélection"],
  ["Primaire survol", "#00419e", "Survol des boutons primaires"],
  ["Bleu 50", "#f0f6ff", "Fonds de sélection, en-têtes"],
  ["Panneau", "#f2f5fa", "Conteneurs de listes"],
  ["Texte", "#1f1f1f", "Titres et texte principal"],
  ["Texte secondaire", "#5b6780", "Descriptions, méta-données"],
  ["Bordure", "#dae1ed", "Cartes, séparateurs"],
  ["Succès", "#1f8354", "Bonne réponse, réussite"],
  ["Erreur", "#d30001", "Mauvaise réponse, alerte"],
  ["Avertissement", "#8a5300", "Astuces, pièges"],
  ["Bleu nuit", "#002761", "Bandeau chiffre clé"],
  ["Pied de page", "#f5f7f8", "Fond du pied de page"],
];

function Block({ id, title, desc, children }: { id: string; title: string; desc?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t-2 border-line pt-10">
      <h2 className="t-h2">{title}</h2>
      {desc && <p className="mt-1 max-w-3xl text-[15px] text-muted">{desc}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b-2 border-line py-5 last:border-b-0 md:grid-cols-[200px_1fr] md:items-center">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const NAV = [
  ["fondations", "Fondations"],
  ["typo", "Typographie"],
  ["boutons", "Boutons"],
  ["etiquettes", "Étiquettes et puces"],
  ["formulaires", "Formulaires"],
  ["navigation", "Navigation"],
  ["cartes", "Cartes"],
  ["bandeaux", "Bandeaux"],
  ["retours", "Retours et états"],
  ["quiz", "Quiz"],
];

export function Showcase() {
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const [pill, setPill] = useState("01");
  const [seg, setSeg] = useState<"x" | "y">("x");
  const [check, setCheck] = useState(true);
  const [sw, setSw] = useState(true);
  const [choice, setChoice] = useState<number[]>([1]);
  const [modal, setModal] = useState(false);

  return (
    <div className="space-y-10">
      <PageHeader
        overline="Documentation"
        title="Design system Code Maroc"
        desc="Les fondations et les composants utilisés dans toute l'application. Une seule couleur d'action (bleu), des bordures fines, des rayons de 8 px, la police Source Sans 3 et aucun emoji : l'interface doit rester sobre et lisible pour se concentrer sur le contenu."
      />

      <nav className="no-scrollbar sticky top-[68px] z-20 -mx-1 flex gap-2 overflow-x-auto bg-white px-1 py-2">
        {NAV.map(([id, l]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full border-2 border-line px-3 py-1 text-sm text-ink-2 hover:border-brand hover:text-brand">
            {l}
          </a>
        ))}
      </nav>

      <Block id="fondations" title="Fondations" desc="Couleurs sémantiques, rayons, ombres et icônes. Les composants n'utilisent que ces valeurs.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COLORS.map(([n, hex, use]) => (
            <div key={hex} className="overflow-hidden rounded-[16px] border-2 border-line">
              <div className="h-16 border-b-2 border-line" style={{ background: hex }} />
              <div className="p-3">
                <p className="text-sm font-semibold">{n}</p>
                <p className="font-mono text-xs text-muted">{hex}</p>
                <p className="mt-1 text-xs text-muted">{use}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[16px] border-2 border-line p-4">
            <p className="mb-3 text-sm font-semibold">Rayons</p>
            <div className="flex items-end gap-4">
              {[["4 px", "rounded-[12px]", "Boutons, champs"], ["8 px", "rounded-[16px]", "Cartes"], ["12 px", "rounded-[12px]", "Bandeaux"]].map(([l, c, u]) => (
                <div key={l} className="text-center">
                  <div className={`size-14 border-2 border-brand bg-brand-50 ${c}`} />
                  <p className="mt-1 text-xs font-semibold">{l}</p>
                  <p className="text-[11px] text-muted">{u}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border-2 border-line p-4">
            <p className="mb-3 text-sm font-semibold">Élévation</p>
            <div className="flex gap-4">
              {[["Repos", "shadow-sm"], ["Survol", "shadow-md"], ["Dialogue", "shadow-lg"]].map(([l, c]) => (
                <div key={l} className={`grid h-14 flex-1 place-items-center rounded-[16px] bg-white text-xs ${c}`}>
                  {l}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border-2 border-line p-4">
            <p className="mb-3 text-sm font-semibold">Icônes des axes (Lucide, trait 2 px)</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(MODULE_ICONS).map(([id, m]) => (
                <span key={id} className="inline-flex items-center gap-2 text-xs text-ink-2">
                  <ModuleIcon id={id} size="md" /> {m.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Block>

      <Block id="typo" title="Typographie" desc="Source Sans 3 pour le latin, Noto Sans Arabic pour l'arabe. Graisses : 400 (texte), 600 (titres, boutons), 700 (logo).">
        <div className="rounded-[16px] border-2 border-line px-5">
          <Spec label="Display · 40/46 · 600">
            <p className="t-display">Prépare ton code en confiance</p>
          </Spec>
          <Spec label="H1 · 34/40 · 600">
            <p className="t-h1">Règles de priorité</p>
          </Spec>
          <Spec label="H2 · 24/30 · 600">
            <p className="t-h2">Les panneaux de danger</p>
          </Spec>
          <Spec label="H3 · 20/26 · 600">
            <p className="t-h3">Ton programme du jour</p>
          </Spec>
          <Spec label="H4 · 16/22 · 600">
            <p className="t-h4">Chapitres à retravailler</p>
          </Spec>
          <Spec label="Corps · 16/24 · 400">
            <p className="t-body max-w-xl">Pour tourner à gauche, je dois céder le passage aux véhicules qui arrivent en sens inverse.</p>
          </Spec>
          <Spec label="Petit · 14/20 · 400">
            <p className="t-small text-muted">Fiche · 8 sections · 6 min · 33 panneaux</p>
          </Spec>
          <Spec label="Surtitre · 12 · 600 · capitales">
            <p className="t-overline">Schéma interactif</p>
          </Spec>
          <Spec label="Arabe · Noto Sans Arabic">
            <p className="ar text-xl">علامات الخطر والأسبقية</p>
          </Spec>
          <Spec label="Lien">
            <a className="link" href="#typo">
              Tout voir
            </a>
          </Spec>
        </div>
      </Block>

      <Block id="boutons" title="Boutons" desc="Un seul bouton primaire par zone. Le secondaire (contour bleu) accompagne, le tertiaire sert aux actions de moindre importance.">
        <div className="rounded-[16px] border-2 border-line px-5">
          <Spec label="Variantes">
            <Button>Primaire</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="tertiary">Tertiaire</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="danger">Danger</Button>
            <span className="rounded-[12px] bg-[#1f1f1f] p-2">
              <Button variant="inverse">Inversé</Button>
            </span>
          </Spec>
          <Spec label="Tailles">
            <Button size="sm">Petit · 32</Button>
            <Button size="md">Moyen · 40</Button>
            <Button size="lg">Grand · 48</Button>
          </Spec>
          <Spec label="Avec icône">
            <Button icon={<Download className="size-4" />}>Exporter</Button>
            <ButtonLink href="#boutons" variant="secondary" iconEnd={<ArrowRight className="size-4" />}>
              Continuer
            </ButtonLink>
            <Button disabled>Désactivé</Button>
          </Spec>
        </div>
      </Block>

      <Block id="etiquettes" title="Étiquettes et puces">
        <div className="rounded-[16px] border-2 border-line px-5">
          <Spec label="Badge">
            <Badge>Neutre</Badge>
            <Badge tone="brand">Recommandé</Badge>
            <Badge tone="success">Lu</Badge>
            <Badge tone="warning">Avec réserve</Badge>
            <Badge tone="error">3 erreurs</Badge>
            <Badge tone="dark">Nouveau</Badge>
          </Spec>
          <Spec label="Compteur">
            <span className="inline-flex items-center gap-2 text-sm">
              Mes erreurs <CountDot n={12} />
            </span>
          </Spec>
          <Spec label="Puce (filtre)">
            <Chip icon={<ModuleIcon id="01" size="xs" />}>La route</Chip>
            <Chip selected>Sélectionnée</Chip>
            <Chip icon={<Target className="size-4 text-brand" />}>Avec icône</Chip>
          </Spec>
        </div>
      </Block>

      <Block id="formulaires" title="Formulaires">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-[16px] border-2 border-line p-5">
            <Field label="Adresse e-mail" required hint="Message d'aide sous le champ.">
              <Input placeholder="nom@email.com" />
            </Field>
            <SearchField placeholder="Que veux-tu réviser ?" />
          </div>
          <div className="space-y-1 rounded-[16px] border-2 border-line p-5">
            <Checkbox checked={check} onChange={setCheck} label="Case à cocher" count={16} />
            <Switch checked={sw} onChange={setSw} label="Interrupteur" />
            <div className="pt-3">
              <Segmented options={[{ id: "x", label: "Route sèche" }, { id: "y", label: "Route mouillée" }]} value={seg} onChange={setSeg} />
            </div>
          </div>
        </div>
      </Block>

      <Block id="navigation" title="Navigation">
        <div className="space-y-6 rounded-[16px] border-2 border-line p-5">
          <Breadcrumbs items={[{ label: "Cours", href: "#navigation" }, { label: "La route", href: "#navigation" }, { label: "Chapitre 3" }]} />
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: "a", label: "Fiche résumée" },
              { id: "b", label: "Mindmap" },
              { id: "c", label: "À réviser", count: 4 },
            ]}
          />
          <PillTabs items={["01", "02", "03"].map((id) => ({ id, label: MODULE_ICONS[id].label }))} value={pill} onChange={setPill} />
          <SectionHeader title="Titre de section" desc="Description courte de la section." href="#navigation" />
        </div>
      </Block>

      <Block id="cartes" title="Cartes" desc="Carte produit (catalogue), ligne de liste dans un panneau, carte d'action et tuile de chiffre.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid grid-cols-2 gap-4">
            <ProductCard
              href="#cartes"
              media={<ChapterCover module="01" />}
              eyebrow={<><ModuleIcon id="01" size="xs" /> La route · Chapitre 2</>}
              title="Signaux de danger et de priorité"
              subtitle="علامات الخطر والأسبقية"
              meta="Fiche · 9 sections · 7 min"
            />
            <ProductCard href="#cartes" media={<ChapterCover module="02" />} eyebrow={<><ModuleIcon id="02" size="xs" /> Règles</>} title="Règles de priorité" meta={<Badge tone="brand">Prioritaire</Badge>} />
          </div>
          <Panel title="Panneau de liste" href="#cartes">
            <ListItem href="#cartes" thumb={<ChapterCover compact module="03" />} eyebrow="Le conducteur" title="Alcool et médicaments" meta="2 erreurs à revoir" />
            <ListItem href="#cartes" thumb={<ChapterCover compact module="05" />} eyebrow="Infractions" title="Permis à points" meta="Fiche · Mindmap" />
          </Panel>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ActionCard href="#cartes" title="Carte d'action" desc="Lien vers une tâche" icon={<BellRing className="size-9" strokeWidth={1.5} />} />
          <Stat label="Questions vues" value="214" hint="sur 1 520" />
          <Stat label="Réussite" value="84 %" tone="ok" />
        </div>
      </Block>

      <Block id="bandeaux" title="Bandeaux">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <HeroBanner title="Bandeau principal" desc="Fond sombre, une action inversée." actions={<Button variant="inverse">Action</Button>} />
            <LightBanner overline="Surtitre" title="Bandeau clair" desc="Pour la reprise d'une activité." actions={<Button>Reprendre</Button>} />
          </div>
          <GradientBanner>
            <p className="text-lg font-semibold">Bandeau dégradé (bleu → vert) pour mettre en avant un programme</p>
          </GradientBanner>
          <StatBanner title="Bandeau chiffre clé" desc="Une seule donnée forte." value="80 %" />
        </div>
      </Block>

      <Block id="retours" title="Retours et états">
        <div className="grid gap-4 md:grid-cols-2">
          <Callout tone="info" title="Information">Message neutre pour guider.</Callout>
          <Callout tone="success" title="Bonne réponse">Feedback positif.</Callout>
          <Callout tone="warning" title="Attention">Point de vigilance.</Callout>
          <Callout tone="error" title="Réponse incorrecte">Feedback d&apos;erreur.</Callout>
        </div>
        <div className="mt-6 grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <ProgressBar value={64} />
            <ProgressBar value={80} tone="ok" />
            <ProgressBar value={30} tone="ko" size="sm" />
            <Skeleton className="h-10" />
          </div>
          <ProgressRing pct={85} tone="ok">
            <span className="text-2xl font-semibold">85 %</span>
          </ProgressRing>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <EmptyState icon={<Search className="size-6" />} title="État vide" desc="Explique pourquoi il n'y a rien et propose une action." action={<Button variant="secondary">Action</Button>} />
          <div>
            <Accordion
              items={[
                { q: "Question d'accordéon", a: "Réponse détaillée affichée au clic." },
                { q: "Deuxième question", a: "Une seule colonne, séparateurs fins." },
              ]}
            />
            <Button variant="secondary" className="mt-4" onClick={() => setModal(true)}>
              Ouvrir une fenêtre modale
            </Button>
            <Modal open={modal} onClose={() => setModal(false)} overline="Exemple" title="Fenêtre modale" desc="Fermeture avec Échap, le fond ou la croix." size="sm">
              <p className="text-[15px] text-ink-2">Contenu de la fenêtre.</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="tertiary" onClick={() => setModal(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setModal(false)}>Confirmer</Button>
              </div>
            </Modal>
          </div>
        </div>
      </Block>

      <Block id="quiz" title="Quiz" desc="Option de réponse : sélection, bonne réponse, erreur et réponse manquée.">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2.5">
            {["Céder le passage à droite", "Passer en premier", "S'arrêter obligatoirement"].map((l, k) => (
              <ChoiceOption
                key={k}
                index={k}
                multi
                selected={choice.includes(k)}
                onClick={() => setChoice((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))}
              >
                {l}
              </ChoiceOption>
            ))}
          </div>
          <div className="space-y-2.5">
            <ChoiceOption index={0} multi={false} selected state="correct" onClick={() => {}} disabled>
              Bonne réponse
            </ChoiceOption>
            <ChoiceOption index={1} multi={false} selected state="wrong" onClick={() => {}} disabled>
              Réponse choisie mais fausse
            </ChoiceOption>
            <ChoiceOption index={2} multi selected={false} state="missed" onClick={() => {}} disabled>
              Réponse attendue non cochée
            </ChoiceOption>
          </div>
        </div>
      </Block>
    </div>
  );
}
