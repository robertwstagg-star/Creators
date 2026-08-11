# City of the week (v1)

One rotating insight card on the public creator page — heavier than a bare city pick, lighter than a full post.

## Fields (`cityOfTheWeek`)

| Field | Required | Notes |
|-------|----------|--------|
| `city` | yes | Prefer a TrekStak travel-search city (dashboard autocomplete) |
| `country` / `flag` | no | Filled when city matches TrekStak |
| `inTrekstak` | no | `true` when city matches |
| `photoUrl` | recommended | Cover image (upload or URL) |
| `intro` | no | Short framing line or two |
| `tips` | yes (1–5) | Punchy bullets; separate from Posts |
| `updatedAt` | no | ISO timestamp |

## Dashboard

Section between **Trip radar** and **Posts**: city, photo, intro, five tip inputs, Save / Clear.

Tips are authored as their own block and render as a bullet list. Posts remain free-writing.

## Public page

Renders **above Trip radar**: photo → flag + city + country → intro → tip bullets.

Synced via Firestore `creator_pages/{slug}.cityOfTheWeek` with profile / posts / trip radar.
