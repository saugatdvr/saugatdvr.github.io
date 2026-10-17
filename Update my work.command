#!/bin/bash
# Double-click me after adding/removing videos in the "best work" folder.
cd "$(dirname "$0")"
echo "Updating your work…"
echo
/usr/bin/env python3 tools/build_work.py
# refresh the folder you drag into GitHub (everything except your big originals)
rsync -a --delete --exclude "best work" --exclude "upload to github" --exclude "concepts" --exclude ".*" --exclude "__pycache__" ./ "upload to github/"
echo
echo 'The "upload to github" folder is ready: open it, select all (Cmd+A) and drag into GitHub.'
echo
read -n 1 -s -r -p "All done. Press any key to close this window."
