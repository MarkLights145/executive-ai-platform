# Post-deploy verification and security

## 1) Verify Add User flow end-to-end

**What to do:**

1. **Log in as an admin** (account that has Organization + Users in the sidebar).
2. Go to **Users** (sidebar → Users).
3. Click **Add user**.
4. In the modal, click **Generate invite code**. You should see a code (e.g. `ABC12XYZ`), expiry, and Copy buttons.
5. Copy the code (or copy code + instructions).
6. Open the **onboarding page** in an incognito/other browser (or different browser): your app’s `/onboard` URL.
7. On step 1, click **Sign up with invite code**.
8. Paste the code, click **Continue**. You should see “Create your account” and “You’re joining &lt;Org name&gt;”.
9. Fill **Name**, **Email**, **Password**, **Confirm password**, optionally **Telegram username**. Click **Create account**.
10. You should see the success screen; click **Go to your dashboard** and land in the app as that user.
11. **Persistence:** Log back in as **admin**. Go to **Users**. The new user should appear in the list. Refresh the page; they should still be there.

**If something fails:**

- **Browser:** Open DevTools (F12) → **Console** for JS errors; **Network** for failed requests (status 4xx/5xx, response body).
- **Vercel:** Dashboard → your project → **Logs** (or **Deployments** → select deployment → **Functions** / **Runtime Logs**). Check for Prisma/DB errors or 500s.
- **Common issues:** 403 on POST /api/invite-codes (not admin); 400 on POST /api/onboard (invalid/used/expired code); 500 (DB or migration issue — run migration, see below).

---

## 2) Prisma / schema errors — run migration

From the **app root** (where `prisma/schema.prisma` lives):

```bash
cd executive-ai-platform
npx prisma migrate deploy
```

Uses `DATABASE_URL` from the environment (Vercel has it; locally use `.env`). Ensures all pending migrations are applied. If you see “no pending migrations,” the DB is up to date.

---

## 3) Cleanup: single DATABASE_URL in .env

Your `.env` had two `DATABASE_URL` entries. To keep only Neon and remove the other:

1. Open `executive-ai-platform/.env`.
2. **Remove or comment out** the line with the **non-Neon** URL (e.g. the one pointing at `db.prisma.io` or any other host). Put `#` at the start of the line to comment it.
3. Ensure **exactly one** uncommented line:  
   `DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require..."`  
   (the Neon connection string).
4. Save the file. Restart the local dev server if it’s running.

Result: only one active `DATABASE_URL` (Neon). No duplicate.

---

## 4) Security: rotate Neon credentials after exposure

Do this if a DB URL or credentials were exposed (e.g. in chat, logs, or repo).

**A. Rotate in Neon**

1. Go to [Neon Console](https://console.neon.tech) and sign in.
2. Select the project that holds `neondb` (or your DB).
3. Open **Settings** (or **Project settings**) → **Connection string** / **Database** (or **Reset password**).
4. Use the option to **reset the database password** / **rotate credentials** (wording may vary). Generate a new password; Neon will show a **new connection string**.
5. Copy the new connection string **only into a secure place** (password manager or local file that is gitignored). Do **not** paste it into chat, logs, or commit it.

**B. Update Vercel**

1. Vercel Dashboard → your project → **Settings** → **Environment Variables**.
2. Find **DATABASE_URL**. Edit it and replace the value with the **new** Neon connection string from step A. Save.
3. **Redeploy** the project (Deployments → … → Redeploy) so all functions use the new URL.

**C. Update local .env**

1. Open `executive-ai-platform/.env`.
2. Replace the value of `DATABASE_URL` with the **same new** Neon connection string. Save.
3. Do not paste the new URL into chat or commit `.env`.

**D. Optional**

- Revoke or rotate any other secrets that were in the same message (e.g. NEXTAUTH_SECRET): generate new values and update Vercel + `.env` the same way.
- Ensure `.env` is in `.gitignore` and that no env file with real URLs was ever committed. If it was, rotate credentials and consider rewriting history or using a secret-scanning tool.

After this, only the new Neon credentials are valid; old URLs/passwords will not work.
