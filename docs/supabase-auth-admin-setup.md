# Supabase Auth + Admin Setup

## 1. Create Supabase project

Create a Supabase project, then copy:

- Project URL
- anon public key
- service role key
- JWT secret

Fill them in local env files:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

Only `NEXT_PUBLIC_*` keys are safe for browser code. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## 1.1 Frontend auth implementation

The frontend currently uses Supabase Auth REST endpoints directly, so it does not require an extra Supabase JS SDK install.

Avoid mixing npm and pnpm for dependency installation. This repository currently uses pnpm workspace layout.

## 2. Enable email confirmation

In Supabase Dashboard:

1. Authentication
2. Providers
3. Email
4. Enable email provider
5. Enable confirm email

For production, configure custom SMTP with Resend or your own SMTP provider.

## 3. Run database SQL

Run these in Supabase SQL Editor:

1. `database/schema.sql`
2. `database/admin_auth_and_blogger_review.sql`

## 4. Create first admin

1. Register your admin email on `/login` or `/plus`.
2. Confirm the email.
3. Open `database/seed_first_super_admin.sql`.
4. Replace `your-admin@example.com` with your real admin email.
5. Run it in Supabase SQL Editor.

This gives the account `super_admin`, including:

- `blogger_review.view`
- `blogger_review.approve`
- `blogger_review.reject`
- `blogger_review.edit_tags`
- `blogger_review.publish`
- `user_manage`
- `payment_review`
- `prompt_manage`
- `report_view`

## 5. Review blogger applications

Frontend applicants submit to:

`POST /api/admin/blogger-applications`

Admin review page:

`admin-panel/bloggers`

The current admin page verifies by email against `admin_profiles`. The next production-hardening step is validating the Supabase JWT on every admin request.
