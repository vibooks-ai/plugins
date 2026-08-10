#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CODEX_ROOT="${PLUGIN_ROOT}/codex/vibooks"

if [[ -d "${PLUGIN_ROOT}/skills/vibooks/evals" ]]; then
  echo "Public plugin package must not include canonical skill eval materials: ${PLUGIN_ROOT}/skills/vibooks/evals" >&2
  exit 1
fi

if [[ -e "${PLUGIN_ROOT}/assets/overview-real.png" || -e "${CODEX_ROOT}/assets/overview-real.png" ]]; then
  echo "Plugin screenshots must use the website-referenced overview-hero.png asset, not overview-real.png." >&2
  exit 1
fi

PATTERN='(/Users/|/private/var/folders|/var/folders|C:\\Users\\|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_|rk_live_|ghp_|github_pat_|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})'
SIBLING_PATTERN='(vibooks-skills/|vibooks-app/|vibooks-server/|vibooks-website/|\.\./vibooks)'
SCAN_ROOTS=(
  ".github"
  ".gitignore"
  ".agents"
  ".claude-plugin"
  "AGENTS.md"
  "CHANGELOG.md"
  "LICENSE"
  "README.md"
  "SECURITY.md"
  "plugin.json"
  "mcp.json"
  "package.json"
  "package-lock.json"
  "assets"
  "codex"
  "claude"
  "docs"
  "runtime"
  "schemas"
  "scripts"
  "skills"
  "submission"
)
PUBLIC_DOC_ROOTS=(
  "AGENTS.md"
  "README.md"
  "submission"
  "docs"
  "skills"
  "codex/vibooks"
)
MATERIALIZED_DIRS=(assets docs runtime skills)
MATERIALIZED_FILES=(LICENSE)

if [[ "$(jq -r '.name' "${PLUGIN_ROOT}/plugin.json")" != "vibooks" ]] ||
   [[ "$(jq -r '.["$schema"]' "${PLUGIN_ROOT}/plugin.json")" != "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json" ]] ||
   [[ "$(jq -r '.["$schema"]' "${PLUGIN_ROOT}/mcp.json")" != "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json" ]]; then
  echo "Portable Vibooks package must use the Agent Plugins 1.0.0 identity and schemas." >&2
  exit 1
fi

PORTABLE_VERSION="$(jq -r '.version' "${PLUGIN_ROOT}/plugin.json")"
if [[ "$(jq -r '.version' "${CODEX_ROOT}/.codex-plugin/plugin.json")" != "${PORTABLE_VERSION}" ]] ||
   [[ "$(jq -r '.version' "${PLUGIN_ROOT}/claude/vibooks/.claude-plugin/plugin.json")" != "${PORTABLE_VERSION}" ]]; then
  echo "Portable, Codex, and Claude plugin versions must remain identical." >&2
  exit 1
fi

REPOSITORY_URL="https://github.com/vibooks-ai/plugins"
HOMEPAGE_URL="https://vibooks.ai/agents/"
for manifest in \
  "${PLUGIN_ROOT}/plugin.json" \
  "${CODEX_ROOT}/.codex-plugin/plugin.json" \
  "${PLUGIN_ROOT}/claude/vibooks/.claude-plugin/plugin.json"; do
  if [[ "$(jq -r '.license' "${manifest}")" != "Apache-2.0" ]] ||
     [[ "$(jq -r '.repository' "${manifest}")" != "${REPOSITORY_URL}" ]] ||
     [[ "$(jq -r '.homepage' "${manifest}")" != "${HOMEPAGE_URL}" ]]; then
    echo "Public plugin manifests must use the canonical license, repository, and agent-guide homepage: ${manifest}" >&2
    exit 1
  fi
done

if [[ "$(jq -r '.plugins[0].license' "${PLUGIN_ROOT}/.claude-plugin/marketplace.json")" != "Apache-2.0" ]] ||
   [[ "$(jq -r '.plugins[0].repository' "${PLUGIN_ROOT}/.claude-plugin/marketplace.json")" != "${REPOSITORY_URL}" ]] ||
   [[ "$(jq -r '.plugins[0].homepage' "${PLUGIN_ROOT}/.claude-plugin/marketplace.json")" != "${HOMEPAGE_URL}" ]]; then
  echo "Claude marketplace metadata must use the canonical license, repository, and agent-guide homepage." >&2
  exit 1
fi

if [[ ! -f "${PLUGIN_ROOT}/LICENSE" ]] ||
   ! grep -q "Apache License" "${PLUGIN_ROOT}/LICENSE" ||
   ! grep -q '^node_modules/$' "${PLUGIN_ROOT}/.gitignore"; then
  echo "Standalone repository must include its Apache-2.0 license and ignore node_modules." >&2
  exit 1
fi

if [[ "$(jq -r '.name' "${PLUGIN_ROOT}/.agents/plugins/marketplace.json")" != "vibooks" ]] ||
   [[ "$(jq -r '.interface.displayName' "${PLUGIN_ROOT}/.agents/plugins/marketplace.json")" != "Vibooks" ]]; then
  echo "Public Codex marketplace must use the Vibooks product identity." >&2
  exit 1
