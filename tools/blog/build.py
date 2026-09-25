#!/usr/bin/env python3
"""KWB Media blog builder.

Run from anywhere:  python3 tools/blog/build.py
Reads every post in tools/blog/posts/*.json and regenerates:
  - blog/<slug>/index.html for each post
  - blog/index.html (all posts, newest first)
  - the "From the Blog" cards on index.html (latest 3)
  - the blog entries in sitemap.xml
See tools/blog/STYLE_GUIDE.md for how to write a post.
"""
import json, os, glob, datetime, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)
SITE = 'https://www.kwbmedia.com'

def head(title, desc, url, image, schema, og_type='article'):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#c81e3a">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{image}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Squada+One&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
{json.dumps(schema)}
</script>
<script>window.va = window.va || function () {{ (window.vaq = window.vaq || []).push(arguments); }};</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<div class="announce">Don't wait, book your FREE CONSULTATION now!</div>

<header class="site-header">
  <a class="logo" href="/"><img src="/images/kwb-logo-240.png" alt="KWB Media LLC logo" width="60" height="60"></a>
  <nav><ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about.html">About Us</a></li>
    <li><a href="/services.html">Services</a></li>
    <li><a href="/contact.html">Contact Us</a></li>
    <li><a href="/videos.html">Videos</a></li>
    <li><a href="/specials.html">Specials</a></li>
    <li><a href="/blog/" class="active">Blog</a></li>
  </ul></nav>
  <a class="phone" href="tel:8608037683">(860) 803-7683</a>
</header>
'''

FOOT = '''
<footer>
  <p>KWB Media LLC &middot; 224 Durkee Road, Somers, CT 06071</p>
  <p><a href="tel:8608037683">(860) 803-7683</a> &middot; <a href="mailto:ray@kwbmedia.com">ray@kwbmedia.com</a></p>
  <div class="footer-links">
    <a href="https://www.facebook.com/getvideoorgetlost/" target="_blank" rel="noopener">Facebook</a>
    <a href="https://www.sr9.ai">Check the signal ...</a>
  </div>
  <p>&copy; 2026 KWB Media LLC - All Rights Reserved.</p>
</footer>
</body>
</html>
'''

AUTHOR = '''
  <div class="author-box">
    <img src="/images/kwb-logo-240.png" alt="KWB Media logo" width="72" height="72">
    <div>
      <strong>Ray Wolters</strong> is the founder of KWB Media LLC in Somers, Connecticut. He has produced video for clients like Pfizer, ESPN, Coca-Cola, General Dynamics Electric Boat and Mitsubishi Power, and helps businesses all over the Northeast get found with video. When he's not behind a camera, he's writing horror novels, which explains a lot.
    </div>
  </div>
'''

CTA = '''
  <div class="post-cta">
    <h3>Ready to Get Video? (Or Get Lost.)</h3>
    <p>Tell us about your project and we'll give you a straight answer on what it takes, what it costs and where to start. No jargon, no hard sell, no 47-slide PowerPoint.</p>
    <a href="/contact.html" class="btn">Book a Free Consultation</a>
    <p style="margin-top:14px;"><a href="tel:8608037683" style="color:#fff;">(860) 803-7683</a></p>
  </div>
'''

def human(d):
    t = datetime.date.fromisoformat(d); return t.strftime('%B ') + str(t.day) + t.strftime(', %Y')

def article_schema(title, desc, url, image, pub, modified):
    return {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": title, "description": desc, "image": image,
        "datePublished": pub, "dateModified": modified,
        "author": {"@type": "Person", "name": "Ray Wolters", "url": SITE + "/about.html"},
        "publisher": {"@type": "Organization", "name": "KWB Media LLC",
                      "logo": {"@type": "ImageObject", "url": SITE + "/images/kwb-logo.png"}},
        "mainEntityOfPage": url,
    }


POSTS = []
for f in sorted(glob.glob('tools/blog/posts/*.json')):
    j = json.load(open(f))
    POSTS.append(dict(slug=j['slug'], title=j['title'], seo_title=j['seo_title'], desc=j['description'],
        card=j['card_text'], date=j['date'], modified=j.get('modified', j['date']), image=j['image'],
        alt=j['image_alt'], sources=[(s['name'], s['url']) for s in j.get('sources', [])], body=j['body_html']))
POSTS.sort(key=lambda p: (p['date'], p['slug']), reverse=True)

for p in POSTS: p['date_h'] = human(p['date'])
POSTS.sort(key=lambda p: p['date'], reverse=True)

for p in POSTS:
    url = f"{SITE}/blog/{p['slug']}/"
    img = f"{SITE}/images/{p['image']}"
    schema = article_schema(p['title'], p['desc'], url, img, p['date'], p.get('modified', p['date']))
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
        {"@type": "ListItem", "position": 3, "name": p['title'], "item": url}]}
    html = head(p['seo_title'], p['desc'], url, img, [schema, crumbs])
    src = ''.join(f'      <li><a href="{u}" target="_blank" rel="noopener">{n}</a></li>\n' for n, u in p['sources'])
    html += f'''
