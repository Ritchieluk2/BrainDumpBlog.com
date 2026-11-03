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

## Housekeeping
- [ ] Delete unused files: `app/components/OrbitSystem.vue`, `app/utils/brand.ts`.
- [ ] Commit to git once you're happy (nothing has been committed for you).
- Database changes run automatically on first request (migration 2 adds `kind`/`title` to entries, plus `entry_links` and `items` tables). No manual step needed.
