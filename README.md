# Secret Queer Club

A member-built directory — searchable and filterable by city, country, age, and height. Built with React, Vite, Tailwind CSS, and Supabase.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your project, open **SQL Editor > New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `profiles` table, its security policies, and the `avatars` storage bucket.
3. Go to **Project Settings > API** and copy the **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env.local` and fill in those two values:

```bash
cp .env.example .env.local
```

## 3. Enable Google sign-in (optional but recommended)

1. In Supabase, go to **Authentication > Providers > Google** and enable it.
2. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth client ID, type "Web application").
3. Add the redirect URL Supabase shows you (looks like `https://<project-ref>.supabase.co/auth/v1/callback`) to the Google OAuth client's **Authorized redirect URIs**.
4. Paste the Google client ID and secret back into the Supabase provider settings.

Email/password sign-up works immediately with no extra setup.

## 4. Run it

```bash
npm run dev
```

## Notes on profile photos

Instagram and LinkedIn no longer allow third-party apps to pull a user's profile photo automatically — both platforms locked that down. Instead, the profile page supports:

- **Upload a photo** — stored in Supabase Storage (`avatars` bucket).
- **Paste a link** — a direct image URL, or a social profile link if you'd rather point people there.

## Project structure

- `src/pages` — Landing, Join (sign up/in), Directory, Profile
- `src/contexts/AuthContext.tsx` — Supabase auth state and actions
- `src/lib/supabase.ts` — Supabase client
- `supabase/schema.sql` — database schema + row-level security policies
