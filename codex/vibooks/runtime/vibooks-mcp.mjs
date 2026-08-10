#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SERVER_NAME = "vibooks";
const DEFAULT_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
]);
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_DOWNLOADS_URL = "https://vibooks.ai/downloads.json";
const DEFAULT_SKILL_MANIFEST_URL = "https://vibooks.ai/skills/manifest.json";
const OFFICIAL_UPDATE_PATHS = new Set(["/downloads.json", "/skills/manifest.json"]);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const PLUGIN_ROOT = resolve(SCRIPT_DIR, "..");
const SERVER_VERSION = await readInstalledPluginVersion();

const jsonValueSchema = {
  anyOf: [
    { type: "object" },
    { type: "array" },
    { type: "string" },
    { type: "number" },
    { type: "boolean" },
    { type: "null" },
  ],
};

const keyValueSchema = {
  type: "object",
  additionalProperties: {
    anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
  },
};

const operationSelectorSchema = {
  selector: {
    type: "string",
    description: "OpenAPI operation alias, such as get-v1-books.",
  },
  method: {
    type: "string",
    description: "HTTP method when selecting by method + route.",
  },
  route: {
    type: "string",
    description: "HTTP route when selecting by method + route.",
  },
};

const tools = [
  {
    name: "vibooks_readiness",
    description: "Run `vibooks-cli doctor --json` to check local Vibooks API, token, and install readiness.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_desktop_status",
    description: "Inspect the Vibooks desktop-local connection state with `vibooks-cli desktop status --json`.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_license_status",
    description: "Inspect current Vibooks trial or license state with `vibooks-cli license status --json`.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_ops",
    description: "Search live Vibooks OpenAPI operations through `vibooks-cli ops --json`.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" },
        tag: { type: "string" },
        method: { type: "string" },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_describe",
    description: "Describe one Vibooks OpenAPI operation by alias or by method + route.",
    inputSchema: {
      type: "object",
      properties: operationSelectorSchema,
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_schemas",
    description: "Search Vibooks OpenAPI schema names and summaries.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string" },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_schema",
    description: "Return one Vibooks OpenAPI schema by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_verify",
    description: "Run high-level Vibooks book verification with trial balance, reports, reconciliation checks, and advisory tasks.",
    inputSchema: {
      type: "object",
      properties: {
        bookId: { type: "string" },
        asOf: { type: "string", description: "As-of date in YYYY-MM-DD format." },
        dateFrom: { type: "string", description: "Start date for period reports." },
        dateTo: { type: "string", description: "End date for period reports." },
        expectedAccountBalances: {
          type: "array",
          items: { type: "string" },
          description: "Optional ACCOUNT_OR_CODE=AMOUNT checks.",
        },
      },
      required: ["bookId", "asOf"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "vibooks_update_status",
    description: "Check Vibooks product, CLI, bundled skill, and plugin update status using the update rules documented in the Vibooks skill. This never performs updates.",
    inputSchema: {
      type: "object",
      properties: {
        downloadsUrl: {
          type: "string",
          description: "Official Vibooks downloads catalog URL. Defaults to the bundled skill metadata downloads URL.",
        },
        skillManifestUrl: {
          type: "string",
          description: "Official Vibooks skill manifest URL. Defaults to the bundled skill metadata update_check URL.",
        },
        checkLocal: {
          type: "boolean",
          description: "When true, also run local vibooks-cli version and doctor checks. Defaults to true.",
        },
        includeNetwork: {
          type: "boolean",
          description: "When true, fetch public update manifests. Defaults to true.",
        },
        cliVersion: {
          type: "string",
          description: "Optional known local vibooks-cli version override.",
        },
        desktopVersion: {
          type: "string",
          description: "Optional known local Vibooks desktop version override.",
        },
        headlessVersion: {
          type: "string",
          description: "Optional known local Vibooks headless version override.",
        },
        skillVersion: {
          type: "string",
          description: "Optional installed Vibooks skill version override. Defaults to the bundled skill metadata skill_version.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "vibooks_invoke",
    description: "Invoke a discovered Vibooks OpenAPI operation through vibooks-cli. Non-read-only operations require confirmMutation=true.",
    inputSchema: {
      type: "object",
      properties: {
        ...operationSelectorSchema,
        path: keyValueSchema,
        query: keyValueSchema,
        headers: keyValueSchema,
        body: jsonValueSchema,
        includeStatus: {
          type: "boolean",
          description: "Include HTTP status in the CLI response. Defaults to true.",
        },
        confirmMutation: {
          type: "boolean",
          description: "Required for non-read-only operations after the user authorizes the intended write.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
  },
];

const toolHandlers = {
  vibooks_readiness: async () => runCliTool(["doctor", "--json"]),
  vibooks_desktop_status: async () => runCliTool(["desktop", "status", "--json"]),
  vibooks_license_status: async () => runCliTool(["license", "status", "--json"]),
  vibooks_ops: async (args) => {
    const cliArgs = ["ops", "--json"];
    appendOptionalFlag(cliArgs, "--search", args.search);
    appendOptionalFlag(cliArgs, "--tag", args.tag);
    appendOptionalFlag(cliArgs, "--method", args.method);
    return runCliTool(cliArgs);
  },
  vibooks_describe: async (args) => runCliTool(["describe", ...buildSelectorArgs(args), "--json"]),
  vibooks_schemas: async (args) => {
    const cliArgs = ["schemas", "--json"];
    appendOptionalFlag(cliArgs, "--search", args.search);
    return runCliTool(cliArgs);
  },
  vibooks_schema: async (args) => {
    requireString(args.name, "name");
    return runCliTool(["schema", args.name, "--json"]);
  },
  vibooks_verify: async (args) => {
    requireString(args.bookId, "bookId");
    requireString(args.asOf, "asOf");
    if (Boolean(args.dateFrom) !== Boolean(args.dateTo)) {
      throw new UserInputError("Pass both dateFrom and dateTo together.");
    }
    const cliArgs = ["verify", "--book-id", args.bookId, "--as-of", args.asOf, "--json"];
    appendOptionalFlag(cliArgs, "--date-from", args.dateFrom);
    appendOptionalFlag(cliArgs, "--date-to", args.dateTo);
    for (const check of args.expectedAccountBalances ?? []) {
      requireString(check, "expectedAccountBalances[]");
      cliArgs.push("--expect-account-balance", check);
    }
    return runCliTool(cliArgs);
  },
  vibooks_update_status: async (args) => buildUpdateStatus(args),
  vibooks_invoke: async (args) => {
    const selectorArgs = buildSelectorArgs(args);
    const operation = await describeOperation(selectorArgs);
    const method = String(operation.method ?? args.method ?? "").toUpperCase();
    const isReadOnly = READ_ONLY_METHODS.has(method);
    if (!isReadOnly && args.confirmMutation !== true) {
      throw new UserInputError(
        `Operation ${method || "UNKNOWN"} ${operation.path ?? ""} is not read-only. ` +
          "Set confirmMutation=true only after the user authorizes the intended Vibooks write and the payload has been reviewed.",
      );
    }

    const cliArgs = ["invoke", ...selectorArgs];
    appendPairs(cliArgs, "--path", args.path);
    appendPairs(cliArgs, "--query", args.query);
    appendHeaders(cliArgs, args.headers);
    if (Object.prototype.hasOwnProperty.call(args, "body")) {
      cliArgs.push("--body", stringifyBody(args.body));
    }
    if (args.includeStatus !== false) {
      cliArgs.push("--include-status");
    }
    return runCliTool(cliArgs, { parseJson: false });
  },
};

class UserInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserInputError";
  }
}

export async function handleRequest(message) {
  if (!message || message.jsonrpc !== "2.0") {
    return jsonRpcError(null, -32600, "Invalid JSON-RPC message.");
  }
  if (message.id === undefined || message.id === null) {
    return null;
  }

  try {
    if (message.method === "initialize") {
      const requestedProtocolVersion = message.params?.protocolVersion;
      return jsonRpcResult(message.id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.has(requestedProtocolVersion)
          ? requestedProtocolVersion
          : DEFAULT_PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: SERVER_NAME,
          version: SERVER_VERSION,
        },
        instructions:
          "Use Vibooks MCP tools through official vibooks-cli and API paths only. Run readiness and discovery before bookkeeping work. Non-read-only operations require explicit user-authorized confirmMutation.",
      });
    }
    if (message.method === "ping") {
      return jsonRpcResult(message.id, {});
    }
    if (message.method === "tools/list") {
      return jsonRpcResult(message.id, { tools });
    }
    if (message.method === "tools/call") {
      const name = message.params?.name;
      const handler = toolHandlers[name];
      if (!handler) {
        return jsonRpcError(message.id, -32602, `Unknown Vibooks tool: ${name}`);
      }
      const args = coerceArguments(message.params?.arguments);
      try {
        const result = await handler(args);
        return jsonRpcResult(message.id, {
          content: [{ type: "text", text: result }],
        });
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        return jsonRpcResult(message.id, {
          isError: true,
          content: [{ type: "text", text: messageText }],
        });
      }
    }
    return jsonRpcError(message.id, -32601, `Method not found: ${message.method}`);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    return jsonRpcError(message.id, -32603, messageText);
  }
}

export function encodeMessage(message) {
  return Buffer.from(`${JSON.stringify(message)}\n`, "utf8");
}

export function extractMessages(buffer) {
  const messages = [];
  let offset = 0;
  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf(0x0a, offset);
    if (lineEnd < 0) {
      break;
    }
    let rawLine = buffer.subarray(offset, lineEnd).toString("utf8");
    if (rawLine.endsWith("\r")) rawLine = rawLine.slice(0, -1);
    if (rawLine.length === 0) throw new Error("MCP stdio message must not be empty.");
    messages.push(JSON.parse(rawLine));
    offset = lineEnd + 1;
  }
  return { messages, rest: buffer.subarray(offset) };
}

export async function runCli(args, options = {}) {
  const command = process.env.VIBOOKS_CLI || "vibooks-cli";
  const timeoutMs = positiveInteger(process.env.VIBOOKS_MCP_TIMEOUT_MS, 60_000);
  const maxOutputBytes = positiveInteger(process.env.VIBOOKS_MCP_MAX_OUTPUT_BYTES, 2_000_000);
  return new Promise((resolve) => {
    let settled = false;
    let stdout = Buffer.alloc(0);
    let stderr = Buffer.alloc(0);
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, options.timeoutMs ?? timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = cappedConcat(stdout, chunk, maxOutputBytes);
    });
    child.stderr.on("data", (chunk) => {
      stderr = cappedConcat(stderr, chunk, maxOutputBytes);
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        ok: false,
        command,
        args,
        exitCode: null,
        signal: null,
        stdout: stdout.toString("utf8"),
        stderr: `${stderr.toString("utf8")}${error.message}`,
      });
    });
    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        ok: exitCode === 0,
        command,
        args,
        exitCode,
        signal,
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
      });
    });
  });
}

