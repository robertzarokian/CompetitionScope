# CompetitionScope

AI-powered competitor analysis reports. A customer describes their company, answers a
short question-by-question intake, and gets a deep competitor breakdown — closest
rivals, their sales strategy, advertising channels, and shared success factors — plus
a prioritized roadmap. A free preview is shown with most of the report blurred; the
full report and a branded PDF unlock for a one-time $26.99 payment.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Zustand** (persisted onboarding answers, client-side)
- **Anthropic API** (`claude-opus-5` + the `web_search` tool) for live competitor research,
  with an automatic **mock/demo fallback** when no API key is configured
- **Stripe Checkout** for payment, with an automatic **demo checkout** fallback when no
  Stripe key is configured
- **pdf-lib** for the branded PDF export
- A flat JSON file (`.data/db.json`) as a lightweight "database" for users, reports, and
  purchases — good enough for a prototype, not for production (see below)
- **jose** + **bcryptjs** for session cookies and password hashing

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no environment variables set,
the whole flow works end to end in **demo mode**:

- Report generation produces a clearly-labeled sample report (no live web research)
- Checkout shows a "demo checkout" card form that unlocks the report without charging
  anything

## Environment variables (for production / live mode)

Create a `.env.local` with any of the following. Each one independently upgrades a part
of the demo experience to the real thing — nothing else needs to change.

| Variable | Effect when set |
|---|---|
| `DATABASE_URL` | **Required.** A Postgres connection string (Neon, Supabase, Vercel Postgres, etc.). Without it, `src/lib/db.ts` throws on first use — there is no file-based fallback anymore. See "Storage" below. |
| `ANTHROPIC_API_KEY` | Report generation calls Claude (`claude-opus-5`) with the `web_search` tool to research real competitors instead of generating a sample report. |
| `STRIPE_SECRET_KEY` | Checkout creates a real Stripe Checkout Session instead of showing the demo payment form. Takes priority over `STRIPE_PAYMENT_LINK` if both are set — this is the fully-verified path (payment is confirmed server-side via the Stripe API). |
| `STRIPE_PAYMENT_LINK` | A middle tier for when you have a Stripe [Payment Link](https://stripe.com/payments/payment-links) but no secret key. Checkout redirects to this URL (with `client_reference_id`/`prefilled_email` appended) instead of showing the demo form. Because a Payment Link is a single static URL with no per-request `success_url`, the reportId is stashed in a short-lived `httpOnly` cookie before redirecting and read back by `/api/checkout/return`, which the Payment Link's Dashboard-configured "after payment" redirect must point to. **Unlike `STRIPE_SECRET_KEY`, this does not cryptographically verify payment** — it trusts that the redirect happened, the same trust level as demo mode. Use `STRIPE_SECRET_KEY` instead if you need real verification. |
| `STRIPE_WEBHOOK_SECRET` | Enables `/api/checkout/webhook` to verify Stripe's `checkout.session.completed` webhook and unlock reports server-side. (Only relevant on the `STRIPE_SECRET_KEY` path — the success-redirect page also verifies the session directly, so purchases still unlock correctly without a working webhook, useful for local testing since Stripe can't reach `localhost`.) |
| `AUTH_SECRET` | Signing secret for session JWTs. A dev-only default is used if unset — **set a real random secret before deploying**. |

### AI visibility audit (`/ai-visibility`)

Every key is optional. A platform or data source is simply switched off until its key is added (`/api/audit/config` reports which are on). `ANTHROPIC_API_KEY` (above) powers the Claude platform and the step that reads each answer.

