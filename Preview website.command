#!/bin/bash
# Double-click me to preview the website on your Mac (needed for the splat portrait effect).
cd "$(dirname "$0")"
PORT=5173
if ! curl -s -o /dev/null "http://localhost:$PORT/"; then
  /usr/bin/env python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi
open "http://localhost:$PORT/"
echo "Your website is open at http://localhost:$PORT"
echo "Keep this window open while you look at it. Close it when you're done."
wait
