#!/bin/bash
# Double-click me after adding/removing videos in the "best work" folder.
cd "$(dirname "$0")"
echo "Updating your work…"
echo
/usr/bin/env python3 tools/build_work.py
# refresh the folder you drag into GitHub (everything except your big originals)
rsync -a --delete --exclude "best work" --exclude "upload to github" --exclude "concepts" --exclude "backups" --exclude ".*" --exclude "__pycache__" ./ "upload to github/"
echo
echo 'Done! Now open GitHub Desktop: type a short note (e.g. "new videos"), click "Commit to main", then "Push origin".'
echo 'Your live site updates 1-2 minutes later.'
echo
read -n 1 -s -r -p "All done. Press any key to close this window."
