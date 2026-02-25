#!/usr/bin/env bash
# Smoke test checklist (automated parts). Use env vars only; never print secrets.
# Usage: BASE_URL=https://your-production.vercel.app [BEARER_TOKEN=...] ./scripts/smoke-test.sh
set -e

BASE_URL="${BASE_URL:-}"
if [ -z "$BASE_URL" ]; then
  echo "Usage: BASE_URL=https://<production-domain> [BEARER_TOKEN=<token>] $0"
  echo "Do not paste secrets; set BEARER_TOKEN in env (e.g. export BEARER_TOKEN)."
  exit 1
fi
BASE_URL="${BASE_URL%/}"

echo "=== Smoke test (BASE_URL host only) ==="
echo "Host: $(echo "$BASE_URL" | sed -E 's|https?://([^/]+).*|\1|')"
echo ""

PASS=0
FAIL=0

# --- Phase 2: Health ---
echo "[Phase 2] GET /api/health"
RES=$(curl -s -o /tmp/health.json -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
if [ "$RES" = "200" ]; then
  if grep -q '"ok":\s*true' /tmp/health.json 2>/dev/null; then
    echo "  PASS: status 200, ok=true"
    PASS=$((PASS+1))
  else
    echo "  FAIL: response not ok=true"
    FAIL=$((FAIL+1))
  fi
else
  echo "  FAIL: HTTP $RES"
  FAIL=$((FAIL+1))
fi

if [ -f /tmp/health.json ] && grep -q '"hasDb":\s*true' /tmp/health.json 2>/dev/null && grep -q '"hasAuth":\s*true' /tmp/health.json 2>/dev/null; then
  echo "  PASS: hasDb and hasAuth true"
  PASS=$((PASS+1))
fi
echo ""

# --- Poll (Phase 1.5/3): 204 or 200 if BEARER set ---
if [ -n "${BEARER_TOKEN:-}" ]; then
  echo "[Phase 1.5/3] POST /api/execution/poll (with bearer)"
  # Need an agentInstanceId; use placeholder - will get 403 if invalid, 204 if no job
  RES=$(curl -s -o /tmp/poll.json -w "%{http_code}" -X POST "$BASE_URL/api/execution/poll" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -d '{"agentInstanceId":"placeholder"}' 2>/dev/null || echo "000")
  if [ "$RES" = "204" ] || [ "$RES" = "200" ]; then
    echo "  PASS: poll returned $RES (endpoint reachable)"
    PASS=$((PASS+1))
  elif [ "$RES" = "403" ]; then
    echo "  PASS: poll returned 403 (auth valid, wrong instance id)"
    PASS=$((PASS+1))
  else
    echo "  FAIL: poll returned HTTP $RES"
    FAIL=$((FAIL+1))
  fi
  echo ""
else
  echo "[Phase 1.5/3] SKIP: set BEARER_TOKEN to test poll endpoint"
  echo ""
fi

echo "=== Automated result: $PASS passed, $FAIL failed ==="
echo ""
echo "Manual checklist:"
echo "  Phase 1.5: On /org click 'Test Agent Connection' 3x -> pong within 10s each."
echo "  Phase 3: Two agent instances; select each and test -> pong and handler in worker log."
echo "  Phase 4: As USER role, POST job with off-script message -> 403 + escalationId."
echo "  Phase 5: Escalation inbox shows entries; admin email if RESEND_API_KEY set."
echo "  Phase 6: Set openaiKeyRef on org; run jobs in two orgs -> usage separated."
echo "  Phase 7: Stuck RUNNING job >5min -> requeued; complete twice -> 200 both."
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
