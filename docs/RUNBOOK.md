# Executive AI ↔ OpenClaw Operator Runbook

## Step 0 — Code verification (already done)

- **Git:** `git log -n 15 --oneline` shows Phase 1.5–7 commits on main.
- **Files:** All API routes, Prisma migrations, /org components (EscalationInbox, UsageDashboard, OrgKeyRef), and `execution-plane/worker.js` (multi-instance, backoff, usage post) exist.
- **Build:** `npm run build` completes successfully.

---

## Step 1 — Vercel deployment verification

1. Open the Vercel project for **executive-ai-platform**.
2. Confirm the **Production** deployment is **Ready** for the latest commit (e.g. `8e72541` or later).
3. Copy the **Production** domain (e.g. `https://executive-ai-platform.vercel.app` or your custom domain).  
   - In Vercel: Project → Settings → Domains, or the main deployment URL under **Production**.
4. Use this exact URL as the control-plane base (no trailing slash). No preview or branch URLs.

---

## Step 2 — Database migrations (production)

**Goal:** Production DB has all models: AgentInstance, ExecutionJob, Escalation, UsageLog, and `Organization.openaiKeyRef`.

**Note:** There are two migration folders for Escalation (`20260225205957_add_escalation` and `20260225210000_add_escalation`). If the Escalation table already exists (e.g. from the first), the second would fail. Handle as below.

**Option A — Run from local with production DB URL**

1. Set production DB URL (never commit or log it):
   ```bash
   export DATABASE_URL="postgresql://..."
   ```
2. Check status:
   ```bash
   cd executive-ai-platform && npx prisma migrate status
   ```
3. If `20260225210000_add_escalation` is pending but Escalation table already exists:
   ```bash
   npx prisma migrate resolve --applied 20260225210000_add_escalation
   ```
4. Apply all remaining migrations:
   ```bash
   npx prisma migrate deploy
   ```

**Option B — Vercel (build or one-off)**

- If migrations run in build: ensure `prisma migrate deploy` is in the build command and `DATABASE_URL` is set in Vercel env. Then redeploy.
- Or run the same commands in a one-off container/shell that has `DATABASE_URL` and the repo (e.g. Vercel CLI or your CI), using the steps above.

**Verify:** Tables `AgentInstance`, `ExecutionJob`, `Escalation`, `UsageLog` exist, and `Organization` has column `openaiKeyRef`.

---

## Step 3 — Mac mini worker setup (SSH)

**PAUSE: Get user approval before running any SSH commands.**

After approval:

1. **SSH to Mac mini** (Tailscale):
   ```bash
   ssh mikesales@mikes-mac-mini.tail5ac97e.ts.net
   ```

2. **Ensure `~/execution-plane` exists and is up to date:**
   - Clone or pull the repo that contains `execution-plane/worker.js` (with multi-instance, backoff, usage post).
   - Or copy `worker.js` and `.env.example` into `~/execution-plane`.

3. **Configure `~/execution-plane/.env`:**
   - `EXECUTION_PLANE_CONTROL_URL=<PRODUCTION_DOMAIN>` (from Step 1; no trailing slash).
   - `OPENCLAW_EXEC_AUTH_TOKEN` — same value as the env var referenced by the agent’s `authTokenRef` in Exec AI (do not print or echo).
   - `AGENT_INSTANCE_ID=<id>` for one instance, or `AGENT_INSTANCE_IDS=id1,id2` for multiple (ids from /org after creating agent instances).

4. **Restart worker and check logs:**
   ```bash
   # Truncate log
   : > /tmp/execution-plane-worker.log
   pkill -f "node worker.js" || true
   cd ~/execution-plane && nohup node worker.js >> /tmp/execution-plane-worker.log 2>&1 &
   tail -f /tmp/execution-plane-worker.log
   ```
   - Expect one line like: `[worker] control host=... polling=ok instances=N`. No repeated errors.

