# NeuroFlow Supabase Setup

## Important

Do not use any old hardcoded project ref from previous handoffs. Always use your own active Supabase project URL and keys from your dashboard.

If you see `DNS_PROBE_FINISHED_NXDOMAIN` for `*.supabase.co`, the project URL in env is invalid or the project was deleted.

---

## Task 1: Run the database schema

1. Open **Supabase Dashboard > SQL Editor**
2. Run `supabase-setup.sql` from the repo root
3. Run `supabase-rate-limit.sql` from the repo root
4. Run `supabase-achievements.sql` from the repo root

This creates all NeuroFlow tables, policies, indexes, triggers, and achievement seed data.

---

## Task 2: Set environment variables

1. In **Supabase Dashboard > Settings > API**, copy:
   - Project URL
   - `anon` key
   - `service_role` key
2. Update `neuroflow/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RATE_LIMIT_BACKEND=auto
ANTHROPIC_API_KEY=sk-ant-...
```

3. Run preflight check:

```bash
pnpm check:env
```

---

## Task 3: Configure auth

### Email

1. Go to **Authentication > Providers**
2. Enable **Email**
3. In **Authentication > Settings**, keep email confirmations enabled

### Google OAuth

1. Go to **Authentication > Providers > Google**
2. Add Google OAuth Client ID/Secret
3. In Google Cloud Console, use redirect URI:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`

### URL configuration

1. In **Authentication > URL Configuration**, set:
   - Site URL: `http://localhost:3000` (or your real app URL)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**`
     - plus your deployed domain equivalents

---

## Verify

```bash
pnpm dev
```

Then check:
1. `/login` loads
2. `/signup` loads
3. Email signup sends confirmation link
4. `/app/today` redirects to `/login` when logged out

---

## Troubleshooting

- `DNS_PROBE_FINISHED_NXDOMAIN` for `*.supabase.co`:
  - Your `NEXT_PUBLIC_SUPABASE_URL` is wrong or points to a deleted project.
  - Get the exact project URL from Supabase dashboard and update env.
- Auth bounces to landing:
  - Confirm callback URL is allowed and project URL matches active app origin.