| Variable | What it enables |
| --- | --- |
| `OPENAI_API_KEY` | Checks ChatGPT through the Responses API with web search. `OPENAI_MODEL` overrides the model (default `gpt-6-astra`, the model used in OpenAI's docs). |
| `PERPLEXITY_API_KEY` | Checks Perplexity through its Agent API (the old Sonar chat endpoint was retired 2026-09-27). `PERPLEXITY_PRESET` overrides the preset (default `fast`). |
| `GEMINI_API_KEY` | Checks Gemini through the Interactions API with Google Search grounding. `GEMINI_MODEL` overrides the model (default `gemini-3.8-flash`). |
| `XAI_API_KEY` | Checks Grok through the Responses API with web search. `XAI_MODEL` overrides the model (default `grok-4.7`). |
| `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Enables the backlinks panel (DataForSEO Backlinks Summary, a few cents per site). Use the API credentials from app.dataforseo.com/api-access, not the account password. |
| `GOOGLE_PAGESPEED_API_KEY` | Recommended. Without it, Google's shared free quota for the speed test is often exhausted. |
| `AUDIT_CLAUDE_MODEL` | Model for the Claude platform and answer reading (default `claude-opus-5`). |
| `AUDIT_DAILY_VISIBILITY_LIMIT`, `AUDIT_DAILY_BACKLINK_LIMIT` | Site-wide daily caps on paid API calls (defaults 400 and 100). Visitors are also limited per hour by IP. |

The ChatGPT, Perplexity, Gemini, Grok, and backlinks adapters were written from each vendor's current docs and tested against mocked responses, not against live accounts. Check each one with a real key before relying on it.

To point a Stripe webhook at local dev, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/checkout/webhook`.

To use `STRIPE_PAYMENT_LINK`, open the Payment Link in the Stripe Dashboard → **After payment** → set a custom confirmation page → `https://<your-domain>/api/checkout/return`. This is a manual one-time Dashboard step; there's no API to configure it from code without a secret key.

## Architecture notes

- **Auth** is a minimal email/password system (bcrypt + JWT cookie), not a full identity
  provider. Sign-up is optional at the start of the flow (skippable via the X) and
  required only at checkout, per the product spec.
- **Storage** is Postgres (`src/lib/db.ts`), accessed via two functions — `readDb()` and
  `updateDb(mutator)` — that every route was originally written against when storage was
  a flat JSON file. Rather than rewrite every call site when swapping to a real database,
  those two functions kept their exact shape: `updateDb` loads all three tables into a
  plain JS object, runs the mutator against it, then upserts users/reports and
  append-inserts any new purchases, all inside one transaction. A
  `pg_advisory_xact_lock` serializes concurrent `updateDb` calls at the database level —
  necessary on serverless, where multiple instances run at once and an in-process lock
  (the original JSON-file version's approach) can't coordinate across them. This is a
  "load the whole table" strategy, fine at prototype scale; if `reports` grows into the
  thousands, swap the full-table reads for targeted per-id queries.
- **Report generation** (`src/lib/anthropic.ts`) prompts Claude to research real,
  verifiable competitors and return strict JSON matching the report schema, validated
  with Zod. If the API key is missing, the call fails, or the response doesn't validate,
  it falls back to `src/lib/mockReport.ts`, which generates a clearly-labeled synthetic
  sample report so the product flow is always demoable.
  - Tuned for latency: `output_config: { effort: "low" }`, `web_search` capped at
    `max_uses: 3`, and the prompt caps every field to a fixed sentence/item count
    (was uncapped high-effort with up to 10 searches, ~5 min/report; now ~65-85s).
  - Claude's web-search citations can come back as `<cite index="...">` tags with
    inconsistently-escaped quotes, which corrupts the surrounding JSON string and
    breaks parsing. `extractJson` strips `<cite>`/`</cite>` tags before parsing
    (in addition to the prompt asking Claude not to emit them) — don't remove this
    without re-testing against real (not mocked) API responses.
- **AI visibility audit** (`src/lib/audit/`, `src/app/api/audit/`, `src/components/audit/`) is a
  free public tool. The browser drives it step by step (website checks, a speed test, then each
  AI platform answering each question twice), so no single request runs long. Each platform is an
  adapter in `providers/` that returns the answer text plus numbered sources; Claude then reads
  each answer into a ranked list of brands and the sources behind each (`extract.ts`), and
  `analysis.ts` rolls everything up. Because visitors are anonymous and the tool spends money,
  every route validates its input, counts usage in Postgres (`src/lib/rateLimit.ts`), and fetches
  visitor-supplied URLs only through `safeFetch.ts`, which blocks private addresses (SSRF).
- **Payments**: `src/app/api/checkout/create` returns `{mode: "stripe"}` or
  `{mode: "demo"}` depending on whether `STRIPE_SECRET_KEY` is set, and the client
  branches accordingly. Report unlocking on the Stripe path is confirmed two ways: the
  webhook (production) and a direct session-verification check on the success-redirect
  page (works without a public webhook URL, e.g. in local dev).
- **PDF export** (`src/lib/pdf.ts`) hand-lays-out the report with `pdf-lib` — cover page,
  executive summary, competitor breakdown, success factors, and roadmap — using the same
  navy/gold CompetitionScope branding as the site.

## Project structure

```
src/
  app/                    Routes (App Router)
    /, how-it-works, pricing,       Static marketing pages (shared header/footer in
    sample-report, faq              components/site). Copy and FAQ answers live in lib/site.ts
    sitemap.ts, robots.ts           Generated sitemap.xml and robots.txt
    onboarding/(questions)/[step]   One question per page, progress bar
    onboarding/loading              Calculating screen -> generates the report
    report/[id]                     Free preview (blurred paywall sections)
    report/[id]/full                Unlocked full report + PDF download
    checkout/[id]                   Payment (Stripe or demo)
    auth, start                     Sign up / log in (skippable vs. required)
    api/                            Route handlers (auth, report, checkout)
  components/              UI components, grouped by feature
  lib/                      Business logic: db, auth, questions, report generation, pdf, pricing,
                            site copy (site.ts), fictional sample report (sampleReport.ts)
```

This is a Next.js project bootstrapped with `create-next-app`. See the
[Next.js documentation](https://nextjs.org/docs) for framework-level questions.