fi

if [[ "$(jq -r '.plugins[0].source.path' "${PLUGIN_ROOT}/.agents/plugins/marketplace.json")" != "./codex/vibooks" ]] ||
   [[ "$(jq -r '.plugins[0].source' "${PLUGIN_ROOT}/.claude-plugin/marketplace.json")" != "./claude/vibooks" ]]; then
  echo "Standalone marketplace entries must resolve from the public plugin repository root." >&2
  exit 1
fi

if [[ "$(jq -r '.plugins[0].category' "${PLUGIN_ROOT}/.agents/plugins/marketplace.json")" != "Finance" ]] ||
   [[ "$(jq -r '.plugins[0].category' "${PLUGIN_ROOT}/.claude-plugin/marketplace.json")" != "Finance" ]] ||
   [[ "$(jq -r '.interface.category' "${CODEX_ROOT}/.codex-plugin/plugin.json")" != "Finance" ]]; then
  echo "Vibooks public plugin listings must use the Finance category." >&2
  exit 1
fi

TASK_SKILLS=(setup bookkeep-documents reconcile-close review-books)
for skill in "${TASK_SKILLS[@]}"; do
  if [[ ! -f "${PLUGIN_ROOT}/skills/${skill}/SKILL.md" ]]; then
    echo "Missing task-oriented Vibooks plugin skill: ${skill}" >&2
    exit 1
  fi
done

if [[ -d "${PLUGIN_ROOT}/skills/vibooks-mcp" ]]; then
  echo "MCP implementation details must not remain a primary user-visible skill." >&2
  exit 1
fi

for dir in "${MATERIALIZED_DIRS[@]}"; do
  if ! diff -qr "${PLUGIN_ROOT}/${dir}" "${CODEX_ROOT}/${dir}" >/dev/null; then
    echo "Codex wrapper materialized copy is out of sync with the portable core: ${dir}" >&2
    echo "Run scripts/sync-codex-wrapper.sh after editing portable plugin content." >&2
    exit 1
  fi
done

for file in "${MATERIALIZED_FILES[@]}"; do
  if ! cmp -s "${PLUGIN_ROOT}/${file}" "${CODEX_ROOT}/${file}" ||
     ! cmp -s "${PLUGIN_ROOT}/${file}" "${PLUGIN_ROOT}/claude/vibooks/${file}"; then
    echo "Platform wrapper copy is out of sync with the portable core: ${file}" >&2
    echo "Run scripts/sync-codex-wrapper.sh after editing portable plugin content." >&2
    exit 1
  fi
done

if command -v rg >/dev/null 2>&1; then
  if rg -n 'Content-Length' "${PLUGIN_ROOT}/runtime/vibooks-mcp.mjs" >/dev/null; then
    echo "MCP stdio transport must use newline-delimited JSON-RPC, not Content-Length framing." >&2
    exit 1
  fi
elif grep -n 'Content-Length' "${PLUGIN_ROOT}/runtime/vibooks-mcp.mjs" >/dev/null; then
  echo "MCP stdio transport must use newline-delimited JSON-RPC, not Content-Length framing." >&2
  exit 1
fi

if command -v rg >/dev/null 2>&1; then
  if (cd "${PLUGIN_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '!**/*.png' --glob '!scripts/check-public-plugin-content.sh' -e "${PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains local paths or secret-looking content." >&2
    exit 1
  fi
else
  if (cd "${PLUGIN_ROOT}" && grep -RInE --exclude='*.png' --exclude='check-public-plugin-content.sh' --exclude-dir='.git' "${PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains local paths or secret-looking content." >&2
    exit 1
  fi
fi

if command -v rg >/dev/null 2>&1; then
  if (cd "${PLUGIN_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '!scripts/check-public-plugin-content.sh' -e "${SIBLING_PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains monorepo sibling-path references." >&2
    exit 1
  fi
else
  if (cd "${PLUGIN_ROOT}" && grep -RInE --exclude='check-public-plugin-content.sh' --exclude-dir='.git' "${SIBLING_PATTERN}" "${SCAN_ROOTS[@]}"); then
    echo "Public plugin package contains monorepo sibling-path references." >&2
    exit 1
  fi
fi

if command -v rg >/dev/null 2>&1; then
  if (cd "${PLUGIN_ROOT}" && rg -n --hidden --glob '!**/.git/**' --glob '*.md' -e '\.\./' "${PUBLIC_DOC_ROOTS[@]}"); then
    echo "Public plugin docs must use repository-root paths, not parent-directory references." >&2
    exit 1
  fi
else
  if (cd "${PLUGIN_ROOT}" && grep -RInE --include='*.md' '\.\./' "${PUBLIC_DOC_ROOTS[@]}"); then
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
    "${PLUGIN_ROOT}"/*) ;;
    *)
      echo "Public plugin symlink must resolve inside the portable Vibooks package: ${symlink_path} -> ${target}" >&2
      exit 1
      ;;
  esac
done < <(find "${PLUGIN_ROOT}/codex" "${PLUGIN_ROOT}/claude" -type l)

echo "Vibooks public plugin repository content check passed."