5. **Verify poll endpoint (from mini or any host with BEARER_TOKEN):**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X POST "$EXECUTION_PLANE_CONTROL_URL/api/execution/poll" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $OPENCLAW_EXEC_AUTH_TOKEN" \
     -d "{\"agentInstanceId\":\"<real-agent-instance-id>\"}"
   ```
   - 204 = no job (ok). 200 = job returned. 401/403 = fix token or instance id.

---

## Step 4 — Smoke tests by phase

**Automated (no secrets printed):**

```bash
cd executive-ai-platform
BASE_URL=https://<production-domain> ./scripts/smoke-test.sh
# With bearer (optional): BASE_URL=... BEARER_TOKEN=... ./scripts/smoke-test.sh
```

If health returns 404, the BASE_URL is likely wrong or the Production deployment is not ready (confirm in Vercel).

**Manual checklist:**

| Phase | What to do | Pass condition |
|-------|------------|----------------|
| **1.5** | On /org, click **Test Agent Connection** 3 times. | Each returns **pong** within 10s. ExecutionJob rows created and completed. |
| **2** | `curl -s <BASE_URL>/api/health` | `ok: true`, `commit`, `hasDb: true`, `hasAuth: true`. Redeploy does not require changing worker control URL. |
| **3** | Create 2 agent instances; set `AGENT_INSTANCE_IDS` on mini. Test each instance from dropdown. | Each returns pong; worker log shows `handler=<shortId>` for the right instance. |
| **4** | As a **USER** (non-admin), try to create a job with an off-script message (e.g. “Do something custom”). | 403 with `escalationId`; no job created; escalation row created. |
| **5** | Check /org Escalation inbox. If `RESEND_API_KEY` is set, trigger an escalation. | Escalation appears in inbox; admin receives email when Resend is configured. |
| **6** | Set org `openaiKeyRef` to an env **name** (not value). Run a job in two different orgs. | Usage dashboard shows separate usage per org. No key values stored or logged. |
| **7** | (1) Set one job to RUNNING and backdate `updatedAt` >5 min (or wait); poll again. (2) Call complete twice for the same job with valid bearer. | (1) Job is requeued to PENDING. (2) Both complete calls return 200. |

---

## Step 5 — Operator procedures

### Add a new org and agent instance

1. Create the org (invite flow or seed) and ensure at least one **ADMIN** user.
2. Admin signs in, goes to **/org**.
3. In Execution Plane, add an agent instance: **Name**, **Base URL** (e.g. Mac mini Tailscale URL), **Auth token env key** (e.g. `OPENCLAW_EXEC_AUTH_TOKEN`).
4. In Vercel (and on the worker host), set the env var **name** to the same key and set the **value** to a shared secret (never paste in runbooks).
5. On the Mac mini, set `AGENT_INSTANCE_ID` to the new instance id, or add it to `AGENT_INSTANCE_IDS`.
6. Restart the worker.

### Onboard users (admin vs user)

- **Admin:** Invite with role **ADMIN** (invite code or user creation with `role: ADMIN`). Admins can create jobs, manage instances, see escalations and usage.
- **User:** Invite with role **USER**. Users are restricted to status/ETA/progress-style messages; off-script input creates an escalation and returns 403.

### Escalation flow

- When a **USER** sends a message that fails the role-policy classifier (off-script), the API returns **403** and creates an **Escalation** row (reason `OFF_SCRIPT`).
- Org admins are notified by email (if `RESEND_API_KEY` is set) with a link to `/org#escalations`.
- Admins open **/org** → Escalations, see the list, and can **Acknowledge** or **Resolve**.

### Per-org API key refs

- On **/org** → **Org key & usage**, set **Org API key (env ref)** to an **env var name** only (e.g. `OPENAI_API_KEY_ORG_1`). The key **value** is never stored or logged.
- That ref is used for per-org billing and routing; ensure the actual secret is set in the environment where execution runs.

### Restart worker (Mac mini)

```bash
ssh mikesales@mikes-mac-mini.tail5ac97e.ts.net
pkill -f "node worker.js" || true
cd ~/execution-plane && nohup node worker.js >> /tmp/execution-plane-worker.log 2>&1 &
tail -20 /tmp/execution-plane-worker.log
```

### Logs to check

- **Worker:** `/tmp/execution-plane-worker.log` on the Mac mini.  
  **Green:** One startup line `control host=... polling=ok instances=N`, then `[worker] info job completed jobId=... handler=...` when jobs run. No repeated `poll failed` or `complete failed`.
- **Vercel:** Project → Deployments → Function logs. Check for 401/403/500 on `/api/execution/*` or `/api/health`.

### What “green” looks like

- **/api/health** returns 200 with `ok: true`, `hasDb: true`, `hasAuth: true`.
- **Test Agent Connection** on /org returns **pong** within 10s.
- Worker log shows polling and job completion with no error spam.
- Escalations appear in the inbox when triggered; emails send if Resend is configured.
- Usage dashboard shows usage per org; no key values in DB or logs.

### Common failures and fixes

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| 404/405 on poll or complete | Wrong URL (preview vs production) or wrong path | Use **production** domain for `EXECUTION_PLANE_CONTROL_URL`; paths are `/api/execution/poll`, `/api/execution/jobs/[id]/complete`. |
| 401 on poll/complete | Missing or wrong Bearer token | Ensure `OPENCLAW_EXEC_AUTH_TOKEN` on the worker matches the value of the env var named in the agent’s `authTokenRef` in Vercel. |
| 403 on poll | Wrong `agentInstanceId` or token not valid for that instance | Use the exact agent instance id from /org; ensure token matches that instance’s `authTokenRef`. |
| Timeout waiting for job | Worker not running or not polling this instance | Restart worker; confirm `AGENT_INSTANCE_ID` or `AGENT_INSTANCE_IDS` includes the instance used by the test. |
| Migrations fail (e.g. “relation already exists”) | Duplicate migration or already-applied migration | Use `npx prisma migrate resolve --applied <migration_name>` for the duplicate, then `npx prisma migrate deploy`. |

---

**Stop condition:** All phase smoke tests pass, or report the first phase that failed with the smallest actionable fix.
