#!/usr/bin/env python3
"""Builds app/src/main/assets/index.html from the playable web build (offline: local three.js + fonts, full-screen layout)."""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent
src = (root.parent / 'web' / 'roadster-survive.html').read_text()
src = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', src)
src = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\s*', '', src)
src = src.replace('{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" } }', '{ "imports": { "three": "./three.module.js" } }')
src = src.replace('const availW = innerWidth - 32, availH = innerHeight - 20;', 'const availW = innerWidth, availH = innerHeight;')
fonts = ('@font-face{font-family:"Russo One";src:url(fonts/russo.woff2) format("woff2");}' +
         ''.join('@font-face{font-family:"Rubik";font-weight:%d;src:url(fonts/rubik%d.woff2) format("woff2");}' % (w, w) for w in (400, 600, 800)))
full = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>' + fonts + 'html,body{margin:0;padding:0}[hidden]{display:none!important}'
        'body{padding:0!important}#stage{border-radius:0!important;box-shadow:none!important}</style></head><body>' + src + '</body></html>')
assert 'three.module.js' in full and 'googleapis' not in full and 'jsdelivr' not in full
(root / 'app/src/main/assets/index.html').write_text(full)
print('index.html', len(full), 'bytes')
