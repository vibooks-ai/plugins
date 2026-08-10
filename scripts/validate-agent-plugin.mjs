#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, "..");
const SCHEMA_ROOT = path.join(PLUGIN_ROOT, "schemas", "agent-plugins", "1.0.0");
const PLUGIN_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const MCP_SCHEMA_URL = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";

const pluginManifest = readJson(path.join(PLUGIN_ROOT, "plugin.json"));
const mcpConfig = readJson(path.join(PLUGIN_ROOT, "mcp.json"));
const pluginSchema = readJson(path.join(SCHEMA_ROOT, "plugin.schema.json"));
const mcpSchema = readJson(path.join(SCHEMA_ROOT, "mcp.schema.json"));

const ajv = new Ajv2020({ allErrors: true, strict: true });
validateWithSchema(ajv.compile(pluginSchema), pluginManifest, "plugin.json");
validateWithSchema(ajv.compile(mcpSchema), mcpConfig, "mcp.json");

assert(pluginSchema.$id === PLUGIN_SCHEMA_URL, "Vendored plugin schema has an unexpected $id.");
assert(mcpSchema.$id === MCP_SCHEMA_URL, "Vendored MCP schema has an unexpected $id.");
assert(pluginManifest.$schema === PLUGIN_SCHEMA_URL, "plugin.json must target Agent Plugins 1.0.0.");
assert(mcpConfig.$schema === MCP_SCHEMA_URL, "mcp.json must target Agent Plugins 1.0.0.");

validateSkills();
validateMcpServers();

console.log("Vibooks Agent Plugins 1.0.0 validation passed.");

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Could not read valid JSON from ${relative(filePath)}: ${error.message}`);
  }
}

function validateWithSchema(validate, value, label) {
  if (validate(value)) {
    return;
  }
  const details = validate.errors
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
  fail(`${label} does not match its official Agent Plugins schema: ${details}`);
}

function validateSkills() {
  const skillsRoot = path.join(PLUGIN_ROOT, "skills");
  assert(existsSync(skillsRoot) && statSync(skillsRoot).isDirectory(), "skills/ must be a directory.");

  const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  assert(skillDirectories.length > 0, "skills/ must contain at least one skill directory.");

  for (const entry of skillDirectories) {
    const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
    assert(
      existsSync(skillFile) && statSync(skillFile).isFile(),
      `skills/${entry.name}/SKILL.md must be a regular file.`,
    );
  }
}

function validateMcpServers() {
  for (const [name, server] of Object.entries(mcpConfig.mcpServers)) {
    if (server.type === "stdio") {
      assert(!/\s/.test(server.command), `MCP server ${name} command must be one executable token.`);
      assert(
        !server.command.includes("/") || server.command.startsWith("./"),
        `MCP server ${name} command must be bare or begin with ./.`,
      );
      if (server.command.startsWith("./")) {
        assertBundledPath(name, server.command.slice(2));
      }
      for (const argument of server.args || []) {
        if (argument.startsWith("${PLUGIN_ROOT}/")) {
          assertBundledPath(name, argument.slice("${PLUGIN_ROOT}/".length));
        }
      }
      validateWorkingDirectory(name, server.cwd);
      continue;
    }

    const url = new URL(server.url);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
    assert(
      url.protocol === "https:" || (url.protocol === "http:" && loopback),
      `MCP server ${name} must use HTTPS unless it targets loopback.`,
    );
    assert(!url.username && !url.password && !url.hash, `MCP server ${name} URL contains forbidden data.`);
  }
}

function validateWorkingDirectory(name, cwd) {
  if (!cwd || cwd.startsWith("${PLUGIN_DATA}")) {
    return;
  }
  const relativePath = cwd === "${PLUGIN_ROOT}" ? "." : cwd
    .replace(/^\$\{PLUGIN_ROOT\}\/?/, "")
    .replace(/^\.\//, "");
  const resolved = path.resolve(PLUGIN_ROOT, relativePath);
  assertInsidePluginRoot(resolved, `MCP server ${name} cwd escapes the plugin root.`);
  assert(existsSync(resolved) && statSync(resolved).isDirectory(), `MCP server ${name} cwd does not exist.`);
}

function assertBundledPath(serverName, relativePath) {
  const resolved = path.resolve(PLUGIN_ROOT, relativePath);
  assertInsidePluginRoot(resolved, `MCP server ${serverName} references a path outside the plugin root.`);
  assert(existsSync(resolved), `MCP server ${serverName} references missing path ${relativePath}.`);
  assertInsidePluginRoot(
    realpathSync(resolved),
    `MCP server ${serverName} references a path that resolves outside the plugin root.`,
  );
}

function assertInsidePluginRoot(candidate, message) {
  const relativePath = path.relative(realpathSync(PLUGIN_ROOT), candidate);
  assert(relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)), message);
}

function relative(filePath) {
  return path.relative(PLUGIN_ROOT, filePath) || ".";
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
