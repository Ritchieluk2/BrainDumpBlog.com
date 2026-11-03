# Roadmap & review list

_Last updated: Nov 2, 2026_

## Shipped in this round (needs your review)

To see everything with sample data, run `npm run dev` and open
**http://localhost:3000/api/dev/demo-login?reset=1** (signs you in as the demo account and rebuilds its content).

### 1. Morning dumps vs. journal entries
- [ ] **Journal → Mornings tab** (`/journal`): unchanged galaxy view, now with tabs.
- [ ] **Journal → Journal tab** (`/journal/entries`): list of journal entries (title, date, excerpt, small picture).
- [ ] **New journal entry** (`/journal/new`): title, date, body, and a picker to link mornings it reflects on.
- [ ] **Edit a journal entry**: "Edit" button on the entry page.
- [ ] **On a morning's page**: a "Reflections" section listing journal entries about it, and a "Write about this morning" button (pre-links the morning).
- [ ] **On a journal entry's page**: "Reflecting on" cards linking back to those mornings.

Assumptions to confirm:
- Only **morning dumps** feed weekly galaxies and Insights. Journal entries get a picture but don't count toward patterns.
- **Morning dumps can't be edited** after saving (they're a snapshot of that morning); they can be deleted. Journal entries can be edited.
- A journal entry can link up to 14 mornings; links are to mornings only (not journal → journal).

### 2. To-dos, notes and reminders (signed-in homepage)
- [ ] **Today panel** replaces the demo galaxy on the homepage once you're signed in: Reminders, To-do, Notes.
- [ ] **To-dos from a morning**: a morning's page lists likely to-dos found in it (bullet lines, "need to…", "remember to…") with one-tap Add / Add all. Added items link back to their morning.
- [ ] **Reminders** with a date and time; due ones are highlighted with a badge.

Assumptions to confirm:
- Reminders are **in-app only** for now (they show as "Due" on the homepage). They do not email or notify you yet.
- Notes are short (up to 500 characters) quick notes, not full documents. Longer writing belongs in a journal entry.

### 3. Themes
- [ ] **Night mode**: moon/sun button in the header toggles it; the dark site and dark thumbnails go together.
- [ ] **Appearance page** (`/settings`, linked from the footer and Account): System / Light / Night, plus art style.
- [ ] **Art styles** (same meaning, different look), each with a day and a week version:
  - **Planets**: the original solar system / galaxy
  - **Geometry**: Bauhaus shapes on a grid; a week is a constellation around a core
  - **Watercolor**: pooled washes, ink spatter, paper grain; a week is a ring of blooms
  - **Albers**: nested cut-paper squares after Josef Albers' *Homage to the Square*, with drop-shadowed "cut card" edges and a translucent overlapping card showing color interplay; a week is one square per day, oldest outside
- [ ] Check every page in Night mode for anything that looks off (contrast, hard-coded colors).

Assumptions to confirm:
- Preferences are stored **in the browser** (a cookie), so they don't follow you to another device yet.
- "Cut color cards" is folded into the Albers style rather than being its own style.

## Next up (proposed, not started)

1. **Email reminders**: send due reminders through Resend on a schedule (Cloudflare Cron Trigger every 15 minutes). Needs a decision on quiet hours and whether to email at all by default.
2. **Sync preferences to the account** so theme and art style follow you across devices.
3. **Real affect analysis**: replace the word-list placeholder (`shared/utils/affect.ts`) with a model call. This will improve everything downstream: thumbnails, insights, topics, and to-do detection.
4. **Running "profile" galaxy**: the stretch goal of an all-time image that grows with every morning.
5. **Animated timeline**: watch weeks change shape over time (stretch goal from the original plan).
6. **More art styles**: e.g. a separate Matisse-style cut-paper look, woodblock/riso print, stained glass.
7. **Deploy to Cloudflare**: config is ready (`wrangler.jsonc`); follow `docs/DEPLOY.md`.

## Thinking ahead (flagged Nov 3, not started)

### A. Mobile, tablet and laptop: done Nov 3 (tested at 320, 375, 390, 768 and 1280 px, light and night)
- [x] Phones get a bottom tab bar (Write, Journal, Insights, Account); the header shrinks to the logo and the night-mode toggle.
- [x] Tablets: the header fits on one row; the Today panel spreads into two columns.
- [x] Text fields are 16 px or larger, so iPhones don't zoom in when you tap them.
- [x] Tap targets of at least 44 px (delete buttons, "Show done", links).
- [x] Tighter page margins and card padding on small phones.
- [x] Mornings show two per row on phones.
- [x] Writing boxes grow with your text, so the Save button stays reachable in one scroll.
- [x] Insights chart:
  - Drawn at the screen's real size, so labels stay readable.
  - Tap a morning, or drag sideways to move between days. The tooltip has an "Open entry" link.
  - Arrow keys work on a keyboard.
- [x] Fixed: thumbnails ignored Night mode on every page except Appearance. A missing on/off setting was being read as "off".
- [x] iPhone extras: safe-area padding (notch and home bar), "Add to Home Screen" icon, and a web app manifest.
- [ ] Still to do: try it on your real phone (Safari and Chrome), especially the keyboard while writing and the reminder date picker.

