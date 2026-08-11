# TrekStak Creator Hub (Phase 1)

Public creator pages for **creators.trekstakapp.com**.

## URLs

| Path | Purpose |
|------|---------|
| `/` | Hub home (lists active creators) |
| `/c/:slug` | Public creator page (bio link + QR) |

Example: `https://creators.trekstakapp.com/c/chris`

## Phase 1 features

1. Creator registry — `data/creators.json`
2. Admin seed — edit JSON (first 10 founding creators)
3. Dynamic `/c/:slug` template (one page shell, data-driven)
4. Public basics — name, handle, role, bio, socials, promo code, App Store
5. Mini-blog posts — photo + caption template (see `docs/post-template.md`)
6. Copy promo code / copy page link
7. QR download

**Not in Phase 1:** private hub, Tapfiliate dashboard, AI tools, login, creator self-publishing.

## Add a founding creator

Edit `data/creators.json` and append:

```json
{
  "id": "unique-id",
  "slug": "chris",
  "displayName": "Chris",
  "handle": "@chris.travels",
  "role": "Planning Creator",
  "bio": "Short bio for the public page.",
  "avatarUrl": "https://...",
  "status": "active",
  "promoCode": "CHRIS20",
  "discountLabel": "20% off your first year",
  "appStoreUrl": "https://apps.apple.com/app/trekstak/id6758947030",
  "socials": {
    "instagram": "https://www.instagram.com/...",
    "tiktok": "",
    "youtube": ""
  },
  "posts": [
    {
      "id": "chris-001",
      "status": "published",
      "publishedAt": "2026-08-08",
      "title": "Post title",
      "body": "Short blog / caption text.",
      "imageUrl": "https://...",
      "imageAlt": "Describe the photo",
      "ctaLabel": "Try it with my code",
      "showPromoCode": true,
      "tags": ["planning", "tips"]
    }
  ]
}
```

Full post field notes: [`docs/post-template.md`](docs/post-template.md)

Rules:

- `slug` = lowercase letters, numbers, hyphens only (used in the URL)
- Creator `status`: `active` | `inactive` (inactive pages 404)
- Post `status`: `published` | `draft` (drafts stay hidden)
- Keep `promoCode` aligned with Apple offer code + Tapfiliate coupon later

## Deploy (GitHub Pages)

1. Create a repo (or folder) with the contents of this `creators-site` directory.
2. Enable GitHub Pages from the repo root (or `/docs`).
3. Add DNS: **CNAME** `creators` → `your-user.github.io` (or Pages target).
4. Confirm `CNAME` file contains `creators.trekstakapp.com`.
5. Wait for HTTPS / DNS, then open `/c/chris`.

GitHub Pages serves `404.html` for unknown paths, which loads the same app shell so `/c/:slug` works without a backend.

## Local preview

```bash
cd creators-site
python3 -m http.server 8787
```

Open `http://127.0.0.1:8787/` and `http://127.0.0.1:8787/c/chris`  
(Note: without the Pages `404.html` behavior, deep links need the SPA path restore — use `/` then click through, or open `/404.html` after setting path. On live Pages, `/c/chris` works.)

## Desktop upload pack

A copy for easy upload lives at:

`~/Desktop/creators-trekstakapp/`
