#!/usr/bin/env python3
"""Make a branded 1200x630 header image for a blog post when no photo fits.

Usage (from the repo root):
  python3 tools/blog/title_card.py "Post Title Here" images/blog/<slug>.jpg
"""
import os, sys, html, tempfile
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

def make(title, out):
    fonts = os.path.join(HERE, 'fonts')
    logo = os.path.join(ROOT, 'images', 'kwb-logo.png')
    size = 96 if len(title) <= 40 else 80 if len(title) <= 65 else 64
    page = f"""<!DOCTYPE html><html><head><style>
@font-face {{ font-family: Squada; src: url('file://{fonts}/SquadaOne-Regular.ttf'); }}
@font-face {{ font-family: Poppins; font-weight: 600; src: url('file://{fonts}/Poppins-SemiBold.ttf'); }}
html,body {{ margin:0; width:1200px; height:630px; overflow:hidden; }}
body {{ background:#0b0b0b; color:#fff; position:relative; font-family:Poppins, sans-serif; }}
.streaks {{ position:absolute; inset:0; background:
  repeating-linear-gradient(115deg, rgba(255,255,255,.035) 0 2px, transparent 2px 38px),
  radial-gradient(circle at 85% 20%, rgba(200,30,58,.35), transparent 45%),
  radial-gradient(circle at 10% 90%, rgba(40,120,255,.18), transparent 40%); }}
.wave {{ position:absolute; left:0; right:0; bottom:0; height:14px;
  background:linear-gradient(90deg,#e0263c,#f28c28,#f5d020,#3cc36b,#2f8cf0,#8a4dff); }}
.label {{ position:absolute; left:80px; top:78px; font-size:22px; letter-spacing:4px; color:#c81e3a; text-transform:uppercase; }}
h1 {{ position:absolute; left:80px; right:80px; top:130px; margin:0; font-family:Squada, sans-serif; font-weight:400;
  font-size:{size}px; line-height:1.05; text-transform:uppercase; letter-spacing:1px; }}
.logo {{ position:absolute; right:70px; bottom:48px; height:96px; }}
.site {{ position:absolute; left:80px; bottom:60px; font-size:22px; color:#bbb; }}
</style></head><body><div class="streaks"></div>
<div class="label">KWB Media Blog</div><h1>{html.escape(title)}</h1>
<div class="site">kwbmedia.com</div><img class="logo" src="file://{logo}"><div class="wave"></div></body></html>"""
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as f:
        f.write(page); tmp = f.name
    png = out + '.png'
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
        pg.goto('file://' + tmp); pg.wait_for_timeout(400)
        pg.screenshot(path=png); b.close()
    from PIL import Image
    Image.open(png).convert('RGB').save(out, quality=88, optimize=True)
    os.remove(png); os.remove(tmp)
    print('wrote', out)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    os.makedirs(os.path.dirname(os.path.abspath(sys.argv[2])), exist_ok=True)
    make(sys.argv[1], sys.argv[2])
