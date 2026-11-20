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
# The route's Server-Timing header comes last, since it contains spaces.
format='%{http_code} %{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer} %{time_total} %header{server-timing}\n'

ms() { awk -v s="$1" 'BEGIN { printf "%.0f", s * 1000 }'; }

# The duration of one Server-Timing metric, in ms, or "-" if it's missing.
timing() {
  local value
  value=$(sed -nE "s/.*(^|, )$1;dur=([0-9.]+).*/\\2/p" <<<"$2")
  if [[ -n $value ]]; then printf '%.0f' "$value"; else printf -- '-'; fi
}

echo "Timing $requests requests to $url"
echo
row='%4s  %6s  %6s  %6s  %6s  %8s  %6s  %7s  %7s  %6s  %s\n'
printf "$row" '#' 'dns' 'tcp' 'tls' 'ttfb' 'server~' 'total' \
  'lookup' 'handler' 'status' ''

server_times=()
for i in $(seq 1 "$requests"); do
  # A fresh curl per request, so each pays DNS, TCP and TLS like a phone that
  # has just scanned a poster. curl doesn't follow the redirect, so the target
  # site's speed isn't counted.
  read -r status dns tcp tls ttfb total server_timing < <(
    curl -o /dev/null -s -w "$format" -H 'Cache-Control: no-cache' "$url"
  )
  # The time between the TLS handshake finishing and the first byte arriving
  # is mostly the server's: the platform, the function and the database.
  server=$(awk -v a="$ttfb" -v b="$tls" 'BEGIN { print a - b }')
  server_times+=("$(ms "$server")")

  # The first scan a new function instance handles is marked cold.
  cold=''
  if [[ $server_timing == *cold* ]]; then cold='cold'; fi

  printf "$row" "$i" \
    "$(ms "$dns")" "$(ms "$tcp")" "$(ms "$tls")" "$(ms "$ttfb")" \
    "$(ms "$server")" "$(ms "$total")" \
    "$(timing lookup "$server_timing")" "$(timing total "$server_timing")" \
    "$status" "$cold"

  if [[ $i -lt $requests ]]; then sleep "$delay"; fi
done

echo
echo "All times in ms. server~ = ttfb - tls. lookup and handler come from the"
echo "route's Server-Timing header (- if it has none); server~ - handler is"
echo "roughly the platform's share: routing, starting the function, Next.js."
printf '%s\n' "${server_times[@]}" | sort -n | awk -v first="${server_times[0]}" '
  { t[NR] = $1 }
  END {
    printf "server~  first %s  min %s  median %s  p95 %s  max %s\n",
      first, t[1], t[int((NR + 1) / 2)], t[int(NR * 0.95 + 0.999)], t[NR]
  }'
