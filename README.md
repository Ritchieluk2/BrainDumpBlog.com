# BrainDumpBlog.com

BrainDumpBlog.com is a site where people can record brain dumps (an early morning routine where you put your stream of consciousness onto the page as a way to organize your thoughts and jumpstart your brain for the day) in an online journal. Each entry is drawn as a small solar system based on the feelings in the writing, and each week of entries becomes a galaxy, so you can watch your mornings change over time.

## Getting started

Requires Node.js 24 LTS (24.15 or newer) or 22.22.3+. An `.nvmrc` is included if you use a Node version manager.

```bash
npm install
cp .env.example .env     # optional in development
npm run dev
```

Then open http://localhost:3000.

In development you don't need a Resend key: when you request a sign-in link, it is printed in the terminal running `npm run dev`. Copy it into your browser to sign in.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |

`npm run generate` (static export) no longer applies: accounts and the journal need the server.

Deploying: see [docs/DEPLOY.md](docs/DEPLOY.md) (Cloudflare Workers + D1 + Resend, free tiers).

## How it works

- **Accounts:** passwordless. You enter your email, we send a one-time link (via [Resend](https://resend.com)), and clicking it signs you in. Sessions are encrypted cookies (`nuxt-auth-utils`), valid for 30 days.
- **Try before signing up:** anyone can write a dump and see its solar system. It stays in their browser until they sign in, then it's saved automatically.
- **Database:** Nitro's built-in SQL layer. Locally it's a SQLite file in `.data/` (git-ignored). On Cloudflare it uses D1 through a binding named `DB`. Tables are created automatically on first request; see `server/utils/db.ts`.
- **Analysis:** `shared/utils/affect.ts` is a simple word-list placeholder that scores feelings and patterns. It will be swapped for a proper model later; anything that returns an `Affect` works.
- **Thumbnails:** `shared/utils/cosmos.ts` draws SVG from the analysis. Same entry, same picture, every time.

### What appears in the sky

| Body | Meaning |
| --- | --- |
| Star (center) | The strongest feeling. Bigger = stronger, more rays = more energy |
| Planets | Other feelings, nearest = strongest |
| Ringed planet | Anxiety |
| Moons | A feeling riding along with another |
| Comets | Racing, jumping thoughts |
| Asteroid belt | To-dos and loose ends |
| Nebula | Tiredness or uncertainty |
| Wormhole | Looping thoughts, rumination |
| Sparkles | Small joys and gratitude |

## API

All routes are under `/api`. Journal routes require a signed-in session.

| Route | Purpose |
| --- | --- |
| `POST /auth/request-link` | `{ email }` → emails a sign-in link (max 5 per hour per email) |
| `POST /auth/verify` | `{ token }` → signs in, creating the account if needed |
| `POST /analyze` | `{ body }` → analysis only, nothing stored |
| `GET /dumps` | Your entries (without full text) |
| `POST /dumps` | `{ body, entryDate }` → save an entry |
| `GET /dumps/:id` | One entry with full text |
| `DELETE /dumps/:id` | Delete an entry |
| `GET /account/export` | Download all your data as JSON |
| `DELETE /account` | Delete your account and all entries |

## Project structure

```
app/
  assets/css/            tokens.css (design tokens), base.css (shared classes)
  components/            Cosmos* (thumbnails + legend), Bd* (brand), DumpEditor, Site*
  middleware/auth.ts     Sends signed-out visitors to /sign-in
  pages/                 index, preview, sign-in, auth/verify, journal/, account, why, about, styleguide
  utils/journal.ts       Date helpers, the pre-sign-in "pending" dump
  data/sampleDumps.ts    Demo week for the homepage and styleguide
server/
  api/                   Routes listed above
  utils/                 db (schema + migrations), auth (tokens), email (Resend), dumps
shared/
  utils/cosmos.ts        Palette, moods, solar system + galaxy renderers
  utils/affect.ts        Placeholder text analysis
  types/                 Session and API types
docs/brand.md            Brand direction and decisions
```
