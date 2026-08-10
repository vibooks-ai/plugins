#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
const version = process.argv[2];
const versionPattern = /^\d+\.\d+\.\d+(?:-rc\.\d+)?$/;

if (!versionPattern.test(version ?? "")) {
  console.error("Usage: npm run version:set -- X.Y.Z or X.Y.Z-rc.N");
  process.exit(1);
}

const manifests = [
  "plugin.json",
  "codex/vibooks/.codex-plugin/plugin.json",
  "claude/vibooks/.claude-plugin/plugin.json",
];

for (const relativePath of manifests) {
  const manifestPath = resolve(PLUGIN_ROOT, relativePath);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.version = version;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`Set Vibooks Agent Plugin manifests to ${version}.`);
