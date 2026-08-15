-- Scout: initial schema
-- Safe to re-run: every statement is IF NOT EXISTS.
-- Mirrors lib/db/schema.ts. Run once against a fresh database.

CREATE TABLE IF NOT EXISTS leads (
  id               serial PRIMARY KEY,
  business_name    text NOT NULL,
  niche            text,
  city             text,
  address          text,
  phone            text,
  maps_url         text,
  website_url      text,
  domain           text UNIQUE,
  rating           numeric,
  review_count     integer,
  badness_score    integer NOT NULL DEFAULT 0,
  verdict          text,
  issues           jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence         text,
  pitch_angle      text,
  outreach_draft   text,
  has_website      boolean NOT NULL DEFAULT true,
  source           text NOT NULL DEFAULT 'web_search',
  status           text NOT NULL DEFAULT 'new',
  notes            text,
  audited_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hunts (
  id                 serial PRIMARY KEY,
  niche              text NOT NULL,
  city               text NOT NULL,
  source             text NOT NULL DEFAULT 'web_search',
  status             text NOT NULL DEFAULT 'running',
  businesses_checked integer NOT NULL DEFAULT 0,
  leads_found        integer NOT NULL DEFAULT 0,
  summary            text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS targets (
  id         serial PRIMARY KEY,
  niche      text NOT NULL,
  city       text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dashboard sorts by score and filters by status/city.
CREATE INDEX IF NOT EXISTS leads_badness_idx ON leads (badness_score DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_city_niche_idx ON leads (city, niche);
