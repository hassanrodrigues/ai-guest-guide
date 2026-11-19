# AI Guest Guide

A guest guide for each short-term rental property, with the stay details, a
local guide written by AI and a chat that answers only from the property's
data.

**Live demo:** https://ai-guest-guide.vercel.app

<!-- DEMO GIF: record the property page and the chat, save it as
docs/demo.gif and replace this comment with:
![Property page and chat](docs/demo.gif) -->

## Context

This project started as my solution to Seazone's AI Builder Challenge (June 2026). I later rebuilt it as an independent project, with fictional properties and branding, automated evals and CI. It is not affiliated with Seazone.

The host brand, Igapó, and its four properties in the Amazon region are
invented. The guest-facing interface is in Brazilian Portuguese.

## How it works

Each property has its own page at `/<code>`, for example `/MAO001`. The page
shows what a guest needs at the door (check-in and check-out, Wi-Fi, access,
parking), the house rules, the amenities and the host's contact. Two parts use
the model.

### The local guide

On the first visit the page asks for the property's guide: a welcome message,
restaurants, attractions, essentials such as pharmacies and markets, and a
tip for the current month. The guide is generated once, checked against a
Zod schema and cached in Postgres; every later visit reads the cache.

With `GOOGLE_PLACES_API_KEY` set, the app first fetches real venues near the
property from Google Places, and the model may only pick from that list. It
writes the descriptions and estimates distances, but it can't add a place.

Without the key, or when Places fails, the model uses what it knows, under a
stricter prompt that tells it to leave a place out when it isn't sure. That
still works, but in smaller cities it can make up plausible names. The live
demo runs without a Places key for now, so its guides, especially for the
smaller towns, may list places that don't exist.

### The chat

The chat gets the property data and the cached guide in its system prompt,
and nothing else. It follows 9 rules:

1. Gives the exact Wi-Fi network and password.
2. Answers pet questions according to the property's rule.
3. Gives the property's check-in time.
4. Recommends restaurants only from the local guide.
5. Doesn't invent codes, prices or rules missing from the data, and sends the
   guest to the host instead.
6. Doesn't assume services or amenities the data doesn't list, such as a
   doorman or breakfast.
7. Declines questions unrelated to the stay.
8. Keeps its role and its data when the guest tries to override its
   instructions.
9. Names only places listed in the guide, even when asked about others.

## Architecture

![Architecture](docs/architecture.svg)

The pages and the two API routes call a small service layer in
`lib/services`. Only `guide.service` generates guides; the chat route reads
the cached guide and streams its answer from the Anthropic API.
`usage.service` keeps the cost limits in Postgres. Prompts live in
`lib/ai/prompts` as plain functions of the property data, so they are
versioned and unit-tested like any other code.

## Evals

The 9 chat rules are checked against the real model by an eval suite:
31 questions, 3 or 4 per rule, including attempts to get an invented price,
code or rule and four prompt injections. Code checks each answer whenever it
can; an LLM judge is used only to find places named outside the guide.

```bash
npm run evals                      # needs ANTHROPIC_API_KEY, about 80 seconds
EVALS_TARGET=0.95 npm run evals    # pass rate to reach, default 0.9
```

The last run passed 31 of 31 cases. Every question and answer is in
[docs/evals.md](docs/evals.md). In GitHub Actions, the evals run only when
started by hand, since each run calls the paid API.

## Cost protection

The guide and the chat call a paid model from a public page, so the demo has
limits:

| Limit | Value |
| --- | --- |
| Chat questions per IP per day | 40 |
| Questions per conversation | 20 |
| Characters per question | 1,000 |
| Guide generations per IP per day | 5 (a cached guide never counts) |
| Tokens per day for the whole app | `DAILY_TOKEN_BUDGET`, default 500,000 |

Every model call records the token usage the AI SDK reports. Once the day's
total reaches the budget, the guide and the chat stop calling the model and
say the demo is back tomorrow. Past a chat limit, the guest gets the reason as
a reply in the chat, with the host's contact.

The counters live in Postgres, so every server instance sees the same
numbers. The visitor IP comes from the rightmost `X-Forwarded-For` entry,
the one the deploy proxy writes, and only a hash of it is stored.

## Stack

- Next.js 16 (App Router), React 19, TypeScript in strict mode
- Tailwind CSS 4 and shadcn/ui
- PostgreSQL with Prisma 7
- Vercel AI SDK 6 with Claude Sonnet 4.6
- Google Places API (New), optional
- Vitest for unit tests, GitHub Actions for CI

## Running locally

Requirements: Node.js 22.9 or later, PostgreSQL 14 or later, and an
Anthropic API key.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and ANTHROPIC_API_KEY
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000 and pick a property. A local Postgres in Docker is
enough:

```bash
docker run -d --name ai-guest-guide-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ai_guest_guide postgres:16-alpine
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_guest_guide"
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | yes | Guide generation and chat |
| `GOOGLE_PLACES_API_KEY` | no | Grounds the local guide in real places from Google Places |
| `DAILY_TOKEN_BUDGET` | no | Tokens the whole app may spend per day (UTC) before the guide and chat stop calling the model. Default: 500000 |

Scripts:

- `npm run dev`: development server
- `npm run build`: production build
- `npm run lint` / `npm run typecheck`
- `npm test`: unit tests (Vitest)
- `npm run evals`: checks the chat's 9 rules against the real model and writes [docs/evals.md](docs/evals.md)
- `npm run db:reset`: drop, migrate and seed the database

## Decisions and trade-offs

The full reasoning is in [docs/decisions.md](docs/decisions.md). In short:

- One property and its guide fit in the model's context, so the chat prompt
  carries all the data and there is nothing to retrieve.
- Prompt rules alone didn't stop the model from inventing venues in smaller
  cities. Restricting it to real Places results did.
- Two chat rules came from real failures: answers that invented a doorman led
  to the rule against assuming services, and answers that renamed restaurants
  led to the strict citation rule.
- Only the guide route generates guides. The chat reads the cache, which
  avoided a database lock held open during a 30-second model call.
- Limits are counted in Postgres, per IP and per UTC day. Fixed windows are
  simple and every instance shares them; the cost is some slack around
  midnight UTC.
- The evals check answers in code first. The judge model only decides whether
  free text names a place outside a list.
- Property data sits in JSON columns because it varies per property and is
  always read whole.

## Limitations and next steps

- The live demo has no Google Places key yet. Adding one and regenerating the
  guides ([docs/deploy.md](docs/deploy.md)) would ground them in real venues.
- The guide and the chat are only in Portuguese; tourists would need English
  and Spanish versions.
- There is no host dashboard: properties come from the seed script.
- Move guide generation from `generateObject`, deprecated in AI SDK 6, to
  `generateText` with `Output.object`, and keep the SDK up to date.
- Two first visits to the same property at the same moment can both generate
  its guide. A per-property lock would fix it if the token counter shows it
  happening.
- Counter rows from past days are never deleted.
- The chat sends the guest's history from the browser on every question;
  long conversations cost more input tokens, which is why they're capped at
  20 questions.