async function runCliTool(args, options = {}) {
  const result = await runCli(args, options);
  const parsedStdout = options.parseJson === false ? undefined : tryParseJson(result.stdout);
  const payload = {
    ok: result.ok,
    command: result.command,
    args: result.args,
    exitCode: result.exitCode,
    signal: result.signal,
    stdout: parsedStdout ?? result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
  return JSON.stringify(payload, null, 2);
}

async function describeOperation(selectorArgs) {
  const result = await runCli(["describe", ...selectorArgs, "--json"]);
  if (!result.ok) {
    throw new UserInputError(
      `Unable to resolve Vibooks operation before invoke.\n${result.stderr || result.stdout}`,
    );
  }
  const parsed = tryParseJson(result.stdout);
  if (!parsed || typeof parsed !== "object") {
    throw new UserInputError("Vibooks operation description did not return JSON.");
  }
  return parsed;
}

async function buildUpdateStatus(args) {
  const bundledSkill = await readBundledSkillMetadata();
  const downloadsUrl = args.downloadsUrl || bundledSkill.metadata.downloads || DEFAULT_DOWNLOADS_URL;
  const skillManifestUrl =
    args.skillManifestUrl || bundledSkill.metadata.update_check || DEFAULT_SKILL_MANIFEST_URL;
  const includeNetwork = args.includeNetwork !== false;
  const checkLocal = args.checkLocal !== false;

  const downloads = includeNetwork
    ? await loadJsonStatus(downloadsUrl, "downloads.json")
    : skippedCatalog(downloadsUrl, "downloads.json", "includeNetwork=false");
  const skillManifest = includeNetwork
    ? await loadJsonStatus(skillManifestUrl, "skills manifest")
    : skippedCatalog(skillManifestUrl, "skills manifest", "includeNetwork=false");

  const cliVersion = args.cliVersion ?? (checkLocal ? await detectCliVersion() : null);
  const doctor = checkLocal ? await detectProductServiceVersion() : { ok: false, skipped: true };
  const serviceComponent = doctor.component ?? "unknown";
  const serviceVersion = doctor.version ?? null;
  const desktopVersion =
    args.desktopVersion ?? (serviceComponent === "desktop" ? serviceVersion : null);
  const headlessVersion =
    args.headlessVersion ?? (serviceComponent === "headless" ? serviceVersion : null);
  const skillVersion = args.skillVersion ?? bundledSkill.metadata.skill_version ?? null;
  const pluginVersions = await readPluginVersions();

  const downloadVersion = downloads.ok && isPlainObject(downloads.json?.version) ? downloads.json.version : {};
  const latestSkillVersion = skillManifest.ok
    ? firstString(skillManifest.json.latest_version, skillManifest.json.version)
    : null;

  const components = [
    buildVersionComponent({
      component: "vibooks-desktop",
      currentVersion: desktopVersion,
      latestVersion: stringOrNull(downloadVersion.desktop),
      currentSource:
        args.desktopVersion !== undefined
          ? "input.desktopVersion"
          : serviceComponent === "desktop"
            ? "vibooks-cli doctor health.version"
            : "not_detected",
      latestSource: downloadsUrl,
      updateRule:
        "Compare installed desktop build with downloads.json version.desktop. If local is lower, update through the official desktop channel and rerun vibooks-cli doctor --json.",
    }),
    buildVersionComponent({
      component: "vibooks-headless",
      currentVersion: headlessVersion,
      latestVersion: stringOrNull(downloadVersion.headless),
      currentSource:
        args.headlessVersion !== undefined
          ? "input.headlessVersion"
          : serviceComponent === "headless"
            ? "vibooks-cli doctor health.version"
            : "not_detected",
      latestSource: downloadsUrl,
      updateRule:
        "Compare installed headless bundle with downloads.json version.headless. If local is lower, reinstall from the official headless target in downloads.json and rerun vibooks-cli doctor --json.",
    }),
    buildVersionComponent({
      component: "vibooks-cli",
      currentVersion: cliVersion,
      latestVersion: stringOrNull(downloadVersion.cli),
      currentSource: args.cliVersion !== undefined ? "input.cliVersion" : "vibooks-cli --version",
      latestSource: downloadsUrl,
      updateRule:
        "Compare vibooks-cli --version with downloads.json version.cli. If local is lower, update through the user's official CLI channel, preferring Homebrew when that is how the user manages vibooks-cli.",
    }),
    buildVersionComponent({
      component: "vibooks-skill",
      currentVersion: skillVersion,
      latestVersion: latestSkillVersion,
      minimumRecommendedVersion: stringOrNull(skillManifest.json?.minimum_recommended_version),
      currentSource: args.skillVersion !== undefined ? "input.skillVersion" : "bundled skill metadata.skill_version",
      latestSource: skillManifestUrl,
      updateRule:
        "Use the Vibooks skill update rules: run npx skills check, disclose that npx skills update refreshes all installed skills, and never silently self-update.",
    }),
  ];

  const updateAvailable = components.some((component) => component.status === "outdated");
  const skillComponent = components.find((component) => component.component === "vibooks-skill");
  const skillCritical = Boolean(skillManifest.json?.critical_update);
  const skillUpdateRecommended =
    skillComponent?.status === "outdated" ||
    skillComponent?.status === "missing" ||
    skillComponent?.below_minimum_recommended === true;

  const recommendedNextSteps = buildUpdateNextSteps({
    components,
    downloadsOk: downloads.ok,
    skillManifestOk: skillManifest.ok,
    skillCritical,
    skillUpdateRecommended,
    bundledSkill,
  });

  return JSON.stringify(
    {
      ok: true,
      generated_at: new Date().toISOString(),
      rules_source: {
        product_updates: "bundled Vibooks skill reference: references/install-access.md",
        skill_updates: "bundled Vibooks skill metadata and Update This Skill section",
        plugin_updates: "agent platform marketplace; not downloads.json and not npx skills update",
      },
      catalogs: {
        downloads,
        skill_manifest: skillManifest,
      },
      local: {
        vibooks_cli_version: cliVersion,
        product_service: {
          detected: doctor.ok === true,
          component: serviceComponent,
          version: serviceVersion,
          mode: doctor.mode ?? null,
          service: doctor.service ?? null,
          error: doctor.error ?? null,
        },
        bundled_skill_version: bundledSkill.metadata.skill_version ?? null,
        plugin_versions: pluginVersions,
      },
      components,
      summary: {
        update_available: updateAvailable,
        skill_update_recommended: skillUpdateRecommended,
        critical_skill_update: skillCritical,
        requires_user_approval_before_update: true,
      },
      recommended_next_steps: recommendedNextSteps,
      update_policies: {
        vibooks_product:
          "downloads.json is the authoritative latest official direct-download catalog for desktop, headless, and CLI versions. Package-manager catalogs can lag it.",
        vibooks_skill: {
          check_command: bundledSkill.metadata.update_check_command ?? "npx skills check",
          update_command: bundledSkill.metadata.update_all_command ?? "npx skills update",
          update_scope: bundledSkill.metadata.update_scope ?? "all_installed_skills",
          install_command: bundledSkill.metadata.install_command ?? null,
          web_fallback: bundledSkill.metadata.web_fallback ?? "https://vibooks.ai/skill.md",
          silent_self_update_allowed: false,
          critical_update_blocks_high_risk_writes: skillCritical,
          blocking_update_before: Array.isArray(skillManifest.json?.blocking_update_before)
            ? skillManifest.json.blocking_update_before
            : [],
        },
        vibooks_plugin: buildPluginUpdatePolicy(pluginVersions),
      },
    },
    null,
    2,
  );
}

async function readBundledSkillMetadata() {
  const skillPath = resolve(PLUGIN_ROOT, "skills", "vibooks", "SKILL.md");
  try {
    const contents = await readFile(skillPath, "utf8");
    return {
      ok: true,
      path: "skills/vibooks/SKILL.md",
      metadata: parseSkillMetadata(contents),
    };
  } catch (error) {
    return {
      ok: false,
      path: "skills/vibooks/SKILL.md",
      metadata: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseSkillMetadata(contents) {
  const metadata = {};
  const frontmatterEnd = contents.startsWith("---\n") ? contents.indexOf("\n---", 4) : -1;
  if (frontmatterEnd < 0) return metadata;
  const frontmatter = contents.slice(4, frontmatterEnd).split(/\r?\n/);
  let inMetadata = false;
  for (const line of frontmatter) {
    if (/^\S/.test(line)) {
      inMetadata = line.trim() === "metadata:";
      continue;
    }
    if (!inMetadata) continue;
    const match = /^ {2}([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    metadata[match[1]] = unquoteYamlScalar(match[2].trim());
  }
  return metadata;
}

function unquoteYamlScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

async function loadJsonStatus(url, label) {
  try {
    const json = await loadJsonResource(url);
    return {
      ok: true,
      label,
      url,
      json,
    };
  } catch (error) {
    return {
      ok: false,
      label,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function skippedCatalog(url, label, reason) {
  return {
    ok: false,
    skipped: true,
    label,
    url,
    error: reason,
  };
}

async function loadJsonResource(rawUrl) {
  requireString(rawUrl, "manifest URL");
  const manifestUrl = validateOfficialUpdateUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    positiveInteger(process.env.VIBOOKS_MCP_UPDATE_FETCH_TIMEOUT_MS, 10_000),
  );
  try {
    const response = await fetch(manifestUrl, {
      signal: controller.signal,
      redirect: "error",
      headers: {
        accept: "application/json",
        "user-agent": `VibooksMCP/${SERVER_VERSION}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${manifestUrl}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function validateOfficialUpdateUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UserInputError("Update manifest URL must be a valid URL.");
  }
  const usesDefaultPort = url.port === "" || url.port === "443";
  if (
    url.protocol !== "https:" ||
    url.hostname !== "vibooks.ai" ||
    !usesDefaultPort ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !OFFICIAL_UPDATE_PATHS.has(url.pathname)
  ) {
    throw new UserInputError(
      "Update manifests must use an approved https://vibooks.ai manifest URL without credentials, query parameters, fragments, or redirects.",
    );
  }
  return url.href;
}

async function detectCliVersion() {
  const result = await runCli(["--version"], { timeoutMs: 10_000 });
  if (!result.ok) return null;
  return extractVersion(result.stdout);
}

async function detectProductServiceVersion() {
  const result = await runCli(["doctor", "--json"]);
  if (!result.ok) {
    return {
      ok: false,
      error: result.stderr.trim() || result.stdout.trim() || `vibooks-cli exited ${result.exitCode}`,
    };
  }
  const parsed = tryParseJson(result.stdout);
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "vibooks-cli doctor did not return JSON." };
  }
  const healthBody = parsed.health?.body && isPlainObject(parsed.health.body) ? parsed.health.body : {};
  const mode = stringOrNull(healthBody.mode);
  return {
    ok: true,
    version: stringOrNull(healthBody.version),
    mode,
    service: stringOrNull(healthBody.service),
    component: inferProductComponent(mode),
  };
}

function inferProductComponent(mode) {
  const normalized = String(mode || "").toLowerCase();
  if (normalized.includes("headless")) return "headless";
  if (normalized.includes("desktop")) return "desktop";
  return "unknown";
}

async function readPluginVersions() {
  const codex = await readPluginVersion(".codex-plugin/plugin.json");
  const claude = await readPluginVersion(".claude-plugin/plugin.json");
  return {
    codex: codex.version ? codex : null,
    claude: claude.version ? claude : null,
  };
}

async function readPluginVersion(relativePath) {
  try {
    const parsed = JSON.parse(await readFile(resolve(PLUGIN_ROOT, relativePath), "utf8"));
    return {
      version: stringOrNull(parsed.version),
      source: relativePath,
    };
  } catch {
    return {
      version: null,
      source: relativePath,
    };
  }
}

function buildVersionComponent({
  component,
  currentVersion,
  latestVersion,
  minimumRecommendedVersion = null,
  currentSource,
  latestSource,
  updateRule,
}) {
  const comparison =
    currentVersion && latestVersion ? compareVersions(currentVersion, latestVersion) : null;
  const minimumComparison =
    currentVersion && minimumRecommendedVersion
      ? compareVersions(currentVersion, minimumRecommendedVersion)
      : null;
  let status = "unknown";
  if (!currentVersion) {
    status = "missing";
  } else if (!latestVersion) {
    status = "unknown";
  } else if (comparison < 0) {
    status = "outdated";
  } else if (comparison > 0) {
    status = "ahead";
  } else {
    status = "current";
  }
  return {
    component,
    current_version: currentVersion ?? null,
    latest_version: latestVersion ?? null,
    minimum_recommended_version: minimumRecommendedVersion ?? null,
    status,
    below_minimum_recommended: minimumComparison !== null ? minimumComparison < 0 : false,
    current_source: currentSource,
    latest_source: latestSource,
    update_rule: updateRule,
  };
}

function buildUpdateNextSteps({
  components,
  downloadsOk,
  skillManifestOk,
  skillCritical,
  skillUpdateRecommended,
  bundledSkill,
}) {
  const steps = [];
  if (!downloadsOk) {
    steps.push("Could not confirm downloads.json, so do not claim product or CLI versions are current.");
  }
  if (!skillManifestOk) {
    steps.push("Could not confirm the public skill manifest; use the official web fallback before high-risk writes if local skill freshness cannot be verified.");
  }
  for (const component of components) {
    if (component.status === "outdated") {
      steps.push(`${component.component} is older than the latest official version; follow its documented update rule.`);
    }
  }
  if (skillUpdateRecommended) {
    steps.push(
      `Run ${bundledSkill.metadata.update_check_command ?? "npx skills check"} and ask before running ${
        bundledSkill.metadata.update_all_command ?? "npx skills update"
      }, because that refreshes all installed skills.`,
    );
  }
  if (skillCritical) {
    steps.push("Critical Vibooks skill update is marked true; stop before high-risk bookkeeping writes until the user approves the documented refresh or fallback.");
  }
  if (steps.length === 0) {
    steps.push("No outdated component was detected from the available manifests and local version checks.");
  }
  steps.push("This tool never performs updates; it only reports status and the documented update path.");
  return steps;
}

function buildPluginUpdatePolicy(pluginVersions) {
  return {
    latest_source: "agent platform marketplace metadata, not Vibooks downloads.json",
    detected_current_versions: pluginVersions,
    codex: {
      update_path:
        "Refresh the configured Codex plugin marketplace, then update or reinstall the vibooks plugin from that same marketplace through Codex UI or CLI.",
      cli_hint:
        "For Git marketplaces use `codex plugin marketplace upgrade`; for local marketplaces refresh the source repo and reinstall/add `vibooks` from the configured marketplace if needed.",
    },
    claude: {
      update_path:
        "Run `claude plugin marketplace update vibooks`, then `claude plugin update vibooks@vibooks` for a user-scope install when appropriate.",
    },
    not_updated_by: "npx skills update updates installed Agent Skills, not Codex or Claude plugins.",
    silent_self_update_allowed: false,
  };
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] < b.core[index] ? -1 : 1;
  }
  if (a.rc === null && b.rc === null) return 0;
  if (a.rc === null) return 1;
  if (b.rc === null) return -1;
  if (a.rc === b.rc) return 0;
  return a.rc < b.rc ? -1 : 1;
}

function parseVersion(value) {
  const version = extractVersion(value);
  if (!version) return null;
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?/.exec(version);
  if (!match) return null;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    rc: match[4] === undefined ? null : Number(match[4]),
  };
}

function extractVersion(value) {
  const match = String(value || "").match(/\bv?(\d+\.\d+\.\d+(?:-rc\.\d+)?)\b/);
  return match ? match[1] : null;
}

function buildSelectorArgs(args) {
  const selectorArgs = [];
  if (args.selector) {
    requireString(args.selector, "selector");
    selectorArgs.push(args.selector);
  }
  if (args.method || args.route) {
    requireString(args.method, "method");
    requireString(args.route, "route");
    selectorArgs.push("--method", args.method, "--route", args.route);
  }
  if (selectorArgs.length === 0) {
    throw new UserInputError("Pass selector, or pass both method and route.");
  }
  return selectorArgs;
}

function appendOptionalFlag(cliArgs, flag, value) {
  if (value === undefined || value === null || value === "") return;
  requireString(String(value), flag);
  cliArgs.push(flag, String(value));
}

function appendPairs(cliArgs, flag, pairs) {
  if (pairs === undefined || pairs === null) return;
  if (!isPlainObject(pairs)) {
    throw new UserInputError(`${flag} must be an object.`);
  }
  for (const [key, value] of Object.entries(pairs)) {
    if (value === undefined || value === null) continue;
    requireString(key, `${flag} key`);
    cliArgs.push(flag, `${key}=${String(value)}`);
  }
}

function appendHeaders(cliArgs, headers) {
  if (headers === undefined || headers === null) return;
  if (!isPlainObject(headers)) {
    throw new UserInputError("headers must be an object.");
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization") {
      throw new UserInputError("Do not pass Authorization manually; vibooks-cli applies the configured Vibooks token.");
    }
    if (value === undefined || value === null) continue;
    cliArgs.push("--header", `${key}=${String(value)}`);
  }
}

function stringifyBody(value) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function requireString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new UserInputError(`${name} must be a non-empty string.`);
  }
}

function coerceArguments(value) {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) {
    throw new UserInputError("Tool arguments must be an object.");
  }
  return value;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstString(...values) {
  for (const value of values) {
    const normalized = stringOrNull(value);
    if (normalized) return normalized;
  }
  return null;
}

function tryParseJson(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function positiveInteger(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function cappedConcat(current, chunk, maxBytes) {
  if (current.length >= maxBytes) return current;
  const next = Buffer.concat([current, Buffer.from(chunk)]);
  return next.length > maxBytes ? next.subarray(0, maxBytes) : next;
}

function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
}

export async function runStdioServer({ input = process.stdin, output = process.stdout } = {}) {
  let buffer = Buffer.alloc(0);
  const maxInputBytes = positiveInteger(process.env.VIBOOKS_MCP_MAX_INPUT_BYTES, 10_000_000);
  let queue = Promise.resolve();

  input.on("data", (chunk) => {
    queue = queue.then(async () => {
      if (buffer.length + chunk.length > maxInputBytes) {
        output.write(
          encodeMessage(jsonRpcError(null, -32700, `MCP input exceeded ${maxInputBytes} bytes.`)),
        );
        buffer = Buffer.alloc(0);
        return;
      }

      buffer = Buffer.concat([buffer, chunk]);
      let parsed;
      try {
        parsed = extractMessages(buffer);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.write(encodeMessage(jsonRpcError(null, -32700, message)));
        buffer = Buffer.alloc(0);
        return;
      }
      buffer = parsed.rest;
      for (const message of parsed.messages) {
        const response = await handleRequest(message);
        if (response) {
          output.write(encodeMessage(response));
        }
      }
    });
  });
}

async function readInstalledPluginVersion() {
  for (const relativePath of [
    "plugin.json",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
  ]) {
    try {
      const parsed = JSON.parse(await readFile(resolve(PLUGIN_ROOT, relativePath), "utf8"));
      if (typeof parsed.version === "string" && parsed.version.trim() !== "") {
        return parsed.version;
      }
    } catch {
      // Try the next platform manifest.
    }
  }
  return "0.0.0";
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entrypoint) {
  await runStdioServer();
}
