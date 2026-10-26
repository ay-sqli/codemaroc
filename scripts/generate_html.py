import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def create_mindmap_html():
    md_path = os.path.join('outputs', '01_signalisation_verticale.md')
    html_path = os.path.join('outputs', 'mindmap_01.html')

    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    json_md = json.dumps(md_content, ensure_ascii=False)

    html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carte Mentale - Signalisation Verticale</title>
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    html, body {{
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #ffffff;
    }}
    #mindmap {{
      width: 100vw;
      height: 100vh;
      display: block;
    }}
    .markmap-node foreignObject {{
      overflow: visible !important;
    }}
    .markmap-node foreignObject > div {{
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
    }}
    .markmap-node img {{
      vertical-align: middle;
      border-radius: 4px;
      height: 40px !important;
      width: auto !important;
      display: inline-block !important;
    }}
  </style>

  <!-- Scripts CDN Markmap -->
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-lib"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-view"></script>
</head>
<body>
  <svg id="mindmap"></svg>

  <script>
    window.addEventListener('DOMContentLoaded', () => {{
      const markdownContent = {json_md};

      const {{ Transformer }} = window.markmap;
      const {{ Markmap }} = window.markmap;

      const transformer = new Transformer();
      const {{ root }} = transformer.transform(markdownContent);

      const mm = Markmap.create('#mindmap', {{
        embedAssets: true,
        duration: 300,
        maxWidth: 0
      }}, root);

      setTimeout(() => {{
        if (mm && mm.fit) mm.fit();
      }}, 300);

      document.querySelectorAll('#mindmap img').forEach(img => {{
        img.addEventListener('load', () => {{
          if (mm && mm.fit) mm.fit();
        }});
      }});
    }});
  </script>

</body>
</html>
"""

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("✅ outputs/mindmap_01.html généré avec succès !")

if __name__ == "__main__":
    create_mindmap_html()
