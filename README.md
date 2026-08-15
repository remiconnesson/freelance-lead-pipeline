# Scout — freelance lead pipeline

An [eve](https://www.npmjs.com/package/eve) agent that hunts for local businesses with bad
websites, scores how bad they are, and files them as leads you can work through in a dashboard.
Built for web-designer freelance prospecting.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fremiconnesson%2Ffreelance-lead-pipeline&project-name=freelance-lead-pipeline&repository-name=freelance-lead-pipeline&env=DATABASE_URL&envDescription=Postgres%20connection%20string%20(Neon%20recommended)&envLink=https%3A%2F%2Fgithub.com%2Fremiconnesson%2Ffreelance-lead-pipeline%23environment-variables)

After the first deploy, run the schema once against your database — the app will show an
error until the tables exist:

```bash
psql "$DATABASE_URL" -f scripts/001-init-schema.sql
```

The script is idempotent, so it is safe to re-run.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Neon works out of the box; adding the Neon integration to your Vercel project sets this for you. |
| `AI_GATEWAY_API_KEY` | no | Only needed if the deployment is not on Vercel. Vercel deployments authenticate to the AI Gateway automatically via OIDC. |

There is no `GOOGLE_MAPS_API_KEY`. Discovery is deliberately web-search only — see below.

## How it works

1. **Discover** — the agent turns a niche + city into a set of web searches and collects candidate
   businesses, including ones whose only presence is a directory listing.
2. **Audit** — it fetches each site and scores it 0–100 on hard signals: no mobile viewport, slow
   load, stale copyright, missing H1, no contact details, no booking form, builder templates,
   dead domains.
3. **File** — each lead is saved with its score, verdict, issue list, evidence, and a pitch angle.
4. **Review** — the dashboard sorts by score and filters by status, city, and niche. Open a lead
   for the full breakdown and an AI-drafted outreach email.

Hunts run on demand from the console, or automatically each day against your saved targets.

### Why not the Google Maps Places API

It was considered and dropped. Google Maps Platform terms do not allow storing Maps content
(business names, addresses, ratings) in a permanent database — only `place_id` may be kept
indefinitely, with lat/lng cached for up to 30 days. A durable lead pipeline is exactly the
warehousing those terms prohibit. Requesting `websiteUri` also bills at the Enterprise tier
($35/1,000 calls, 1,000 free per month), and that field is the one this whole app depends on.
Web search has neither restriction.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then set DATABASE_URL
psql "$DATABASE_URL" -f scripts/001-init-schema.sql
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Layout

```
agent/
  agent.ts            eve agent definition
  instructions.md     agent behaviour and scoring rubric
  tools/              find_businesses, audit_website, save_lead, ...
  schedules/          daily hunt across saved targets
app/                  dashboard (server components + server actions)
components/           table, lead detail, score meter, hunt console
lib/db/schema.ts      Drizzle schema (source of truth)
scripts/              SQL migrations
```

## A note on access

The eve web channel is configured with `none()` auth, so anyone with the deployment URL can run
hunts and read the pipeline. That is fine for a private link, but add real authentication before
sharing it — the database holds scraped contact details and outreach drafts.

## Built with v0

This repository is linked to a [v0](https://v0.app) project.

[Continue working on v0 →](https://v0.app/chat/projects/prj_X8M2vAhSd3ZnlcPn9LRohUUPENYO)
