#!/usr/bin/env bash
# Apply repository rulesets from .github/rulesets/*.json via the GitHub API.
#
# Usage:
#   pnpm run github:rulesets              # apply all rulesets
#   pnpm run github:rulesets -- main      # apply protect-main.json only
#   pnpm run github:rulesets -- release   # apply protect-release.json only
#
# Requires: gh CLI, authenticated with repo admin access.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
RULESETS_DIR="$ROOT/.github/rulesets"

usage() {
  cat <<'EOF'
Usage: apply-rulesets.sh [ruleset...]

Apply JSON rulesets from .github/rulesets/ to GitHub (create or update).

With no arguments, applies every *.json file in .github/rulesets/.
With arguments, applies matching files by stem (e.g. "main" -> protect-main.json).

Environment:
  GITHUB_REPOSITORY   Owner/repo override (default: current gh repo)

Examples:
  pnpm run github:rulesets
  pnpm run github:rulesets -- main release
EOF
}

resolve_repo() {
  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    echo "$GITHUB_REPOSITORY"
    return
  fi
  gh repo view --json nameWithOwner --jq .nameWithOwner
}

ruleset_name() {
  node -pe "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).name" "$1"
}

ruleset_branch_ref() {
  node -pe "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).conditions.ref_name.include[0]" "$1"
}

find_ruleset_id() {
  local repo="$1"
  local name="$2"
  local file="$3"

  local id
  id="$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id" | head -1)"
  if [[ -n "$id" ]]; then
    echo "$id"
    return
  fi

  local branch_ref
  branch_ref="$(ruleset_branch_ref "$file")"
  if [[ -z "$branch_ref" ]]; then
    return
  fi

  local ruleset_id
  while IFS= read -r ruleset_id; do
    [[ -z "$ruleset_id" ]] && continue
    local includes_ref
    includes_ref="$(
      gh api "repos/$repo/rulesets/$ruleset_id" \
        --jq ".conditions.ref_name.include[]? | select(. == \"$branch_ref\")"
    )"
    if [[ -n "$includes_ref" ]]; then
      echo "$ruleset_id"
      return
    fi
  done < <(gh api "repos/$repo/rulesets" --jq '.[].id')
}

apply_ruleset() {
  local file="$1"
  local repo="$2"
  local name
  name="$(ruleset_name "$file")"

  local id
  id="$(find_ruleset_id "$repo" "$name" "$file")"

  if [[ -n "$id" ]]; then
    echo "Updating $name (id=$id) from $(basename "$file")"
    gh api --method PUT "repos/$repo/rulesets/$id" --input "$file" --jq '{id, name, enforcement, updated_at}'
  else
    echo "Creating $name from $(basename "$file")"
    gh api --method POST "repos/$repo/rulesets" --input "$file" --jq '{id, name, enforcement, created_at}'
  fi
}

resolve_files() {
  if [[ $# -eq 0 ]]; then
    find "$RULESETS_DIR" -maxdepth 1 -name '*.json' -type f | sort
    return
  fi

  local stem file
  for stem in "$@"; do
    if [[ "$stem" == *.json ]]; then
      file="$RULESETS_DIR/$(basename "$stem")"
    elif [[ -f "$RULESETS_DIR/$stem.json" ]]; then
      file="$RULESETS_DIR/$stem.json"
    elif [[ -f "$RULESETS_DIR/protect-$stem.json" ]]; then
      file="$RULESETS_DIR/protect-$stem.json"
    else
      echo "error: no ruleset file found for '$stem' in $RULESETS_DIR" >&2
      exit 1
    fi

    if [[ ! -f "$file" ]]; then
      echo "error: ruleset file not found: $file" >&2
      exit 1
    fi

    echo "$file"
  done
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI is required (https://cli.github.com/)" >&2
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not authenticated — run: gh auth login" >&2
    exit 1
  fi

  local repo
  repo="$(resolve_repo)"
  echo "Repository: $repo"
  echo

  local files=()
  while IFS= read -r file; do
    files+=("$file")
  done < <(resolve_files "$@")

  if [[ ${#files[@]} -eq 0 ]]; then
    echo "error: no ruleset JSON files found in $RULESETS_DIR" >&2
    exit 1
  fi

  local file
  for file in "${files[@]}"; do
    apply_ruleset "$file" "$repo"
    echo
  done

  echo "Done."
}

main "$@"
