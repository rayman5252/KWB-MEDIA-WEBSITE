#!/usr/bin/env python3
"""Make a web-sized copy of a photo for a blog post header.

Usage (from the repo root):
  python3 tools/blog/prep_photo.py "BLOG PHOTOS/some photo.jpg" images/blog/<slug>.jpg
Resizes to max 1600px wide, fixes phone rotation, saves as a compressed JPG.
"""
import os, sys
from PIL import Image, ImageOps

if len(sys.argv) != 3:
    sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]
im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
if im.width > 1600:
    im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
im.save(out, quality=82, optimize=True, progressive=True)
print('wrote', out, im.size, os.path.getsize(out) // 1024, 'KB')
