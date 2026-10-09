# Queer Club

A members-only community directory for queer people to find friends, dates, and connections. Members build a profile, browse and filter the directory, and message each other.

**Live:** [queer-club.vercel.app](https://queer-club.vercel.app)

## Features

- **Auth:** email/password and Google sign-in via Supabase Auth.
- **Profiles:** up to 5 photos plus an optional video (Supabase Storage), demographics, and an interests picker where members can pick existing interests or create new ones.
- **Directory:** search plus filters for country, city, age, height, relationship status, and interests (multi-select). Cards have swipeable photo carousels.
- **Visibility rules enforced in the database:** a member's profile is only returned to viewers whose identity matches who the member is interested in, using Postgres row-level security rather than client-side hiding.
- **Messaging:** direct messages between members, unread indicators, and favorited conversations pinned to the top.
- **Landing page:** an animated globe with one dot per city that has members, sized by member count. Tapping a dot shows the city and links to the directory filtered to it.

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router |
| Backend | Supabase (Postgres, Auth, Storage, row-level security) |
| Hosting | Vercel |
| Lint | oxlint |

## Design notes

- **Row-level security does the access control.** The profiles `select` policy checks the viewer's identity against the profile's `interested_in`. To avoid the policy recursively querying the table it protects, the viewer's identity comes from a `security definer` function (`public.my_identity()`). See [`supabase/schema.sql`](supabase/schema.sql).
- **Photos are kept backward compatible.** `photos` is an array, and `photo_url` is kept in sync with the first entry so older rows and code paths keep working.
- **Mobile touch behavior is handled explicitly.** The photo carousel uses native scroll-snap, and the interests picker avoids patterns that misbehave on iOS Safari (for example, interactive controls inside a `<label>`).
- **The globe layout is computed, not hand-placed.** City dots are spread across the header with a low-discrepancy (Halton) sequence while keeping a clear zone around the globe, so any number of cities gets its own dot.

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, security policies, and the `avatars` storage bucket.
3. Copy the project URL and anon key (Project Settings, API) into `.env.local`.
4. Optional, for Google sign-in: enable the Google provider under Authentication, create OAuth credentials in Google Cloud, and add Supabase's callback URL as an authorized redirect URI.

Other scripts: `npm run build` (type-check and build), `npm run lint`.

## Project structure

```
src/
  pages/        Landing, Join, Directory, MemberProfile, Profile, Messages
  components/   GlobeHero, Logo, PhotoCarousel, TagSelect, Navbar, ProtectedRoute
  contexts/     AuthContext (Supabase auth state and actions)
  lib/          Supabase client, height helpers
supabase/
  schema.sql    Tables, row-level security policies, storage bucket
```

## Known gaps and next steps

- No automated tests yet. Core flows (auth, visibility rules, messaging) were verified manually and with ad-hoc browser tests.
- The directory loads all visible profiles and filters in the browser. That's fine at this size, but it needs server-side filtering and pagination before the member count grows.
- Messages refresh on load rather than in real time. Supabase Realtime would be the natural upgrade.
- No moderation, blocking, or reporting tools yet, which a real community product would need before launch.
