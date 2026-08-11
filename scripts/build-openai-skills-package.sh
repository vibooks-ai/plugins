#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION="$(jq -r '.version' "${PLUGIN_ROOT}/codex/vibooks/.codex-plugin/plugin.json")"
OUTPUT_PATH="${1:-${PLUGIN_ROOT}/dist/vibooks-openai-${VERSION}.zip}"

mkdir -p "$(dirname "${OUTPUT_PATH}")"
OUTPUT_DIR="$(cd "$(dirname "${OUTPUT_PATH}")" && pwd)"
OUTPUT_PATH="${OUTPUT_DIR}/$(basename "${OUTPUT_PATH}")"

STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vibooks-openai-package.XXXXXX")"
trap 'rm -rf "${STAGING_DIR}"' EXIT
PACKAGE_ROOT="${STAGING_DIR}/vibooks"

mkdir -p "${PACKAGE_ROOT}/.codex-plugin"
cp "${PLUGIN_ROOT}/LICENSE" "${PACKAGE_ROOT}/LICENSE"
cp -R "${PLUGIN_ROOT}/skills" "${PACKAGE_ROOT}/skills"
cp -R "${PLUGIN_ROOT}/assets" "${PACKAGE_ROOT}/assets"
cp -R "${PLUGIN_ROOT}/submission/openai/skills/." "${PACKAGE_ROOT}/skills/"

jq '
  del(.mcpServers, .interface.screenshots)
  | .interface.composerIcon = "./assets/logo.png"
' "${PLUGIN_ROOT}/codex/vibooks/.codex-plugin/plugin.json" \
  > "${PACKAGE_ROOT}/.codex-plugin/plugin.json"

if [[ "$(jq -r '.mcpServers // empty' "${PACKAGE_ROOT}/.codex-plugin/plugin.json")" != "" ]] ||
   [[ "$(jq -r '.interface.screenshots // empty' "${PACKAGE_ROOT}/.codex-plugin/plugin.json")" != "" ]]; then
  echo "OpenAI skills-only package must not include MCP or screenshot configuration." >&2
  exit 1
fi

node "${SCRIPT_DIR}/check-png-dimensions.mjs" "${PACKAGE_ROOT}/assets/logo.png" 48 48

for skill in vibooks setup bookkeep-documents reconcile-close review-books; do
  if [[ ! -f "${PACKAGE_ROOT}/skills/${skill}/SKILL.md" ]] ||
     [[ ! -f "${PACKAGE_ROOT}/skills/${skill}/agents/openai.yaml" ]]; then
    echo "OpenAI skills-only package is missing skill content or interface metadata: ${skill}" >&2
    exit 1
  fi
done

rm -f "${OUTPUT_PATH}"
(
  cd "${STAGING_DIR}"
  zip -X -qr "${OUTPUT_PATH}" vibooks
)

echo "Built OpenAI skills-only plugin: ${OUTPUT_PATH}"