### B. Theme-neutral vocabulary
Today's copy is all astronomy ("solar system", "galaxy", "planets", "comets", "nebula", "wormhole", "sky"), which doesn't fit Geometry, Watercolor or Albers. Idea: one neutral name per meaning, and each style supplies its own name for the same thing. Neutral words could also animate into the style's word (e.g. "Haze" → "Nebula").

| Meaning | Neutral (draft) | Planets | Geometry | Watercolor | Albers |
| --- | --- | --- | --- | --- | --- |
| A day | Morning / Snapshot | Solar system | Composition | Painting | Card |
| A week | Week / Mosaic | Galaxy | Constellation | Wash | Nest |
| Strongest feeling | Core | Star | Split disc | Pool | Inner square |
| Other feelings | Companions | Planets | Shapes | Blooms | Cards |
| Racing thoughts | Streaks | Comets | Bars | Brush strokes | Cut strips |
| To-dos / loose ends | Scatter | Asteroid belt | Dot grid | Spatter | Confetti |
| Tiredness / uncertainty | Haze | Nebula | Hatching | Wash | Vellum |
| Looping thoughts | Loops | Wormhole | Nested squares | Spiral | Extra square |
| Small joys | Glints | Sparkles | Plus signs | Gold flecks | Bright chips |

Code impact: labels in `AFFECT_FEATURES`, the legend, and copy across the homepage, journal, insights and brand doc. It's mostly a lookup table per style.

### C. Security, privacy and data commitments
Stated intent: **never sell user data. Income comes from premium themes and account features.**

Already in place:
- Passwordless sign-in. Sign-in tokens are stored only as hashes, work once, and expire after 20 minutes.
- Encrypted, HTTP-only session cookies.
- Every database query is parameterized and limited to the signed-in user's own rows.
- Users can export or delete everything.
- No ads, analytics or trackers.
- Journal text currently never leaves our own server.

Gaps to close:
- [ ] **A real AI model would send journal text to an outside provider.** Pick a provider with zero data retention and no training on our data, and say so publicly. This is the biggest privacy decision ahead.
- [ ] Entry text is stored readable in D1. Cloudflare encrypts the disk, but we could read it. Options:
  - App-level encryption (a per-user key).
  - True end-to-end encryption. This would block server-side analysis, so it's a real trade-off.
- [ ] Self-host the fonts. Loading them from Google Fonts tells Google each visitor's IP address.
- [ ] Security headers: Content-Security-Policy, HSTS, frame protection.
- [ ] Sessions can't be ended remotely ("sign out everywhere"). Also, after an account is deleted, other devices keep a valid cookie until it expires. They can't see any data, but they should be signed out.
- [ ] Bot protection on sign-in (Cloudflare Turnstile is free) on top of the rate-limit rule.
- [ ] Privacy policy and terms pages, including a plain-language "our promise" page. Cover GDPR/CCPA basics; export and delete already exist.
- [ ] Decide on backups and retention: how long deleted data lingers in backups.

### D. Better analysis and better art (the main differentiator)
- **Analysis.** Replace the word lists with a model that returns structured output:
  - Feelings with intensities, plus the phrases that triggered them, so we can show *why*.
  - Themes and topics.
  - Thinking patterns: planning, rumination, gratitude, self-criticism.
  - Energy and certainty.
  - Each user's own baseline, so "anxious" means anxious *for you*.
- **Art.**
  - Encode more of the analysis, and keep the visual rules consistent day to day so trends stay readable.
  - Explain each picture in plain language ("bigger core = stronger feeling…").
  - Recommendation: keep the procedural art, with model-chosen parameters, rather than AI-generated images. It's cheaper, consistent, and legible. Generated images could come later as a premium extra.
- **Quality loop.**
  - A test set of sample entries with expected readings, to check changes against.
  - A "does this feel right?" button so users can correct the reading. That feedback improves calibration.

### E. Cost per free user and scaling risks
Rough per-user picture (to confirm against current prices before deciding anything):
- **Hosting and database:** fractions of a cent per active user per month. A daily writer adds roughly 1–2 MB of data a year.
- **Email:** about 1–2 sign-in emails per user per month. Emailed reminders would multiply this.
- **AI analysis: likely the largest cost by far, and it scales with every entry written.** Needs pricing per entry, and a free-tier policy: analyze every entry, cap free analyses, or use a cheaper model for free users.

Key risks as we scale:
- AI costs growing with free users.
- Bot sign-ups burning email and AI quota.
- Cloudflare's per-database size cap (about 10 GB, to confirm). Past that, data would need splitting across databases.
- Email deliverability as volume grows.
- Breach liability, given how personal journals are.
- Dependence on Cloudflare.

## Housekeeping
- [ ] Delete unused files: `app/components/OrbitSystem.vue`, `app/utils/brand.ts`.
- [ ] Commit to git once you're happy (nothing has been committed for you).
- Database changes run automatically on first request (migration 2 adds `kind`/`title` to entries, plus `entry_links` and `items` tables). No manual step needed.
