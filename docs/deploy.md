# Deploy

The demo runs on Vercel with a Neon Postgres database created through
Vercel's Neon integration. Every push to `main` deploys to production.

## What the build does

Vercel runs the `vercel-build` script instead of `build`:

```bash
prisma migrate deploy && prisma db seed && next build
```

Migrations run first, then the seed upserts the four properties, so
production always matches `prisma/properties.ts`. The landing page is
prerendered from the database during `next build`, which is why the database
has to be connected before the first successful build.

Migrations use `DATABASE_URL_UNPOOLED` (a direct connection), because they
need session features that Neon's connection pooler doesn't keep. The app
itself uses the pooled `DATABASE_URL`. The integration sets both.

## First deploy

You need a Vercel account connected to GitHub, an Anthropic API key and,
optionally, a Google Cloud key with **Places API (New)** enabled.

1. In Vercel, **Add New → Project** and import `ai-guest-guide`. Keep the
   detected Next.js settings. The first build fails because there is no
   database yet; that is expected.
2. In the project, **Storage → Create Database → Neon**. Pick the region
   closest to the Vercel functions (US East by default) and connect it to the
   Production and Preview environments. This adds `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED` and the `PG*` variables.
3. In **Settings → Environment Variables**, add for Production:

   | Variable | Value |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | the Anthropic key |
   | `GOOGLE_PLACES_API_KEY` | the Places key (optional; without it the guide runs in fallback mode) |
   | `DAILY_TOKEN_BUDGET` | `500000`, or whatever the day's budget should be |

4. **Deployments → the failed deployment → Redeploy.** The build now
   migrates, seeds and builds.
5. Generate the four guides once, so the first visitors get them from the
   cache. Visiting each property page does it, or:

   ```bash
   for code in MAO001 ADC001 PFG001 NAI001; do
     curl -s -o /dev/null -w "$code %{http_code}\n" -X POST \
       https://<your-domain>/api/generate-guide \
       -H 'content-type: application/json' -d "{\"code\":\"$code\"}"
   done
   ```

   Each request takes 20 to 30 seconds and counts against the per-IP limit
   of 5 generations a day. Four fit, as long as nobody on the same network
   opens the pages while they generate: a guide still being generated can be
   generated twice.

## Checking the limits in production

These checks don't call the model.

```bash
URL=https://<your-domain>

# A question over 1,000 characters is refused in the chat.
curl -s -X POST $URL/api/chat -H 'content-type: application/json' \
  -d "{\"code\":\"MAO001\",\"messages\":[{\"id\":\"1\",\"role\":\"user\",\"parts\":[{\"type\":\"text\",\"text\":\"$(printf 'a%.0s' $(seq 1001))\"}]}]}"

# A cached guide is served without counting against any limit.
curl -s -X POST $URL/api/generate-guide -H 'content-type: application/json' \
  -d '{"code":"MAO001"}' | head -c 120
```

The per-IP and daily-budget counters are rows in the `usage_counters` table,
one per key and UTC day, which the Neon console's SQL editor can show:

```sql
SELECT key, count FROM usage_counters ORDER BY key;
```

## Changing settings

Environment variables only reach new deployments. After changing
`DAILY_TOKEN_BUDGET` or a key, redeploy the latest production deployment.

Keep database branching for preview deployments on in the Neon integration
settings, so preview builds migrate and seed their own branch instead of the
production database. Previews are behind Vercel Authentication by default,
so the public can't spend the API key through them.

## Adding the Places key later

Guides generated without `GOOGLE_PLACES_API_KEY` stay cached, so adding the
key doesn't change them by itself.

1. Add `GOOGLE_PLACES_API_KEY` for Production and redeploy.
2. In the Neon console's SQL editor, drop the cached guides and today's
   generation counters:

   ```sql
   DELETE FROM generated_guides;
   DELETE FROM usage_counters WHERE key LIKE 'guide:%';
   ```

3. Generate the four guides again, as in step 5 of the first deploy.

## If a preview build fails at `prisma migrate deploy`

The Neon integration has been reported to create preview branches with roles
that can't log in, which makes the migration step fail on previews while
production works. Check the role in the preview's `DATABASE_URL_UNPOOLED` in
the Neon console and reconnect the integration. Don't turn off preview
branching to get around it: previews would then migrate and seed the
production database.
