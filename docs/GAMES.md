# Games (Syzygy)

Syzygy is a space-themed take on the card game Set. Find three cards where each feature is all the same or all different. It has four modes: Daily, Race, Flux and Adventure.

## Where it lives
- **The game:** `public/games/syzygy/index.html`. It's one self-contained page (HTML, CSS and JS), served as a static file, so it costs no Worker CPU. The URL is `/games/syzygy/`. In dev, use `/games/syzygy/index.html`.
- **The hub page:** `app/pages/games/index.vue` at `/games`, with a card and thumbnail for each game (`public/games/<slug>/thumbnail.png`). It's linked from the header, the phone tab bar (signed in) and the footer. To add a game, add an entry to the `games` list on that page.
- **The prototype** we tune rules in lives on claude.ai. When rules change there, the site copy is regenerated from it. Avoid hand-editing the site copy, or the two drift apart.
- **Saved in the browser (localStorage):**
  - personal bests
  - unlocked astronauts
  - the current Adventure run
  - a queue of game results waiting to upload
- **Dev tools:** add `?dev` to the URL to show "Prototype: unlock every astronaut".

## Logging (game_events)
Every finished game, Adventure encounter and Adventure reward pick is one row in `game_events` (migration 5 in `server/utils/db.ts`).

| Column | |
| --- | --- |
| `id` | the game's own id, so retries are ignored (`INSERT OR IGNORE`) |
| `user_id` | set when signed in |
| `anon_id` | a random id kept in the browser, for signed-out play |
| `mode` | `daily`, `practice`, `race-blitz`, `race-plus`, `race-trial`, `flux`, `flux-random`, `encounter`, `pick` |
| `day` | the player's local date |
| `ver` | game version (`site-1`, …), bump when rules change so results can be compared |
| `data` | the full result as JSON (score, target, time, misses, astronaut, constellations, …) |

- **Endpoints:**
  - `POST /api/games/events` takes up to 25 events per request and drops anything malformed.
  - `GET /api/games/stats` returns your own games, or everyone's if your email is in `NUXT_ADMIN_EMAILS`. Players are labelled p1, p2, never by email.
- **Signing in:** a player's earlier anonymous games on that device move to their account.
- **Account export and delete** both include game history.
- **What's never stored:** writing, names or emails. The server also strips `email`, `name` and `who` fields from any event before saving.

### Setup
```powershell
npx wrangler secret put NUXT_ADMIN_EMAILS   # e.g. you@example.com
```
For local dev, put `NUXT_ADMIN_EMAILS=you@example.com` in `.env`.

### Useful queries
Run against production with `npx wrangler d1 execute braindump --remote --command "..."`.

Win rate and score by Adventure encounter:
```sql
SELECT json_extract(data,'$.act') AS act, json_extract(data,'$.round') AS round, json_extract(data,'$.encounter') AS encounter,
       COUNT(*) AS tries, ROUND(AVG(json_extract(data,'$.won'))*100) AS win_pct,
       ROUND(AVG(1.0*json_extract(data,'$.score')/json_extract(data,'$.target'))*100) AS pct_of_target
FROM game_events WHERE mode='encounter' GROUP BY act, round ORDER BY act, round;
```
Most picked rewards:
```sql
SELECT json_extract(data,'$.picked') AS picked, COUNT(*) AS n FROM game_events WHERE mode='pick' GROUP BY picked ORDER BY n DESC;
```
Plays per mode per day:
```sql
SELECT day, mode, COUNT(*) AS n FROM game_events GROUP BY day, mode ORDER BY day DESC, n DESC;
```

## Costs
Each finished game is one small write, so the free plan's 100,000 writes a day covers it comfortably. If abuse shows up, add a WAF rate-limit rule on `/api/games/events`, like the one for sign-in links.

## Later
- Turn the game into Vue components with a shared engine, using the site's header and tokens.
- Save personal bests and Adventure runs to the account.
- Self-host the fonts. The game and the site both load Outfit and Fraunces from Google today.
