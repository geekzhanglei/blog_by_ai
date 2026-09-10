#!/usr/bin/env bash
set -Eeuo pipefail

repo=/www/frontEnd/blog_by_ai
state_dir=/var/lib/blog-by-ai-pull
state_file="$state_dir/deployed.sha"
lock_file=/var/lock/blog-by-ai-pull.lock
log_tag=blog-by-ai-pull

on_error() {
  status=$?
  logger -t "$log_tag" -- "deployment failed (exit $status)"
  exit "$status"
}
trap on_error ERR

export NVM_DIR=/root/.nvm
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$NVM_DIR/versions/node/v24.15.0/bin:/usr/local/bin:/usr/bin:/bin"
export PM2_NODE_INTERPRETER="$NVM_DIR/versions/node/v24.15.0/bin/node"

exec 9>"$lock_file"
flock -n 9 || exit 0

cd "$repo"
git fetch --quiet origin main
target=$(git rev-parse --verify origin/main)
deployed=$(test -f "$state_file" && cat "$state_file" || true)
[ "$target" = "$deployed" ] && exit 0

if ! git diff --quiet || ! git diff --cached --quiet; then
  logger -t "$log_tag" -- "deployment skipped: tracked files are modified"
  exit 1
fi

current=$(git rev-parse HEAD)
[ "$current" = "$target" ] || git merge --ff-only origin/main

pnpm install --frozen-lockfile --silent
pnpm build >/dev/null
pnpm pm2:reload >/dev/null

mkdir -p "$state_dir"
temporary_state=$(mktemp "$state_dir/deployed.sha.XXXXXX")
printf '%s\n' "$target" > "$temporary_state"
mv "$temporary_state" "$state_file"
logger -t "$log_tag" -- "deployed $target"