<article class="post">
  <p class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/blog/">Blog</a></p>
  <h1>{p['title']}</h1>
  <p class="byline">By <strong>Ray Wolters</strong>, KWB Media &middot; <time datetime="{p['date']}">{p['date_h']}</time></p>
  <img class="post-hero" src="/images/{p['image']}" alt="{p['alt']}">
{p['body']}
{CTA}
{AUTHOR}
  <div class="sources">
    <strong>Sources</strong>
    <ul>
{src}    </ul>
  </div>
</article>
'''
    html += FOOT
    os.makedirs(f"blog/{p['slug']}", exist_ok=True)
    open(f"blog/{p['slug']}/index.html", 'w').write(html)

# blog index
url = SITE + '/blog/'
desc = 'Video marketing tips, statistics and advice from KWB Media, a video production company serving the Northeast.'
schema = {"@context": "https://schema.org", "@type": "Blog", "name": "KWB Media Blog", "url": url, "description": desc,
          "publisher": {"@type": "Organization", "name": "KWB Media LLC"},
          "blogPost": [{"@type": "BlogPosting", "headline": p['title'], "url": f"{SITE}/blog/{p['slug']}/", "datePublished": p['date']} for p in POSTS]}
html = head('Video Marketing Blog | KWB Media LLC', desc, url, SITE + '/images/og-share.jpg', schema, 'website')
cards = ''.join(f'''    <a class="card blog-card" href="/blog/{p['slug']}/">
      <img src="/images/{p['image']}" alt="{p['alt']}" loading="lazy">
      <p><em>{p['date_h']}</em></p>
      <h3>{p['title']}</h3>
      <p>{p['card']}</p>
      <span class="read-more">Read more &rarr;</span>
    </a>
''' for p in POSTS)
html += f'''
<section>
  <h1 style="font-size:2.3rem;">The KWB Media <span class="hl">Blog</span></h1>
  <p style="margin:18px 0 30px;">Video marketing tips, numbers and straight talk for businesses across the Northeast and beyond.</p>
  <div class="grid-3">
{cards}  </div>
</section>
'''
html += FOOT
open('blog/index.html', 'w').write(html)


# homepage: latest 3 posts
hc = ''.join(f'''    <a class="card blog-card" href="blog/{p['slug']}/">
      <img src="images/{p['image']}" alt="{p['alt']}" loading="lazy">
      <p><em>{p['date_h']}</em></p>
      <h3>{p['title']}</h3>
      <p>{p['card']}</p>
      <span class="read-more">Read more &rarr;</span>
    </a>
''' for p in POSTS[:3])
h = open('index.html').read()
a = h.index('<h2>From the <span class="hl">Blog</span></h2>')
b = h.index('<div class="grid-3">', a) + len('<div class="grid-3">\n')
c = h.index('  </div>\n  <p style="margin-top:24px;"><a href="blog/"', b)
h = h[:b] + hc + h[c:]
open('index.html','w').write(h)


# sitemap: keep non-blog entries, rebuild blog entries
sm = open('sitemap.xml').read()
blocks = re.findall(r'  <url>.*?</url>\n', sm, flags=re.S)
keep = [b for b in blocks if '/blog/' not in b]
newest = max(p['modified'] for p in POSTS)
blog = [f"""  <url>
    <loc>{SITE}/blog/</loc>
    <lastmod>{newest}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""] + [f"""  <url>
    <loc>{SITE}/blog/{p['slug']}/</loc>
    <lastmod>{p['modified']}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>
""" for p in sorted(POSTS, key=lambda p: p['date'])]
open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(keep + blog) + '</urlset>\n')
print('built', len(POSTS), 'posts')
