# Creator mini-blog post template (v1)

Posts live on the public creator page so TrekStak promo can live here instead of flooding Instagram.

## Fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique per creator (e.g. `chris-001`) |
| `status` | yes | `published` (shown) or `draft` (hidden) |
| `publishedAt` | yes | `YYYY-MM-DD` — sorts newest first |
| `title` | yes | Post headline |
| `body` | yes | Caption / short blog text |
| `imageUrl` | yes* | Main photo URL (*can be empty while drafting; public posts should have one) |
| `imageAlt` | no | Accessibility text for the image |
| `ctaLabel` | no | Button text (default: `Get TrekStak`) |
| `showPromoCode` | no | If `true`, show creator promo code under the CTA (default `true`) |
| `tags` | no | Short labels, e.g. `["planning", "tips"]` |

## Not in v1 (tweak later)

- Multi-photo galleries
- Video embeds
- Per-post custom URLs
- Creator self-publishing UI

## Example

```json
{
  "id": "chris-001",
  "status": "published",
  "publishedAt": "2026-08-08",
  "title": "How I plan a city day in under 10 minutes",
  "body": "Open TrekStak, pick the neighborhood, stak your stops, and go.",
  "imageUrl": "https://...",
  "imageAlt": "Traveler with a map",
  "ctaLabel": "Try it with my code",
  "showPromoCode": true,
  "tags": ["planning", "tips"]
}
```
