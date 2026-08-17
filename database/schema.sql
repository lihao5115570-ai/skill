CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  phone VARCHAR(32) UNIQUE NOT NULL,
  age INTEGER,
  city VARCHAR(80),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  membership_level VARCHAR(32) NOT NULL DEFAULT 'free'
);

CREATE TABLE IF NOT EXISTS beauty_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  image_url TEXT NOT NULL,
  face_shape TEXT,
  skin_tone TEXT,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS face_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  face_shape VARCHAR(50),
  eye_shape VARCHAR(50),
  skin_color VARCHAR(50),
  style_type VARCHAR(50),
  analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bloggers (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  platform VARCHAR(80) NOT NULL,
  source_id VARCHAR(160),
  source_url TEXT,
  avatar_url TEXT,
  style VARCHAR(80),
  face_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  follower_count INTEGER,
  liked_count INTEGER,
  work_count INTEGER,
  location VARCHAR(120),
  bio TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bloggers_platform_source_id_unique UNIQUE (platform, source_id),
  CONSTRAINT bloggers_platform_source_url_unique UNIQUE (platform, source_url)
);

CREATE TABLE IF NOT EXISTS makeup_styles (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  style VARCHAR(80),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  suitable_face VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analysis_usage (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  free_limit INTEGER NOT NULL DEFAULT 3,
  used_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_records (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  suitable_style VARCHAR(80),
  suitable_face VARCHAR(80),
  reason TEXT,
  price INTEGER NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  email VARCHAR(160) UNIQUE NOT NULL,
  display_name VARCHAR(120),
  role VARCHAR(40) NOT NULL DEFAULT 'reviewer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role VARCHAR(40) NOT NULL,
  permission_code VARCHAR(80) NOT NULL REFERENCES admin_permissions(code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role, permission_code)
);

CREATE TABLE IF NOT EXISTS blogger_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID,
  reference_type VARCHAR(60) NOT NULL DEFAULT 'female_makeup',
  platform VARCHAR(60) NOT NULL,
  creator_name VARCHAR(160) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  homepage_url TEXT NOT NULL,
  tutorial_url TEXT,
  photo_url TEXT,
  extracted_face_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_content_direction TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  authorization_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_by UUID REFERENCES admin_profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blogger_application_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES blogger_applications(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_profiles(id),
  action VARCHAR(60) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
