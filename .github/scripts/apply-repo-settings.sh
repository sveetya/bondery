#!/usr/bin/env bash
# Apply repository settings from .github/repo-settings.json via the GitHub API.
#
# Usage:
#   npm run github:repo-settings
#
# Requires: gh CLI, authenticated with repo admin access.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SETTINGS_FILE="$ROOT/.github/repo-settings.json"

usage() {
  cat <<'EOF'
Usage: apply-repo-settings.sh

Apply merge and PR settings from .github/repo-settings.json to GitHub.

Environment:
  GITHUB_REPOSITORY   Owner/repo override (default: current gh repo)

Example:
  npm run github:repo-settings
EOF
}

resolve_repo() {
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    echo "$GITHUB_REPOSITORY"
    return
  fi
  gh repo view --json nameWithOwner --jq .nameWithOwner
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  if [[ $# -gt 0 ]]; then
    echo "error: unexpected arguments: $*" >&2
    usage >&2
    exit 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is required (https://cli.github.com/)" >&2
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not authenticated — run: gh auth login" >&2
    exit 1
  fi

  if [[ ! -f "$SETTINGS_FILE" ]]; then
    echo "error: settings file not found: $SETTINGS_FILE" >&2
    exit 1
  fi

  local repo
  repo="$(resolve_repo)"

  echo "Repository: $repo"
  echo "Applying settings from $(basename "$SETTINGS_FILE")"
  gh api --method PATCH "repos/$repo" --input "$SETTINGS_FILE" --jq '{
    allow_squash_merge,
    allow_merge_commit,
    allow_rebase_merge,
    allow_auto_merge,
    allow_update_branch,
    delete_branch_on_merge,
    squash_merge_commit_title,
    squash_merge_commit_message
  }'
  echo
  echo "Done."
}

main "$@"
