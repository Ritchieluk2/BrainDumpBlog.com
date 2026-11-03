# Deploying to Cloudflare

Brain Dump runs as a **Cloudflare Worker with static assets** (Nitro's `cloudflare_module` preset, which Nitro recommends over Pages for new projects) and stores data in **Cloudflare D1**. Sign-in email goes through **Resend**.

Everything below fits in the free tiers to start. See "Costs" at the end.

## One-time setup

### 1. Install Wrangler (Cloudflare's CLI) and log in
```powershell
npm install -D wrangler
npx wrangler login
```

### 2. Create the database
```powershell
npx wrangler d1 create braindump
```
Copy the `database_id` it prints into `wrangler.jsonc`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
You don't need to create tables: the app sets up and updates its own schema on the first request.

### 3. Add the secrets
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
npx wrangler secret put NUXT_SESSION_PASSWORD   # paste the value above (use a new one, not your dev one)
npx wrangler secret put NUXT_RESEND_API_KEY     # your Resend API key
```
`NUXT_PUBLIC_SITE_URL` and `NUXT_EMAIL_FROM` are plain settings in `wrangler.jsonc` under `vars`. Check that they're right.

### 4. Verify your sending domain in Resend
In Resend → Domains, add `braindumpblog.com`. Resend shows a few DNS records (SPF/DKIM). Add them in Cloudflare → your domain → DNS. Until this is verified, Resend only delivers to your own address, so nobody else can sign in.

### 5. Connect the GitHub repo (automatic deploys)
Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick `BrainDumpBlog.com`.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variable: `NITRO_PRESET` = `cloudflare_module`

Every push to `main` then builds and deploys.

Prefer to deploy by hand? `set NITRO_PRESET=cloudflare_module&& npm run build` then `npx wrangler deploy` (PowerShell: `$env:NITRO_PRESET='cloudflare_module'; npm run build; npx wrangler deploy`).

### 6. Point the domain at it
Worker → Settings → Domains & Routes → Add custom domain → `braindumpblog.com` (and `www` if you like).

### 7. Protect the sign-in email quota
Resend's free plan sends 100 emails a day. To stop someone burning through that, add a rate-limiting rule in Cloudflare → Security → WAF → Rate limiting rules:
- Match: URI path equals `/api/auth/request-link`
- Limit: e.g. 5 requests per 10 minutes per IP → Block

(The app also limits each email address to 5 links an hour.)

## After the first deploy
- Visit the site, request a sign-in link, and check the email arrives from your domain.
- Write a test morning, check it appears in Journal.
- Watch Worker → Observability → Logs for errors for the first few days, especially any "exceeded CPU" errors (see below).
- The demo account link (`/api/dev/demo-login`) is disabled in production builds; it returns 404.

## Costs

| Service | Free tier | When you'd pay |
| --- | --- | --- |
| Workers | 100,000 requests/day, **10 ms CPU per request** | Workers Paid, $5/month: 10M requests/month, up to 30 s CPU |
| D1 | 5M rows read/day, 100k rows written/day, 5 GB | Included in Workers Paid; overages are tiny |
| Resend | 3,000 emails/month, 100/day, 3 domains | Pro, $20/month for 50k emails |
| Domain DNS | Free on Cloudflare | Domain registration itself (yearly) |

What actually limits us on the free plan:
- **CPU time (10 ms per request).** The app is built to stay small per request: thumbnails are drawn in the browser, Insights reads saved topic words instead of re-reading every entry, and capped at ~6 months. If logs ever show "exceeded CPU", the $5 plan removes the problem.
- **Sign-in emails (100/day).** Each sign-in is one email; sessions last 30 days, so this covers roughly a few hundred active users. Emailed reminders (not built yet) would use this up quickly; that's the point to move to Resend Pro.
- **Requests and database.** A typical visit is a handful of requests and a few hundred rows read, so the daily limits cover thousands of active users.
