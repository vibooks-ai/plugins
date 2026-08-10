#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CODEX_ROOT="${CORE_ROOT}/codex/vibooks"

for dir in assets docs runtime skills; do
  source_dir="${CORE_ROOT}/${dir}"
  target_dir="${CODEX_ROOT}/${dir}"
  if [[ ! -d "${source_dir}" ]]; then
    echo "Missing portable plugin core directory: ${source_dir}" >&2
    exit 1
  fi
  rm -rf "${target_dir}"
  mkdir -p "$(dirname "${target_dir}")"
  cp -R "${source_dir}" "${target_dir}"
done

echo "Synced Codex wrapper materialized copies from the portable Vibooks plugin core."
