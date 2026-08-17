-- 1. First create and confirm this email in Supabase Auth.
-- 2. Then replace the email below and run this SQL in Supabase SQL Editor.

INSERT INTO admin_profiles (email, display_name, role, is_active)
VALUES ('your-admin@example.com', 'Founder Admin', 'super_admin', TRUE)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_active = TRUE,
  updated_at = NOW();
