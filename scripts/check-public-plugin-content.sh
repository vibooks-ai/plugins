#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SHARED_ROOT="${PUBLIC_ROOT}/plugins/shared/vibooks"

if [[ -d "${SHARED_ROOT}/skills/vibooks/evals" ]]; then
  echo "Public plugin package must not include canonical skill eval materials: ${SHARED_ROOT}/skills/vibooks/evals" >&2
  exit 1
fi

if [[ -e "${PUBLIC_ROOT}/plugins/shared/vibooks/assets/overview-real.png" || -e "${PUBLIC_ROOT}/plugins/codex/vibooks/assets/overview-real.png" ]]; then
  echo "Plugin screenshots must use the website-referenced overview-hero.png asset, not overview-real.png." >&2
  exit 1
fi

PATTERN='(/Users/|/private/var/folders|/var/folders|C:\\Users\\|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_|rk_live_|ghp_|github_pat_|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})'
SIBLING_PATTERN='(vibooks-skills/|vibooks-app/|vibooks-server/|vibooks-website/|\.\./vibooks)'
SCAN_ROOTS=(
  ".agents/plugins"
  ".claude-plugin"
  "plugins/AGENTS.md"
  "plugins/README.md"
  "plugins/codex"
  "plugins/claude"
  "plugins/scripts"
  "plugins/shared"
  "plugins/submission"
)
PUBLIC_DOC_ROOTS=(
  "plugins/AGENTS.md"
  "plugins/README.md"
  "plugins/submission"
  "plugins/shared/vibooks"
  "plugins/codex/vibooks"
)
MATERIALIZED_DIRS=(assets docs scripts skills)

if [[ "$(jq -r '.name' "${PUBLIC_ROOT}/.agents/plugins/marketplace.json")" != "vibooks" ]] ||
   [[ "$(jq -r '.interface.displayName' "${PUBLIC_ROOT}/.agents/plugins/marketplace.json")" != "Vibooks" ]]; then
  echo "Public Codex marketplace must use the Vibooks product identity." >&2
  exit 1
fi

if [[ "$(jq -r '.plugins[0].category' "${PUBLIC_ROOT}/.agents/plugins/marketplace.json")" != "Finance" ]] ||
   [[ "$(jq -r '.plugins[0].category' "${PUBLIC_ROOT}/.claude-plugin/marketplace.json")" != "Finance" ]] ||
   [[ "$(jq -r '.interface.category' "${PUBLIC_ROOT}/plugins/codex/vibooks/.codex-plugin/plugin.json")" != "Finance" ]]; then
  echo "Vibooks public plugin listings must use the Finance category." >&2
  exit 1
fi

TASK_SKILLS=(setup bookkeep-documents reconcile-close review-books)
for skill in "${TASK_SKILLS[@]}"; do
  if [[ ! -f "${SHARED_ROOT}/skills/${skill}/SKILL.md" ]]; then
    echo "Missing task-oriented Vibooks plugin skill: ${skill}" >&2
    exit 1
  fi
done

if [[ -d "${SHARED_ROOT}/skills/vibooks-mcp" ]]; then
  echo "MCP implementation details must not remain a primary user-visible skill." >&2
  exit 1
fi

for dir in "${MATERIALIZED_DIRS[@]}"; do
  if ! diff -qr "${PUBLIC_ROOT}/plugins/shared/vibooks/${dir}" "${PUBLIC_ROOT}/plugins/codex/vibooks/${dir}" >/dev/null; then
    echo "Codex wrapper materialized copy is out of sync with shared core: ${dir}" >&2
    echo "Run plugins/scripts/sync-codex-wrapper.sh after editing shared plugin content." >&2
    exit 1
  fi
done

if command -v rg >/dev/null 2>&1; then
  if (cd "${PUBLIC_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '!**/*.png' --glob '!plugins/scripts/check-public-plugin-content.sh' -e "${PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains local paths or secret-looking content." >&2
    exit 1
  fi
else
  if (cd "${PUBLIC_ROOT}" && grep -RInE --exclude='*.png' --exclude='check-public-plugin-content.sh' --exclude-dir='.git' "${PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains local paths or secret-looking content." >&2
    exit 1
  fi
fi

if command -v rg >/dev/null 2>&1; then
  if (cd "${PUBLIC_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '!plugins/scripts/check-public-plugin-content.sh' -e "${SIBLING_PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains monorepo sibling-path references." >&2
    exit 1
  fi
else
  if (cd "${PUBLIC_ROOT}" && grep -RInE --exclude='check-public-plugin-content.sh' --exclude-dir='.git' "${SIBLING_PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains monorepo sibling-path references." >&2
    exit 1
  fi
fi

if command -v rg >/dev/null 2>&1; then
  if (cd "${PUBLIC_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '*.md' -e '\.\./' "${PUBLIC_DOC_ROOTS[@]}"); then
    echo "Public plugin docs must use repository-root paths, not parent-directory references." >&2
    exit 1
  fi
else
  if (cd "${PUBLIC_ROOT}" && grep -RInE --include='*.md' '\.\./' "${PUBLIC_DOC_ROOTS[@]}"); then
    echo "Public plugin docs must use repository-root paths, not parent-directory references." >&2
    exit 1
  fi
fi

while IFS= read -r symlink_path; do
  target="$(readlink "${symlink_path}")"
  if [[ "${target}" = /* ]]; then
    echo "Public plugin symlink must be relative: ${symlink_path} -> ${target}" >&2
    exit 1
  fi
  resolved="$(cd "$(dirname "${symlink_path}")" && realpath "${target}")"
  case "${resolved}" in
    "${PUBLIC_ROOT}/plugins/shared/vibooks"/*) ;;
    *)
      echo "Public plugin symlink must resolve to shared Vibooks content: ${symlink_path} -> ${target}" >&2
      exit 1
      ;;
  esac
done < <(find "${PUBLIC_ROOT}/plugins/codex" "${PUBLIC_ROOT}/plugins/claude" -type l)

echo "Vibooks public plugin repository content check passed."
