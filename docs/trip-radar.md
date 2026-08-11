# Trip radar (v1)

Quick “where I’m headed” cards on the public creator page.

## Fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Unique id |
| `city` | yes | Destination name |
| `when` | yes | Free text (`Sep 2026`, `Fall`, `This month`) |
| `why` | no | Free text — **no character cap**; line or short paragraph |
| `status` | yes | `upcoming` · `currently` · `just-back` |
| `focus` | no | Chips: `walks`, `food`, `family`, `nightlife`, `planning` |

## Sort on public page

1. There now (`currently`)  
2. Upcoming  
3. Just back  

Synced via Firestore `creator_pages/{slug}.tripRadar` with profile/posts.
