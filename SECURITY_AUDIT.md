# WithinSuccess — Security & Consistency Audit

_Date: 2026-06-16 · Scope: withinsuccess.gr (main Next.js app)_

All findings below were verified directly in the code (file:line cited). Severities are realistic, not inflated.

---

## ✅ CORRECTION — dashboard IS protected (no critical leak)

> **An earlier draft of this audit wrongly flagged the dashboard as wide open.** That was a false positive: the automated passes searched for `middleware.ts` and missed `src/proxy.ts`. In **Next.js 16, middleware was renamed to `proxy`** (official, v16.0.0). This app runs Next 16.2.2, and `src/proxy.ts` IS the active middleware.

### Dashboard auth — status: OK
- `src/proxy.ts` runs on `matcher: ['/dashboard/:path*', '/api/dashboard/:path*']`.
- Every dashboard request is checked via `verifySessionToken(session cookie)`. Invalid/missing session → **401** for `/api/dashboard/*`, redirect to `/dashboard/login` for pages. Only `/dashboard/login` and `/api/dashboard/auth` are exempt.
- `verifySessionToken` uses Web Crypto (HMAC-SHA256) and **fails closed**: if `DASHBOARD_SESSION_SECRET` is missing it returns `false` → blocks everyone (does NOT leak).
- **So there is nothing to "fix" here, and adding a `middleware.ts` would be wrong** (redundant/conflicting with the Next 16 `proxy` convention).

### One thing to verify (not a code change)
- The protection only works if **`DASHBOARD_SESSION_SECRET`** and **`DASHBOARD_PASSWORD`** are set in the **Vercel** project env. They are NOT in `.env.local`. If the live dashboard logs in fine, they're set in Vercel — you're good. If login returns "Server misconfigured" (500), add them in Vercel. Either way, the failure mode is safe (blocked, not leaked).

---

## 🟠 HIGH

### 2. HTML injection in notification emails
- **Where:** `src/app/api/contact/route.ts:53`; `src/app/api/apply/route.ts:94,98,102,106`
- **What:** User-submitted fields (`message`, `reason`, `experience`, `goal`, `readiness`) are interpolated raw into the HTML email sent to `hello@withinsuccess.gr`. An attacker can inject HTML/links → phishing/spoofed content in your inbox. (Modern mail clients strip `<script>`, so not full XSS, but still real.)
- **Fix:** HTML-escape all user input before interpolation (small `escapeHtml()` helper).

### 3. ManyChat webhook & concierge are unauthenticated
- **Where:** `src/app/api/manychat/webhook/route.ts`, `src/app/api/manychat/concierge/route.ts`
- **What:** No shared-secret/signature check. Anyone can POST fake messages → DB writes + Anthropic API calls (cost) + polluted data.
- **Fix:** Require a shared secret/HMAC header that ManyChat sends; reject otherwise.

### 4. Google OAuth: no CSRF `state` + refresh token shown in HTML
- **Where:** `src/app/api/auth/google/route.ts:25-31`, `src/app/api/auth/google/callback/route.ts:75`
- **What:** No `state` param (CSRF on the OAuth flow). The callback renders the **refresh token directly in the HTML page** → ends up in browser history/cache.
- **Fix:** Generate + validate a random `state` (cookie). Never render the token; store server-side (env/secret store) and show only success.

---

## 🟡 MEDIUM

### 5. No rate limiting on public form endpoints
- **Where:** `apply`, `contact`, `waitlist` routes.
- **What:** Open to spam → email flooding, Resend/MailerLite cost, and Anthropic name-normalization cost (apply). 
- **Fix:** Rate-limit by IP/email (e.g. 5/hour). Add a honeypot field.

### 6. Cron secret check is fragile
- **Where:** `src/app/api/manychat/cron/route.ts:438-439`
- **What:** `authHeader !== "Bearer " + process.env.CRON_SECRET`. If `CRON_SECRET` is ever undefined, the literal header `Bearer undefined` passes. Also non-constant-time compare.
- **Fix:** Fail closed if `CRON_SECRET` is missing; use `crypto.timingSafeEqual`.

### 7. Dashboard login compare + cookie hardening
- **Where:** `src/app/api/dashboard/auth/login/route.ts:18`; `src/lib/dashboard/auth.ts:27-30`
- **What:** Password compared with `!==` (timing attack). Cookie `sameSite:'lax'` and `secure` only in prod; 7-day session.
- **Fix:** `crypto.timingSafeEqual`; set `sameSite:'strict'`, `secure:true` always; shorten session.

### 8. Stripe webhook has no idempotency
- **Where:** `src/app/api/stripe-webhook/route.ts`
- **What:** Signature **is** verified (good), but on Stripe retries the same event reprocesses → duplicate emails / MailerLite / invoice side-effects.
- **Fix:** Persist processed `event.id` and skip duplicates.

### 9. Primary CTA is inconsistent across the site
- **What:** SiteNav "Ξεκίνα εδώ" → `/path` on homepage, but `/assessment` on about/work/insights/apply/contact/waitlist, and `mailto:` on corporate. Mixed funnel entry points.
- **Fix:** Decide one primary destination and standardize (or intentionally document the exceptions).

### 10. `/dashboard` not blocked from search engines
- **Where:** `src/app/robots.ts`
- **Fix:** Add `/dashboard` and `/dashboard/*` to disallow.

---

## ⚪ LOW / hygiene

- **`.env.local.save`** — local backup file containing real keys. **NOT committed** (`.gitignore` covers `.env*`), so it's not publicly leaked — but delete it and never commit. If you suspect it was ever pushed, rotate keys.
- **`.DS_Store`** files present → add to `.gitignore`.
- **`sitemap.ts`** missing `/assessment`, `/apply`, `/contact`, `/corporate`.
- **Hardcoded MailerLite group IDs** in `dashboard/leads` → move to env.

---

## ✅ What's already good
- No hardcoded secrets in source; only `NEXT_PUBLIC_SITE_URL` is client-exposed (safe).
- `.env*` is git-ignored (not committed).
- Stripe webhook **does** verify the signature.
- ManyChat **cron** is protected by a Bearer secret.
- All 8 `dangerouslySetInnerHTML` uses are static/trusted (JSON-LD, pixel) — no user input.
- All internal links resolve; all referenced images exist.

---

## Suggested order
_(No critical items — the dashboard is protected. Below are the real, lower-severity items.)_
1. **HIGH:** #3 ManyChat webhook auth, #2 email escaping, #4 OAuth `state` + token-not-in-HTML.
2. **MEDIUM:** #5 rate limiting, #6 cron secret hardening, #7 cookie flags, #8 Stripe idempotency.
3. Consistency + hygiene (#9 CTA, #10 robots, LOW items).

> Verify once: `DASHBOARD_SESSION_SECRET` + `DASHBOARD_PASSWORD` exist in Vercel env.
