import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_mindmap_03():
    raw_md_path = os.path.join('outputs', '03_interdictions.md')
    struct_html_path = os.path.join('outputs', 'structure_03.html')
    out_html_path = os.path.join('outputs', 'mindmap_03_finale.html')

    with open(raw_md_path, 'r', encoding='utf-8') as f:
        raw_lines = f.readlines()

    # Extraire les paires (texte, image_src) dans l'ordre d'apparition
    image_list = []
    image_map = {}
    vitesse_list = []      # Pour تحديد السرعة (20, 30, 40, 60, 80, 100, 120)
    fin_vitesse_list = []  # Pour نهاية تحديد السرعة (20, 40, 60, 80, 100)

    for line in raw_lines:
        match = re.search(r'<img\s+src="([^"]+)"[^>]*>\s*\*\*([^*]+)\*\*', line)
        if match:
            img_src = match.group(1)
            text = match.group(2).strip()
            norm_key = re.sub(r'\s+', '', text)
            image_list.append((norm_key, text, img_src))
            
            if 'نهايةتحديدالسرعة' in norm_key:
                fin_vitesse_list.append(img_src)
            elif 'تحديدالسرعة' in norm_key:
                vitesse_list.append(img_src)
            else:
                if norm_key not in image_map:
                    image_map[norm_key] = img_src

    # Ordre officiel des vitesses dans le cours Perminou
    vitesses_ordre = ['20', '30', '40', '60', '80', '100', '120']
    vitesse_map = {vitesses_ordre[i]: vitesse_list[i] for i in range(min(len(vitesses_ordre), len(vitesse_list)))}

    fin_vitesses_ordre = ['20', '40', '60', '80', '100']
    fin_vitesse_map = {fin_vitesses_ordre[i]: fin_vitesse_list[i] for i in range(min(len(fin_vitesses_ordre), len(fin_vitesse_list)))}

    with open(struct_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    matched_count = 0
    total_count = 0
    unmatched_list = []

    def replace_item(match):
        nonlocal matched_count, total_count
        total_count += 1
        full_match = match.group(0)
        text = match.group(1).strip()
        norm_key = re.sub(r'\s+', '', text)
        
        img_src = None

        # 1. Gestion des vitesses spécifiques
        if 'تحديد السرعة' in text:
            m_num = re.search(r'\d+', text)
            if m_num:
                num = m_num.group(0)
                if 'نهاية' in text:
                    img_src = fin_vitesse_map.get(num)
                else:
                    img_src = vitesse_map.get(num)

        # 2. Correspondance exacte
        if not img_src:
            img_src = image_map.get(norm_key)
        
        # 3. Normalisation sans 'ذات' (ex: نهاية منطقة ذات التوقف ...)
        if not img_src:
            norm_without_that = norm_key.replace('ذات', '')
            for k, orig_t, src in image_list:
                k_clean = k.replace('ذات', '')
                if norm_without_that == k_clean:
                    img_src = src
                    break

        # 4. Correspondance floue / sous-chaîne
        if not img_src:
            for k, orig_t, src in image_list:
                if norm_key in k or k in norm_key:
                    img_src = src
                    break

        if img_src:
            matched_count += 1
            return f'- <img src="{img_src}" height="35"> **{text}**'
        else:
            unmatched_list.append(text)
            return full_match

    updated_html = re.sub(r'-\s*\*\*([^*]+)\*\*', replace_item, html_content)

    # Styles anti-troncature et esthétique Markmap
    custom_css = """
        /* CSS anti-troncature et affichage optimal des noeuds Markmap */
        .markmap-node foreignObject {
            overflow: visible !important;
        }
        .markmap-node foreignObject > div {
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }
        .markmap-node img {
            vertical-align: middle;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 2px;
            height: 35px !important;
            width: auto !important;
            display: inline-block !important;
        }
        /* Floating Home Button (Top Left) */
        .btn-home {
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 9999;
            background: linear-gradient(135deg, #0056a4, #003d7a);
            color: #ffffff;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 0.85rem;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(0, 86, 164, 0.3);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(5px);
            font-family: system-ui, -apple-system, sans-serif;
        }
        .btn-home:hover {
            background: linear-gradient(135deg, #ff7e00, #e67000);
            box-shadow: 0 6px 18px rgba(255, 126, 0, 0.4);
            transform: translateY(-2px) scale(1.03);
            color: #ffffff;
        }
        .btn-home svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
    """
    if '.markmap-node foreignObject' not in updated_html:
        updated_html = updated_html.replace('</style>', custom_css + '\n    </style>')

    btn_home_html = """    <a href="../index.html" class="btn-home" title="العودة إلى لوحة التحكم">
        <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        <span>الرئيسية</span>
    </a>\n"""
    if 'class="btn-home"' not in updated_html:
        updated_html = updated_html.replace('<body>', '<body>\n' + btn_home_html)

    # Remplacer les contraintes de largeur par maxWidth: 0 pour éviter tout rognage
    updated_html = updated_html.replace('maxWidth: 350', 'maxWidth: 0')
    updated_html = updated_html.replace('maxWidth: 300', 'maxWidth: 0')

    # Ajustement automatique du cadrage Markmap au chargement dynamique des images
    new_create = """const mm = Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0 }, root);
            setTimeout(() => { if (mm && mm.fit) mm.fit(); }, 300);
            document.querySelectorAll('#mindmap img').forEach(img => {
                img.addEventListener('load', () => { if (mm && mm.fit) mm.fit(); });
            });"""

    updated_html = updated_html.replace("Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 350 }, root);", new_create)
    updated_html = updated_html.replace("Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0 }, root);", new_create)

    with open(out_html_path, 'w', encoding='utf-8') as f:
        f.write(updated_html)

    print(f"✅ outputs/mindmap_03_finale.html généré avec succès ! ({matched_count}/{total_count} panneaux matchés)")
    if unmatched_list:
        print(f"⚠️ {len(unmatched_list)} éléments non matchés :")
        for u in unmatched_list:
            print(f"  - {u}")

if __name__ == "__main__":
    build_mindmap_03()
