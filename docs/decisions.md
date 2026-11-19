# Decisions and trade-offs

Why the project is built the way it is, and what each choice costs. The
README has the short version.

## Stack

| Choice | Considered | Why this one |
| --- | --- | --- |
| Next.js 16, App Router | React + Vite, Remix | The property page is mostly static data, so Server Components keep client JavaScript small, and the API routes live next to the pages. With Vite, server rendering and the API would need a separate server. |
| TypeScript, strict | | Prisma types and Zod schemas only pay off with strict checks. |
| Tailwind CSS 4 + shadcn/ui | Material UI, Chakra | shadcn copies Radix-based components into the repo, so they are accessible by default and fully editable, with no UI library to upgrade. |
| PostgreSQL + Prisma 7 | SQLite, MongoDB, Drizzle | Serverless hosts have an ephemeral filesystem, which rules out SQLite. The data is relational. Prisma's migration tooling is more mature than Drizzle's. |
| Vercel AI SDK 6 | Anthropic SDK, LangChain | Streaming to the browser, `useChat` and schema-checked output come built in. LangChain is far more than this needs. The SDK is provider-agnostic, so the model can change without rewriting the calls. |
| Claude Sonnet 4.6 | Opus, Haiku, other providers | Fluent Brazilian Portuguese and strict instruction-following, which the anti-hallucination rules depend on. Opus costs more for no visible gain here, and Haiku looked like a risk for answers about real places. |
| Google Places API (New) | Foursquare, OpenStreetMap, Yelp | The best coverage of Brazilian venues for the effort. |
| Vitest | Jest | Native ESM and TypeScript, little configuration. |

## Data model

The property code is the primary key and the URL. `/mao001` and `/MAO001`
resolve to the same page, and a code with the wrong shape gets the 404 page
instead of an error.

Address, access, rules, amenities and host are stored as JSON columns. They
vary per property and are always read whole, so separate columns would add
migrations without adding queries. `lib/types/property.ts` types them, and the
cast happens once, in the service.

Locations stop at the neighborhood. All properties and hosts are fictional,
and the demo never stores an exact address. A guest who asks the chat for the
address is sent to the host, and map links open the region.

The guide cache is its own table, one row per property, and it is
re-validated on read. A cached guide that no longer matches the Zod schema is
treated as missing and generated again, so a schema change can't serve a
broken guide.

## Local guide

The model fills `ExperienceGuideSchema`: 4 to 5 restaurants, 3 to 4
attractions, at least 2 essentials and a tip for the current month, at
temperature 0.4 with up to 2,000 output tokens.

There are two modes. With `GOOGLE_PLACES_API_KEY`, the service first fetches
real restaurants, attractions and essentials near the property, and the prompt
only allows picking from that list. Without the key, or when Places fails, the
model works from its own knowledge under a stricter prompt that names the kind
of invention to avoid. It still makes up plausible names in smaller cities
that way, so the public demo should run with the key.

The guide is generated on the first visit and then cached. The first visitor
waits 20 to 30 seconds behind a skeleton; everyone after gets the cached
guide.

Only the guide route generates. The chat reads the cached guide and answers
from the property data alone until the guide exists. An earlier version let
both generate and used a Postgres advisory lock to avoid generating twice.
That lock held a database transaction open during a 30-second model call, so
I replaced it with a single generation path.

## Chat

All the data goes in the system prompt. One property and its guide fit easily
in context, so there is no retrieval step. Blocks are separated with `═══`
lines, which the model parsed more reliably than markdown headers while I
iterated on the prompt.

Answers are short and conservative: temperature 0.2 and up to 300 output
tokens.

When the data has no answer, the model replies with a set sentence that sends
the guest to the host's name and phone. The phone goes into the prompt already
formatted, so the chat and the page show the same number.

Two rules came from failures. Early versions assumed a doorman or a front desk
that the data didn't mention, which led to the rule against assuming services.
They also paraphrased venue names or added nearby places, which led to the
strict citation rule: name places exactly as the guide lists them, and nothing
else.

The history the browser sends is not trusted. The route keeps only user and
assistant text, and a `system` message or a file part sent by a client is
dropped before the model sees it.

## Cost protection

The guide and the chat call a paid model from a public page.

The counters live in Postgres because serverless instances don't share memory.
Each count is one `INSERT … ON CONFLICT … RETURNING`, so concurrent requests
can't read the same value.

Every window is a UTC day. Fixed windows are the simplest thing that works;
the trade-off is that a visitor can use two days' quota around midnight UTC.

The visitor IP is the rightmost `X-Forwarded-For` entry. The deploy proxy
appends the address it saw, so only the last entry can't be forged. This
assumes exactly one proxy in front of the app. Counters store a hash of the
IP, never the IP.

The per-conversation limit counts the history the client sends. The
conversation only exists in the browser, so a counter keyed by conversation id
would be bypassed by changing the id. The per-IP counter is what bounds a
visitor; the conversation limit bounds the size of each request.

Past a chat limit, the route streams a short assistant message instead of an
HTTP error, so the guest sees the reason in the conversation. The guide route
returns 429 with a message the page shows.

The budget is checked before each call. Calls already in flight can push the
day's total past the budget by a few calls, and the tokens of a reply the
guest aborts may not be recorded.

## Evals

Code checks every answer it can: exact Wi-Fi data, the check-in time, a
refusal, a reference to the host, and numbers or prices the data doesn't
contain. An LLM judge answers one question only: does the answer name a place
outside the guide?

The evaluated guide is a fixture with invented restaurant names, so the
allowed places are known exactly. One property runs with no guide, to check
that the chat doesn't invent restaurants when it has none.

The evals need no database. The property data lives in `prisma/properties.ts`,
shared by the seed and the evals, and the evals use the app's prompt builder
and model settings.

Every run calls the paid API, so in CI the evals workflow only runs when
started by hand. The evals call the model directly, so they don't count
against the app's daily budget.

## Accessibility

The primary green (`#1f5c46`) on white is about 7.8:1, above WCAG AAA for body
text. Focus is visible on every link and button, and the one decorative
animation (the reflection on the landing page) only runs when the visitor
hasn't asked for reduced motion.

## Out of scope

Authentication, more than one host, booking, real-time updates and languages
other than Brazilian Portuguese.
