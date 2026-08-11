# City ratings (v1)

Creator city reviews: up to **five** category scores (1–5 stars) with a short **why** per row.

## Fields (`cityReviews[]`)

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique review id |
| `city` | yes | TrekStak travel-search city preferred |
| `country` / `flag` | no | Filled when city matches TrekStak |
| `ratings` | yes (1–5 rows) | Each: `category`, `label`, `stars` (1–5), `why` |
| `updatedAt` | no | ISO timestamp |

### Preset categories

`food`, `culture`, `nightlife`, `art`, `outdoors`, `family`, `shopping`, `romance`, `vibe`, `value`, `luxury`, `beach`, or `custom` (with free-text `label`).

## Dashboard

**City ratings** section (between City of the week and Posts): add/edit/delete reviews; star picker + why per category row.

## Public page

Renders after **City of the week**, before **Trip radar**: city header, then rows of category · stars · why.

Synced via Firestore `creator_pages/{slug}.cityReviews`.
