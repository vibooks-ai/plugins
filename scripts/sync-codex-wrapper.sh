#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SHARED_ROOT="${PUBLIC_ROOT}/plugins/shared/vibooks"
CODEX_ROOT="${PUBLIC_ROOT}/plugins/codex/vibooks"

for dir in assets docs scripts skills; do
  source_dir="${SHARED_ROOT}/${dir}"
  target_dir="${CODEX_ROOT}/${dir}"
  if [[ ! -d "${source_dir}" ]]; then
    echo "Missing shared plugin directory: ${source_dir}" >&2
    exit 1
  fi
  rm -rf "${target_dir}"
  mkdir -p "$(dirname "${target_dir}")"
  cp -R "${source_dir}" "${target_dir}"
done

echo "Synced Codex wrapper materialized copies from shared Vibooks plugin core."
