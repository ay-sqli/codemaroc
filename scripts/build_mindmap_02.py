import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_mindmap_02():
    raw_md_path = os.path.join('outputs', '02_dangers_priorites.md')
    struct_html_path = os.path.join('outputs', 'structures', 'structure_02.html')
    if not os.path.exists(struct_html_path):
        struct_html_path = os.path.join('outputs', 'structure_02.html')

    out_html_path = os.path.join('outputs', 'mindmap_02_finale.html')

    with open(raw_md_path, 'r', encoding='utf-8') as f:
        raw_lines = f.readlines()

    # Extract mapping: normalized_text -> img_src
    image_map = {}
    for line in raw_lines:
        match = re.search(r'<img\s+src="([^"]+)"[^>]*>\s*\*\*([^*]+)\*\*', line)
        if match:
            img_src = match.group(1)
            text = match.group(2).strip()
            norm_key = re.sub(r'\s+', '', text)
            if norm_key not in image_map:
                image_map[norm_key] = img_src

    with open(struct_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    def replace_item(match):
        full_match = match.group(0)
        text = match.group(1).strip()
        norm_key = re.sub(r'\s+', '', text)
        
        # Try exact match first, then fuzzy match
        img_src = image_map.get(norm_key)
        if not img_src:
            for k, src in image_map.items():
                if k in norm_key or norm_key in k:
                    img_src = src
                    break
                    
        if img_src:
            return f'- <img src="{img_src}" height="35"> **{text}**'
        else:
            return full_match

    updated_html = re.sub(r'-\s*\*\*([^*]+)\*\*', replace_item, html_content)

    # CSS fixes for Markmap SVG nodes
    custom_css = """
        /* Anti-truncation CSS for Markmap nodes */
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

    updated_html = updated_html.replace('maxWidth: 350', 'maxWidth: 0')
    updated_html = updated_html.replace('maxWidth: 300', 'maxWidth: 0')

    old_create = "Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0 }, root);"
    new_create = """const mm = Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0 }, root);
            setTimeout(() => { if (mm && mm.fit) mm.fit(); }, 300);
            document.querySelectorAll('#mindmap img').forEach(img => {
                img.addEventListener('load', () => { if (mm && mm.fit) mm.fit(); });
            });"""

    updated_html = updated_html.replace("Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 350 }, root);", new_create)
    updated_html = updated_html.replace("Markmap.create('#mindmap', { embedAssets: true, duration: 300, maxWidth: 0 }, root);", new_create)

    with open(out_html_path, 'w', encoding='utf-8') as f:
        f.write(updated_html)

    print("✅ outputs/mindmap_02_finale.html généré avec succès !")

if __name__ == "__main__":
    build_mindmap_02()
