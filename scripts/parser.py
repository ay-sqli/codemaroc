import os
import sys
import csv
from bs4 import BeautifulSoup

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def generer_fichiers_narsa(dossier_entree, dossier_sortie):
    """
    Extrait les panneaux et textes des cours HTML dans dossier_entree
    et génère pour chaque sous-module :
      1. Un fichier [nom_module].md (pour Markmap / mindmaps)
      2. Un fichier [nom_module].csv (pour Anki / flashcards, séparateur ;)
    """
    if not os.path.exists(dossier_sortie):
        os.makedirs(dossier_sortie, exist_ok=True)

    if not os.path.exists(dossier_entree):
        print(f"⚠️ Le dossier d'entrée n'existe pas : {dossier_entree}")
        return

    # Parcourir les dossiers de cours
    elements = sorted(os.listdir(dossier_entree))
    for nom_dossier in elements:
        chemin_dossier = os.path.join(dossier_entree, nom_dossier)
        if not os.path.isdir(chemin_dossier): 
            continue
            
        fichiers_html = [f for f in os.listdir(chemin_dossier) if f.endswith('.html')]
        if not fichiers_html: 
            # Dossier vide ou sans cours HTML, on passe silencieusement
            continue
        
        fichier_html = fichiers_html[0]
        chemin_html = os.path.join(chemin_dossier, fichier_html)
        
        with open(chemin_html, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')

        titre_tag = soup.find('h4', class_='text-center m-0')
        titre = titre_tag.text.strip() if titre_tag else nom_dossier
        
        markdown_content = f"# 🚦 {titre}\n\n"
        cartes_csv = []  # Paires (balise_image, texte_reponse) pour Anki

        tables = soup.find_all('table')
        
        for table in tables:
            grille = []
            lignes = table.find_all('tr')
            for ligne in lignes:
                row_data = []
                cellules = ligne.find_all(['td', 'th'])
                for cellule in cellules:
                    img = cellule.find('img')
                    # Nettoyage du texte (suppression de 'الدارجة' et espaces superflus)
                    texte = cellule.get_text(separator=" ", strip=True).replace("الدارجة", "").strip()
                    texte = " ".join(texte.split())
                    # Ignorer les textes trop courts (<=3) ou trop longs (>150)
                    row_data.append({
                        'img': img['src'] if img and img.has_attr('src') else None,
                        'texte': texte if (3 < len(texte) <= 150) else None
                    })
                grille.append(row_data)

            # Recherche contextuelle dans la grille (case actuelle, gauche, dessous, droite)
            for r in range(len(grille)):
                for c in range(len(grille[r])):
                    cellule = grille[r][c]
                    
                    if cellule['img']:
                        chemin_image = cellule['img']
                        texte_trouve = None
                        
                        # 1. Dans la même case
                        if cellule['texte']:
                            texte_trouve = cellule['texte']
                            cellule['texte'] = None
                        
                        # 2. Case précédente (gauche dans le DOM, typique RTL)
                        elif c > 0 and grille[r][c-1]['texte']:
                            texte_trouve = grille[r][c-1]['texte']
                            grille[r][c-1]['texte'] = None
                            
                        # 3. Case en dessous
                        elif r + 1 < len(grille) and c < len(grille[r+1]) and grille[r+1][c]['texte']:
                            texte_trouve = grille[r+1][c]['texte']
                            grille[r+1][c]['texte'] = None
                            
                        # 4. Case suivante
                        elif c + 1 < len(grille[r]) and grille[r][c+1]['texte']:
                            texte_trouve = grille[r][c+1]['texte']
                            grille[r][c+1]['texte'] = None

                        if texte_trouve:
                            # Calcul dynamique et propre du chemin relatif vers l'image depuis outputs/
                            img_clean = chemin_image.replace('\\', '/')
                            if img_clean.startswith('./'):
                                img_clean = img_clean[2:]
                            chemin_img_abs = os.path.abspath(os.path.join(chemin_dossier, img_clean))
                            chemin_relatif = os.path.relpath(chemin_img_abs, dossier_sortie).replace('\\', '/')
                            
                            # 1. Format Markdown (avec taille calibrée pour Markmap)
                            markdown_content += f"- <img src=\"{chemin_relatif}\" height=\"50\"> **{texte_trouve}**\n"
                            
                            # 2. Format CSV Anki (balise HTML image locale ; texte réponse)
                            balise_img_html = f'<img src="{chemin_relatif}">'
                            cartes_csv.append((balise_img_html, texte_trouve))

        # 1. Fichier Markdown (.md)
        chemin_sortie_md = os.path.join(dossier_sortie, f"{nom_dossier}.md")
        with open(chemin_sortie_md, 'w', encoding='utf-8') as f_md:
            f_md.write(markdown_content)

        # 2. Fichier CSV (.csv) pour Anki (séparateur ;, UTF-8)
        chemin_sortie_csv = os.path.join(dossier_sortie, f"{nom_dossier}.csv")
        with open(chemin_sortie_csv, 'w', encoding='utf-8', newline='') as f_csv:
            writer = csv.writer(f_csv, delimiter=';', quoting=csv.QUOTE_MINIMAL)
            for balise_img, reponse in cartes_csv:
                writer.writerow([balise_img, reponse])
            
        print(f"✅ {nom_dossier}.md et {nom_dossier}.csv générés ({len(cartes_csv)} cartes Anki extraites).")


# Alias pour rétrocompatibilité
generer_markdown_narsa = generer_fichiers_narsa


if __name__ == "__main__":
    # Détection dynamique de la racine du projet
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if not os.path.exists(os.path.join(base_dir, "inputs")) and os.path.exists(os.path.join(base_dir, "..", "inputs")):
        base_dir = os.path.abspath(os.path.join(base_dir, ".."))

    # Support d'un argument optionnel (ex: python scripts/parser.py 02_regles_circulation)
    if len(sys.argv) > 1:
        cible = sys.argv[1]
        if os.path.isabs(cible):
            dossier_inputs = cible
        elif os.path.exists(os.path.join(base_dir, "inputs", cible)):
            dossier_inputs = os.path.join(base_dir, "inputs", cible)
        else:
            dossier_inputs = os.path.join(base_dir, cible)
    else:
        # Par défaut : cible le macro-module 01_la_route
        dossier_inputs = os.path.join(base_dir, "inputs", "01_la_route")

    dossier_outputs = os.path.join(base_dir, "outputs")
    print(f"📂 Analyse du dossier : {dossier_inputs}")
    generer_fichiers_narsa(dossier_inputs, dossier_outputs)