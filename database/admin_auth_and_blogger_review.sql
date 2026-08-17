CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

INSERT INTO admin_permissions (code, name, description) VALUES
  ('blogger_review.view', '查看博主申请', '查看博主入驻申请列表和详情'),
  ('blogger_review.approve', '通过博主申请', '审核通过后发布到正式博主库'),
  ('blogger_review.reject', '驳回博主申请', '驳回不合规或资料不足的申请'),
  ('blogger_review.edit_tags', '编辑博主标签', '调整风格、脸型、内容方向标签'),
  ('blogger_review.publish', '发布到博主库', '把审核通过的申请写入 bloggers 表'),
  ('user_manage', '用户管理', '查看和管理用户资料'),
  ('payment_review', '支付审核', '查看订单和手动确认付款'),
  ('prompt_manage', '提示词管理', '管理 AI 提示词和分析策略'),
  ('report_view', '报告查看', '查看用户分析报告')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO admin_role_permissions (role, permission_code)
SELECT 'super_admin', code FROM admin_permissions
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role, permission_code) VALUES
  ('reviewer', 'blogger_review.view'),
  ('reviewer', 'blogger_review.approve'),
  ('reviewer', 'blogger_review.reject'),
  ('reviewer', 'blogger_review.edit_tags'),
  ('reviewer', 'blogger_review.publish')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS blogger_applications_status_created_idx
  ON blogger_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_profiles_auth_user_id_idx
  ON admin_profiles (auth_user_id);
