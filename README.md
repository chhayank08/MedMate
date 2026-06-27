# PrepBud 🩺

An AI-powered study companion for **medical students** — manage tasks, generate
quizzes & summaries from your notes, build exam study plans, run spaced
repetition, and track your performance and weak subjects. Built to feel like a
personal study coach, not just a task manager.

---

## ✨ Features (Phase 1)

- **Auth** — email/password, Google OAuth, password reset, protected routes, profiles.
- **Dashboard** — stat cards, today/upcoming tasks, quick actions, recent scores, weak subjects, daily progress.
- **Tasks & Reminders** — full CRUD, priorities, subjects, due dates, recurring tasks, Today/Upcoming/Completed/Calendar views, and browser reminders (15/30/60-min + custom) via a service worker.
- **AI Summaries** — quick summary, revision notes, exam cheat sheet, key concepts, definitions — **streamed** from OpenRouter and saved to your library.
- **AI Quizzes** — 5/10/20/30 questions, easy/medium/hard, MCQ / true-false / short-answer, optional timed mode, full quiz runner with explanations, and score history.
- **Study Planner** — generate a day-by-day exam plan (interleaving, revision blocks, catch-up days) with a subject-distribution chart; regenerate anytime.
- **Spaced Repetition** — SM-2 scheduling with Easy/Medium/Hard ratings.
- **Analytics** — study-time and accuracy trends, subject performance, revision recall, weak-subject detection, streaks and achievement badges.
- **UX** — light/dark mode, responsive mobile-first layout, skeleton loaders, empty states, toasts.

### Deferred to later phases (schema is already in place)
Notes Vault (file upload/parsing), RAG chat-with-notes (pgvector + embeddings),
flashcards UI, voice capture, AI study-coach insights, and server-side push
(VAPID + scheduled jobs).

---

## 🧱 Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · TanStack Query · React Hook Form + Zod · Recharts · Supabase
(Auth + Postgres + Storage) · OpenRouter (streaming) · Vercel.

> **Note:** This project runs on **Next.js 16**, which renames `middleware` →
> `proxy` (Node.js runtime) and enforces async `cookies()`/`params`. The Supabase
> session handling lives in [`proxy.ts`](./proxy.ts).

---

## 📁 Structure

```
src/
  app/
    (auth)/            login · signup · reset-password
    (dashboard)/       dashboard · tasks · quizzes · summaries · planner · analytics · settings
    api/ai/            quiz · summary · plan   (auth + Zod + rate-limited)
    auth/callback/     OAuth + email-link exchange
  components/          ui (shadcn) · dashboard · tasks · quizzes · summaries · planner · analytics · shared
  hooks/               React Query data hooks (tasks, quizzes, summaries, plans, revisions, profile)
  lib/
    supabase/          client · server · proxy · admin · config
    ai/                openrouter · prompts
    validations/       zod schemas (shared by forms + API routes)
    queries/           server-side aggregations (dashboard, analytics)
  types/               database.types.ts + app aliases
supabase/migrations/   0001_init.sql  (tables, RLS, indexes, triggers, storage)
proxy.ts               session refresh + route protection (Next 16)
```

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20.9+ (tested on 23)
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

### 2. Install
```bash
npm install
```

### 3. Environment
Copy the example and fill in your keys:
```bash
cp .env.local.example .env.local
```
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key)
- `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`

### 4. Apply the database schema
Either with the Supabase CLI:
```bash
supabase db push        # or: supabase link then push
```
…or paste the contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
into the Supabase **SQL Editor** and run it. This creates all tables, enables
Row Level Security with owner-only policies, adds indexes, the new-user profile
trigger, and the private `notes` storage bucket.

### 5. Configure auth providers
In **Supabase → Authentication**:
- **URL Configuration** → add `http://localhost:3000/auth/callback` (and your
  production URL) to *Redirect URLs*.
- **Google** → enable the provider and add your Google OAuth client ID/secret.

### 6. Run
```bash
npm run dev
```
Open http://localhost:3000.

> (Optional) regenerate exact DB types after migrating:
> `npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts`

---

## 🤖 AI configuration

All model calls go through [`src/lib/ai/openrouter.ts`](./src/lib/ai/openrouter.ts)
(server-only). Set `OPENROUTER_MODEL` to any model id from OpenRouter. Summaries
stream as text; quizzes and study plans are returned as **Zod-validated JSON**
and persisted server-side.

---

## 🔒 Security

- **Row Level Security** on every table — users can only access their own rows.
- API routes verify the session (`getUser`), validate input with **Zod**, and apply a per-user **rate limit**.
- Secrets (`OPENROUTER_API_KEY`, service key) are server-only and guarded with `server-only`.
- AI markdown is rendered without raw HTML (no XSS).
- The in-memory rate limiter suits a single instance / local dev. For multi-instance Vercel, swap `src/lib/rate-limit.ts` for Upstash Redis (`@upstash/ratelimit`).

---

## ☁️ Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (framework auto-detected).
2. Add all environment variables from `.env.local` in **Project → Settings → Environment Variables**, and set `NEXT_PUBLIC_SITE_URL` / `OPENROUTER_SITE_URL` to your production URL.
3. Add `https://<your-domain>/auth/callback` to Supabase Redirect URLs.
4. Deploy. AI routes are configured for up to 60s in [`vercel.json`](./vercel.json).

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |
