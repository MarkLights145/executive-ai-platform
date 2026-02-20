# Executive AI – Run steps

**Prisma 6.x** (classic engine; no adapter/accelerate). Connection URL is in `schema.prisma` via `env("DATABASE_URL")` and `.env`.

## Reset sequence (full reinstall after downgrade or engine issues)

1. Stop the dev server (Ctrl+C).
2. Run:

```bash
cd ~/openclaw-core/executive-ai-platform
rm -rf .next node_modules node_modules/.prisma
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

3. Confirm **http://localhost:3000/api/auth/session** returns 200 JSON. No adapter/accelerate errors; login works.

**Migration caveat:** Use `npx prisma migrate deploy` when the remote DB already has the schema applied—it only applies pending migrations (no data loss). Use `npx prisma migrate dev` only when creating new migrations locally; do not run `migrate dev` if you only want to sync an existing DB.

---

## 1. Install dependencies

```bash
cd ~/openclaw-core/executive-ai-platform
npm install
npm install bcryptjs tsx
npm install -D @types/bcryptjs
```

## 2. Environment

Ensure `.env` has:

- `DATABASE_URL` – your Postgres connection string (already set)
- `NEXTAUTH_SECRET` – random string for JWT signing (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_URL` – in dev use `http://localhost:3000`

## 3. Database

```bash
# Generate Prisma client (Prisma 6 classic engine)
npx prisma generate

# With existing remote DB: apply pending migrations only (no data loss)
npx prisma migrate deploy

# Optional: create new migrations in dev (use only when changing schema)
# npm run migrate

# Seed admin user for local testing (dev only)
npx tsx prisma/seed.ts
```

After seed: sign in with **admin@example.com** / **password**.  
**Production:** Disable or remove the seed script so that no default admin@example.com account exists.

## 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Test login and protected routes

1. **Landing** – Go to `/`. Click “Get started” or “Sign in”.
2. **Onboard** – Go to `/onboard`. Complete the wizard (individual or org, name, email, password + confirm, preferences). Submit. A real account is created; you are signed in automatically and sent to `/app`.
3. **Sign in** – Go to `/login`. Use either:
   - **Seeded admin (dev):** admin@example.com / password  
   - **Onboarded user:** the email and password you set in onboarding  
4. **Protected routes:**
   - Visit `/app` – should show the user dashboard (redirects to `/login` if signed out).
   - Visit `/org` – if your user has role `ADMIN`, you see the org dashboard; otherwise you’re redirected to `/app`.
5. **Sign out** – Use “Sign out” in the header, then try `/app` again; you should be redirected to `/login`.

---

## Onboarding & account creation – manual test steps

Use these steps to verify the secure onboarding flow:

1. **New signup creates user/org and lands on /app**
   - Open http://localhost:3000/onboard (signed out).
   - Step 1: Choose Individual or Organization (if Organization, enter org name).
   - Step 2: Enter name, email, password (≥10 chars), confirm password, optional Telegram.
   - Step 3: Select preferences and optional feature request.
   - Step 4: Review, click Submit.
   - Expect: After submit, you are signed in and redirected to `/app` (no “Sign in” screen).

2. **Session shows user and organizationName**
   - While signed in, open http://localhost:3000/api/auth/session.
   - Expect: JSON with `user` including `email`, `role`, and `organizationName` (or equivalent org data).

3. **Duplicate email returns friendly error**
   - Run the onboard wizard again using the **same email** as in step 1.
   - Expect: Submit returns an error (e.g. “An account with this email already exists…”) and **no** new user or org is created. No redirect to `/app`.

4. **Password never logged**
   - Confirm in code/logs: the onboard API and any middleware do not log the request body or the `password` field (only log non-sensitive errors if needed).

5. **Validation**
   - On step 2, try Next with invalid email (e.g. `x`) → expect inline error.
   - Try password &lt; 10 chars or password ≠ confirm → expect inline error.
   - Fix and proceed; submit with valid data → expect redirect to `/app`.

## Optional: Prisma seed via package.json

To run seed with `npx prisma db seed`, add to `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Then: `npx prisma db seed`.
