# GitHub upload checklist — Creators site

Use **`~/Desktop/creators-trekstakapp/`** as the source. Upload the **whole folder** to the Creators GitHub Pages repo — **keep subfolders**, do not flatten files into the root.

## Correct repo tree (must match exactly)

```
Creators/   (or whatever the repo is named)
├── CNAME                      ← must contain: creators.trekstakapp.com
├── README.md
├── index.html
├── 404.html                   ← required for /c/:slug routes
├── app.js                     ← REQUIRED (site will not load without this)
├── styles.css
├── finallogo.png
├── apple-badge-black.png
├── Instagram_Glyph_Gradient.png
├── data/
│   └── creators.json
├── js/
│   └── creator-public-store.js
└── docs/
    └── post-template.md
```

## Common mistakes (from your current upload)

| Wrong (what you have) | Right |
|-----------------------|--------|
| `creators.json` at root | `data/creators.json` |
| `creator-public-store.js` at root | `js/creator-public-store.js` |
| `post-template.md` at root | `docs/post-template.md` (optional) |
| **Missing `app.js`** | Must be at repo root |
| Flat upload (no folders) | Keep `data/` and `js/` |

`404.html` loads `/app.js` and `/js/creator-public-store.js`. If those paths 404, the page stays on “Loading…”.

## DNS (custom domain)

GitHub Pages needs a **CNAME** DNS record:

| Type | Host / Name | Value / Points to |
|------|-------------|-------------------|
| CNAME | `creators` | `robertwstagg-star.github.io` |

Same pattern as partners (`partners` → `robertwstagg-star.github.io`).

**Do not** set an A record for `creators` unless GitHub docs for your account say otherwise — subdomain = CNAME to `*.github.io`.

### If Safari says “Can’t Find the Server”

1. Confirm DNS in your registrar (Advanced DNS) for host `creators`.
2. Wait for propagation (often minutes, sometimes up to a few hours).
3. Test the **default GitHub URL** first:  
   `https://robertwstagg-star.github.io/Creators/`  
   (repo name may differ — use your actual Pages URL from Settings → Pages).
4. On your phone/Mac: try cellular vs Wi‑Fi, or flush DNS (`dscacheutil -flushcache` on Mac).
5. GitHub “DNS check successful” can pass before every network resolves the name — “can’t find the server” is usually local/propagation.

### Enforce HTTPS

Leave **Enforce HTTPS** on after DNS works. If HTTPS fails briefly after a domain change, uncheck → wait → re-check.

## After upload — smoke test

1. Default Pages URL loads (not Safari DNS error).
2. Custom domain: `https://creators.trekstakapp.com`
3. Creator page: `https://creators.trekstakapp.com/c/chris`
4. Browser console: no 404 for `app.js` or `js/creator-public-store.js` or `data/creators.json`
