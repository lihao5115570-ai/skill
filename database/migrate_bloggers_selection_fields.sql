CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS source_id VARCHAR(160);
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS follower_count INTEGER;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS liked_count INTEGER;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS work_count INTEGER;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS location VARCHAR(120);
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS raw_data JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bloggers_platform_source_id_unique'
  ) THEN
    ALTER TABLE bloggers ADD CONSTRAINT bloggers_platform_source_id_unique UNIQUE (platform, source_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bloggers_platform_source_url_unique'
  ) THEN
    ALTER TABLE bloggers ADD CONSTRAINT bloggers_platform_source_url_unique UNIQUE (platform, source_url);
  END IF;
END $$;
