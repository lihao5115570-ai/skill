CREATE TABLE IF NOT EXISTS bloggers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'douyin',
  source_id TEXT,
  source_url TEXT,
  avatar_url TEXT,
  style TEXT,
  tags TEXT DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS blogger_profiles (
  id TEXT PRIMARY KEY,
  blogger_id TEXT NOT NULL,
  face_shape TEXT NOT NULL,
  face_length_ratio REAL NOT NULL,
  forehead_width TEXT NOT NULL,
  forehead_height TEXT NOT NULL,
  cheekbone_width TEXT NOT NULL,
  jaw_width TEXT NOT NULL,
  jaw_type TEXT NOT NULL,
  chin_type TEXT NOT NULL,
  eye_shape TEXT NOT NULL,
  eyelid_type TEXT NOT NULL,
  eye_spacing TEXT NOT NULL,
  eye_size TEXT NOT NULL,
  brow_eye_distance TEXT NOT NULL,
  midface_length TEXT NOT NULL,
  nose_type TEXT NOT NULL,
  lip_type TEXT NOT NULL,
  facial_visual_weight TEXT NOT NULL,
  feature_concentration TEXT NOT NULL,
  soft_hard_tendency TEXT NOT NULL,
  style_tendency TEXT NOT NULL DEFAULT '[]',
  makeup_suitable_tags TEXT NOT NULL DEFAULT '[]',
  analysis_version TEXT NOT NULL DEFAULT 'blogger-face-profile-v1',
  confidence_score REAL NOT NULL DEFAULT 0.7,
  review_status TEXT NOT NULL DEFAULT 'approved',
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (blogger_id) REFERENCES bloggers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blogger_images (
  id TEXT PRIMARY KEY,
  blogger_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'avatar',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  FOREIGN KEY (blogger_id) REFERENCES bloggers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blogger_makeup_tags (
  id TEXT PRIMARY KEY,
  blogger_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  created_at INTEGER,
  FOREIGN KEY (blogger_id) REFERENCES bloggers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_face_profiles (
  id TEXT PRIMARY KEY,
  image_hash TEXT,
  analysis_version TEXT NOT NULL,
  face_profile TEXT NOT NULL,
  raw_ai_result TEXT,
  model_name TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  estimated_cost REAL,
  created_at INTEGER NOT NULL,
  UNIQUE(image_hash, analysis_version)
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_face_profile_id TEXT,
  blogger_id TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  dimension_scores TEXT NOT NULL,
  matched_features TEXT NOT NULL,
  different_features TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blogger_profiles_blogger_id ON blogger_profiles(blogger_id);
CREATE INDEX IF NOT EXISTS idx_user_face_profiles_hash ON user_face_profiles(image_hash, analysis_version);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_profile ON recommendation_logs(user_face_profile_id, created_at);
