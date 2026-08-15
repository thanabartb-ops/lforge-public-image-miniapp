#!/usr/bin/env bash
# scripts/runtime-check.sh
# Runtime endpoint smoke-test for thanabartb-ops/lforge-public-image-miniapp
# Usage: chmod +x scripts/runtime-check.sh && ./scripts/runtime-check.sh

RUNTIME="https://wforge-image-mcp-wxx.thanabartb.workers.dev"
CURL="curl"
JQ=$(command -v jq || true)

req(){
  local METHOD=$1; shift
  local PATH=$1; shift
  local DATA=$1
  local URL="$RUNTIME$PATH"
  echo "\n=== $METHOD $URL ==="
  if [ "$METHOD" = "GET" ]; then
    RESP=$($CURL -s -S -X GET "$URL") || RESP=$?
  else
    RESP=$($CURL -s -S -X $METHOD "$URL" -H "Content-Type: application/json" -d "$DATA") || RESP=$?
  fi

  if [ -n "$JQ" ]; then
    echo "$RESP" | jq . 2>/dev/null || echo "$RESP"
  else
    echo "$RESP"
    echo "(install jq to pretty-print JSON)"
  fi
}

echo "Runtime smoke test: $RUNTIME"

# 1) Health
req GET "/health"

# 2) Gateway dry-run
req GET "/gateway-test"

# 3) AI connect (send only a key hint). This must NOT contain a real key.
AI_HINT='{"provider":"openai","keyHint":"sk-XXXXxxHintOnly"}'
req POST "/ai/connect" "$AI_HINT"

# 4) Generate (example brief)
BRIEF_PAYLOAD='{"brief":"LFORGE TEST BRIEF - generate a dark premium streetwear poster, color #25A7FF","options":{"color":"#25A7FF"}}'
req POST "/generate" "$BRIEF_PAYLOAD"

# 5) Approve (example brief)
APPROVE_PAYLOAD='{"brief":"LFORGE TEST BRIEF - approval check"}'
req POST "/approve" "$APPROVE_PAYLOAD"

# 6) Render (example brief)
RENDER_PAYLOAD='{"brief":"LFORGE TEST BRIEF - render check"}'
req POST "/render" "$RENDER_PAYLOAD"

# Notes & expectations
cat <<'EOF'

Notes:
- Expected successful responses:
  - /health -> JSON with status/version (e.g. {"status":"ok","version":"1.2.3"})
  - /gateway-test -> JSON showing readiness or sample response
  - /ai/connect -> JSON acknowledging connection (must NOT echo full key)
  - /generate -> JSON including at minimum {"jobId":..., "preview":"https://..."} or {"preview": "..."}
  - /approve -> JSON {"status":"ok"} or similar confirmation
  - /render -> JSON with {"jobId":...} when render is accepted

Troubleshooting:
- CORS: If browser clients fail but this script succeeds, add appropriate Access-Control-Allow-Origin headers on the runtime responses for your frontend origin.
- Auth: If endpoints require authentication, this script will get 401/403; add authentication headers or implement session flow.
- Response shape mismatch: if UI expects `preview` but runtime returns e.g. `artifactUrl`, adapt UI or runtime to match.
- 4xx/5xx: Inspect runtime logs; share response body if you want help diagnosing.

Next steps if a call fails:
1) Copy the failing endpoint's full response printed by this script.
2) Paste it here and I will analyze expected contract mismatches (CORS, JSON shape, missing fields, error messages).
3) If you want, I can prepare a minimal runtime handler (worker/fn) patch that implements these endpoints with the expected contract (you must permit backend changes).

EOF
