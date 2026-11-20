#!/usr/bin/env bash
# Times requests to a scan URL with curl, to see where a scanner's wait goes.
# Prints each request's DNS, TCP, TLS and time-to-first-byte, then a summary.
# Run it after the site has been idle for 10+ minutes: if the first request is
# much slower than the rest, the time is going on a cold start (the function's
# or the database's).
#
# Usage: npm run time:redirect [-- <scan url> [requests] [delay seconds]]
#
# Every request records a scan of the poster, so it inflates that poster's
# scan count. Point it at a test poster, not one on a real campaign.
set -euo pipefail

url=${1:-https://www.postertrace.app/redirect/f1aa7b57-ae06-4931-ba0a-c300c75e269d}
requests=${2:-20}
delay=${3:-0.5}

# Times are cumulative from the start of the request, in seconds.
format='%{http_code} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total}\n'

ms() { awk -v s="$1" 'BEGIN { printf "%.0f", s * 1000 }'; }

echo "Timing $requests requests to $url"
echo
printf '%4s  %6s  %6s  %6s  %6s  %8s  %6s  %s\n' \
  '#' 'dns' 'tcp' 'tls' 'ttfb' 'server~' 'total' 'status'

server_times=()
for i in $(seq 1 "$requests"); do
  # A fresh curl per request, so each pays DNS, TCP and TLS like a phone that
  # has just scanned a poster. curl doesn't follow the redirect, so the target
  # site's speed isn't counted.
  read -r status dns tcp tls ttfb total < <(
    curl -o /dev/null -s -w "$format" -H 'Cache-Control: no-cache' "$url"
  )
  # The time between the TLS handshake finishing and the first byte arriving
  # is mostly the server's: the platform, the function and the database.
  server=$(awk -v a="$ttfb" -v b="$tls" 'BEGIN { print a - b }')
  server_times+=("$(ms "$server")")

  printf '%4s  %6s  %6s  %6s  %6s  %8s  %6s  %s\n' "$i" \
    "$(ms "$dns")" "$(ms "$tcp")" "$(ms "$tls")" "$(ms "$ttfb")" \
    "$(ms "$server")" "$(ms "$total")" "$status"

  if [[ $i -lt $requests ]]; then sleep "$delay"; fi
done

echo
echo "All times in ms. server~ = ttfb - tls."
printf '%s\n' "${server_times[@]}" | sort -n | awk -v first="${server_times[0]}" '
  { t[NR] = $1 }
  END {
    printf "server~  first %s  min %s  median %s  p95 %s  max %s\n",
      first, t[1], t[int((NR + 1) / 2)], t[int(NR * 0.95 + 0.999)], t[NR]
  }'
