# Secure deployment (Vercel + Neon)

This setup keeps security off your plate: no servers to harden, HTTPS and encryption handled by the platforms.

## 1. Database: Neon

1. Go to [neon.tech](https://neon.tech) and create an account.
2. Create a new project (e.g. **executive-ai**).
3. Copy the **connection string** (Postgres URL). It looks like:
   `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
4. Keep this for step 3. Neon encrypts data at rest and in transit; you never expose a port.

## 2. Deploy app: Vercel

1. Push this repo to **GitHub** (if you haven’t).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → Import your repo.
3. **Framework**: Next.js (auto-detected). **Root Directory**: leave as-is.
4. **Environment variables** – add these (no quotes in the value box):

   | Name              | Value |
   |-------------------|--------|
   | `DATABASE_URL`    | The Neon connection string from step 1 |
   | `NEXTAUTH_SECRET` | A long random string, e.g. run `openssl rand -base64 32` and paste the output |
   | `NEXTAUTH_URL`    | Your app URL: `https://your-project.vercel.app` (replace with the URL Vercel gives after first deploy) |

5. Click **Deploy**. Wait for the build to finish.
6. After the first deploy, set **NEXTAUTH_URL** to your real URL (e.g. `https://your-project.vercel.app` or your custom domain) and redeploy if needed.

## 3. Run migrations on the production database

Migrations need to run once against the Neon DB. From your **local machine** (with `.env` pointing at the **production** DB, or using the Neon URL only for this):

```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

Or add `DATABASE_URL` to a one-off Vercel env and use a build script that runs `prisma migrate deploy` before build (optional; many teams run migrations from CI or locally as above).

## 4. Optional: custom domain

In Vercel: **Project → Settings → Domains** → add your domain (e.g. `app.yourcompany.com`). Set **NEXTAUTH_URL** to that URL and redeploy.

## 5. Production checklist

- [ ] **Neon**: DATABASE_URL is from Neon (not a local or home DB).
- [ ] **Vercel**: NEXTAUTH_SECRET is a new random value (not from .env.example).
- [ ] **Vercel**: NEXTAUTH_URL is your live app URL (https).
- [ ] **Secrets**: No .env file is committed; all secrets only in Vercel and Neon.
- [ ] **Seed**: Do not run the seed script in production (no default admin account).

Security headers (HSTS, X-Frame-Options, etc.) are already set in this app and apply when deployed to Vercel.
