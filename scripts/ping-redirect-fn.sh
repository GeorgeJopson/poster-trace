#!/usr/bin/env bash
# Temporary, like netlify/functions/warm-redirect-fn.mts, and deleted with it.
# Sends the scheduled function's warm-up ping to a deploy, where the
# schedule doesn't run (only the published production deploy runs it).
#
# Usage: scripts/ping-redirect-fn.sh <deploy URL> [interval in seconds]
#   e.g. scripts/ping-redirect-fn.sh https://deploy-preview-12--site.netlify.app
#
# For a protected deploy, set one of:
#   PREVIEW_COOKIE="nf_jwt=..."   (copied from your browser)
#   PREVIEW_AUTH="user:password"  (basic auth)
#
# Stop it with Ctrl-C.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <deploy URL> [interval in seconds, default 300]" >&2
  exit 1
fi

url="${1%/}/redirect-fn/warm-up"
interval="${2:-300}"

args=(-s -o /dev/null -w "%{http_code} %{time_total}" -H "X-Warm-Up: 1")
if [[ -n "${PREVIEW_COOKIE:-}" ]]; then args+=(-H "Cookie: $PREVIEW_COOKIE"); fi
if [[ -n "${PREVIEW_AUTH:-}" ]]; then args+=(-u "$PREVIEW_AUTH"); fi

echo "Pinging $url every ${interval}s"
while true; do
  if result=$(curl "${args[@]}" "$url"); then
    read -r status seconds <<<"$result"
    if [[ "$status" == "204" ]]; then
      echo "$(date '+%H:%M:%S') ok   ${seconds}s"
    else
      echo "$(date '+%H:%M:%S') got $status in ${seconds}s (expected 204)" >&2
    fi
  else
    echo "$(date '+%H:%M:%S') request failed" >&2
  fi
  sleep "$interval"
done
