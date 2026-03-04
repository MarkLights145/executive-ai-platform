# Service account auth — test plan

Use `BASE_URL` (e.g. `http://localhost:3000` or your deployment). Never paste real tokens in docs; use `$TOKEN` from env.

---

## 1. 401 without auth

```bash
# No Authorization header
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/org/me"
# Expected: 401

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/tasks"
# Expected: 401

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/org"
# Expected: 401
```

---

## 2. 401 with invalid Bearer token

```bash
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid-token" "$BASE_URL/api/org/me"
# Expected: 401
```

---

## 3. 403 admin-only routes (service account cannot create service accounts)

POST /api/service-accounts is session-only (admin). No Bearer support for that route by design. So:

- With valid **session** (cookie), non-admin user:
```bash
# Log in as USER-role user, then:
curl -s -o /dev/null -w "%{http_code}" -b cookies.txt -c cookies.txt \
  -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test SA","scopes":["tasks:read"]}' \
  "$BASE_URL/api/service-accounts"
# Expected: 403 (Forbidden: admin only)
```

- With valid **Bearer** (service account): POST /api/service-accounts is not updated to accept Bearer; it uses getServerSession only. So Bearer request to POST /api/service-accounts returns 401 (no session). To test 403 for service account on an admin route, use PATCH /api/org (admin only):
```bash
export TOKEN="<valid-service-account-token>"
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  -X PATCH -H "Content-Type: application/json" -d '{"openaiKeyRef":"X"}' \
  "$BASE_URL/api/org"
# Expected: 403 (Forbidden: admin only)
```

---

## 4. GET /api/org/me with valid Bearer (debug principal)

```bash
export TOKEN="<one-time-token-returned-from-POST-service-accounts>"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/org/me"
# Expected: 200, JSON with orgId, principalType: "service_account", principalId, scopes
```

---

## 5. Org scoping (multi-tenancy)

- Create two orgs (e.g. Org A and Org B). Create a service account in Org A and get its token.
- Create a project/task in Org B.
- With Org A’s service account token, GET /api/tasks and GET /api/org: response must only include Org A data (no Org B tasks or org).
```bash
export TOKEN_A="<token-for-org-a-service-account>"
curl -s -H "Authorization: Bearer $TOKEN_A" "$BASE_URL/api/tasks"
# Expected: 200, tasks array only for Org A (empty if no tasks in Org A)

curl -s -H "Authorization: Bearer $TOKEN_A" "$BASE_URL/api/org"
# Expected: 200, org object for Org A (id and name for Org A)
```

- With same token, PATCH /api/tasks/:id for a task that belongs to Org B:
```bash
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN_A" \
  -X PATCH -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  "$BASE_URL/api/tasks/<org-b-task-id>"
# Expected: 404 (task not in Org A)
```

---

## 6. Audit log

After calls that authenticate, check `AuditLog` table for rows with:

- `route` (e.g. `/api/org/me`, `/api/tasks`, `/api/org`)
- `method` (GET, PATCH, POST)
- `status` (200, 401, 403, 404)
- `orgId`, `principalId`, `principalType`

Example query (after running curl tests):

```sql
SELECT "route", "method", "status", "principalType", "createdAt" FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 20;
```

---

## 7. Create service account (session admin) and use token

1. Log in as **ADMIN** in the app (session cookie).
2. Create service account (e.g. from browser or curl with session cookie):
```bash
# With session cookie from admin login:
curl -s -b cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"name":"E2E SA","scopes":["tasks:read","tasks:write"]}' \
  "$BASE_URL/api/service-accounts"
# Expected: 200, JSON with id, name, scopes, token (one-time; save to env)
```
3. Use returned `token` in subsequent requests as `Authorization: Bearer <token>` for GET /api/org/me and GET /api/tasks (org-scoped).

---

## 8. GET /api/users (service account needs users:read scope)

```bash
# 401 no auth
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users"
# Expected: 401

# 403 valid Bearer but scope missing (create SA with scopes: ["tasks:read"] only)
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users"
# Expected: 403 (Forbidden: users:read scope required)

# 200 with users:read scope (create SA with scopes: ["users:read"] or ["users:read","tasks:read"])
export TOKEN_READ="<token-with-users:read>"
curl -s -H "Authorization: Bearer $TOKEN_READ" "$BASE_URL/api/users"
# Expected: 200, { users: [ { id, name, email, telegramUsername, telegramUserId, role } ] } — only that org
```

---

## Summary

| Check | Expected |
|-------|----------|
| No auth → /api/org/me, /api/tasks, /api/org, /api/users | 401 |
| Invalid Bearer → /api/org/me | 401 |
| Service account PATCH /api/org | 403 |
| Service account GET /api/users without users:read | 403 |
| Valid Bearer with users:read → GET /api/users | 200, users for that org only |
| Valid Bearer → GET /api/org/me | 200, principalType + orgId |
| Valid Bearer → GET /api/tasks, /api/org | 200, data scoped to that org only |
| Token from Org A used for Org B task PATCH | 404 |
| AuditLog table | New row per authenticated API call with route, method, status |
