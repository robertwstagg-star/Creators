# Live trip (v1)

One follow-along trip at a time — day-by-day updates with photos and uploaded video.

## Fields (`liveTrip`)

| Field | Notes |
|-------|--------|
| `id`, `title`, `city` | Required |
| `country`, `flag`, `inTrekstak` | From TrekStak city match |
| `startDate`, `endDate` | Optional ISO dates |
| `status` | `planning` · `live` · `wrapped` |
| `coverPhotoUrl`, `hook` | Trip shell |
| `days[]` | Day entries (see below) |

### Day entry

| Field | Notes |
|-------|--------|
| `dayNumber`, `label`, `headline` | Headline required |
| `summary` | Optional |
| `tags` | Up to 3: food, culture, vibe, etc. |
| `photoUrl` | Optional |
| `videoUrl` | Uploaded clip (Firebase Storage, up to 100 MB) |
| `videoLinkUrl` | Optional TikTok / YouTube / Instagram link |

## Public page

Shown when `status` is `planning` or `live` (hidden when `wrapped`). Renders above Trip radar.

## Storage

Videos upload to `creator_pages/{slug}/trips/{tripId}/…` — Firebase rules allow `video/*` up to 100 MB.
