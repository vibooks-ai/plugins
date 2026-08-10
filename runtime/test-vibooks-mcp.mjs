import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { encodeMessage, extractMessages, handleRequest } from "./vibooks-mcp.mjs";

test("lists Vibooks MCP tools", async () => {
  const response = await handleRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  });

  assert.equal(response.result.tools.some((tool) => tool.name === "vibooks_readiness"), true);
  assert.equal(response.result.tools.some((tool) => tool.name === "vibooks_invoke"), true);
  assert.equal(response.result.tools.some((tool) => tool.name === "vibooks_update_status"), true);
});

test("encodes and extracts newline-delimited MCP messages", () => {
  const message = { jsonrpc: "2.0", id: 7, result: { ok: true } };
  const encoded = encodeMessage(message);
  assert.equal(encoded.toString("utf8"), `${JSON.stringify(message)}\n`);
  assert.equal(encoded.toString("utf8").includes("Content-Length"), false);
  const parsed = extractMessages(encoded);
  assert.deepEqual(parsed.messages, [{ jsonrpc: "2.0", id: 7, result: { ok: true } }]);
  assert.equal(parsed.rest.length, 0);
});

test("negotiates a supported legacy MCP protocol version", async () => {
  const supported = await handleRequest({
    jsonrpc: "2.0",
    id: 70,
    method: "initialize",
    params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: {} },
  });
  assert.equal(supported.result.protocolVersion, "2024-11-05");

  const fallback = await handleRequest({
    jsonrpc: "2.0",
    id: 71,
    method: "initialize",
    params: { protocolVersion: "unsupported-version", capabilities: {}, clientInfo: {} },
  });
  assert.equal(fallback.result.protocolVersion, "2025-11-25");
});

test("serves tool discovery through the packaged stdio entrypoint", async () => {
  const pluginRoot = fileURLToPath(new URL("../", import.meta.url));
  const pluginData = await mkdtemp(join(tmpdir(), "vibooks-plugin-data-"));
  const entrypoint = fileURLToPath(new URL("./vibooks-mcp.mjs", import.meta.url));
  const child = spawn(process.execPath, [entrypoint], {
    env: {
      ...process.env,
      PLUGIN_ROOT: pluginRoot,
      PLUGIN_DATA: pluginData,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const initializePromise = readOneMessage(child);
  child.stdin.write(
    encodeMessage({
      jsonrpc: "2.0",
      id: 8,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "vibooks-test", version: "1.0.0" },
      },
    }),
  );
  const initialize = await initializePromise;
  const installedPluginVersion = await readInstalledPluginVersion(pluginRoot);
  assert.equal(initialize.result.protocolVersion, "2025-11-25");
  assert.equal(initialize.result.serverInfo.version, installedPluginVersion);

  child.stdin.write(
    encodeMessage({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }),
  );
  const responsePromise = readOneMessage(child);
  child.stdin.write(encodeMessage({ jsonrpc: "2.0", id: 9, method: "tools/list" }));
  const response = await responsePromise;
  assert.equal(response.id, 9);
  assert.equal(response.result.tools.some((tool) => tool.name === "vibooks_readiness"), true);

  const exited = once(child, "exit");
  child.kill();
  await exited;
});

test("runs readiness through configured vibooks-cli", async () => {
  const fakeCli = await createFakeCli();
  const original = process.env.VIBOOKS_CLI;
  process.env.VIBOOKS_CLI = fakeCli;
  try {
    const response = await callTool("vibooks_readiness", {});
    assert.equal(response.result.isError, undefined);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.ok, true);
    assert.equal(payload.stdout.api_reachable, true);
    assert.deepEqual(payload.args, ["doctor", "--json"]);
  } finally {
    restoreEnv("VIBOOKS_CLI", original);
  }
});

test("blocks mutation invoke until explicitly confirmed", async () => {
  const fakeCli = await createFakeCli();
  const original = process.env.VIBOOKS_CLI;
  process.env.VIBOOKS_CLI = fakeCli;
  try {
    const response = await callTool("vibooks_invoke", {
      selector: "post-entry",
      path: { book_id: "book-1" },
      body: { memo: "test" },
    });
    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /not read-only/);
  } finally {
    restoreEnv("VIBOOKS_CLI", original);
  }
});

test("allows read-only invoke without mutation confirmation", async () => {
  const fakeCli = await createFakeCli();
  const original = process.env.VIBOOKS_CLI;
  process.env.VIBOOKS_CLI = fakeCli;
  try {
    const response = await callTool("vibooks_invoke", {
      selector: "list-books",
      query: { limit: 10 },
    });
    assert.equal(response.result.isError, undefined);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.ok, true);
    assert.equal(payload.stdout.includes("invoke list-books --query limit=10 --include-status"), true);
  } finally {
    restoreEnv("VIBOOKS_CLI", original);
  }
});

test("allows confirmed mutation invoke", async () => {
  const fakeCli = await createFakeCli();
  const original = process.env.VIBOOKS_CLI;
  process.env.VIBOOKS_CLI = fakeCli;
  try {
    const response = await callTool("vibooks_invoke", {
      selector: "post-entry",
      path: { book_id: "book-1" },
      body: { memo: "approved" },
      confirmMutation: true,
    });
    assert.equal(response.result.isError, undefined);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.ok, true);
    assert.match(payload.stdout, /--body/);
    assert.match(payload.stdout, /approved/);
  } finally {
    restoreEnv("VIBOOKS_CLI", original);
  }
});

test("reports update status from downloads and skill manifests without updating", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.accept, "application/json");
    const payload =
      url === "https://vibooks.ai/downloads.json"
        ? {
            version: {
              desktop: "1.2.6",
              headless: "1.2.6",
              cli: "1.1.1",
            },
          }
        : {
            version: "1.1.1",
            latest_version: "1.1.1",
            minimum_recommended_version: "1.1.1",
            critical_update: true,
            update_all_command: "npx skills update",
            update_scope: "all_installed_skills",
            blocking_update_before: ["bookkeeping_mutation_when_critical_update_is_true"],
          };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const response = await callTool("vibooks_update_status", {
      checkLocal: false,
      cliVersion: "1.0.0",
      desktopVersion: "1.2.5",
      skillVersion: "1.0.0",
    });
    assert.equal(response.result.isError, undefined);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.summary.update_available, true);
    assert.equal(payload.summary.critical_skill_update, true);
    assert.equal(componentStatus(payload, "vibooks-cli"), "outdated");
    assert.equal(componentStatus(payload, "vibooks-desktop"), "outdated");
    assert.equal(componentStatus(payload, "vibooks-skill"), "outdated");
    assert.equal(payload.update_policies.vibooks_skill.silent_self_update_allowed, false);
    assert.equal(payload.update_policies.vibooks_skill.update_scope, "all_installed_skills");
    assert.match(payload.update_policies.vibooks_plugin.not_updated_by, /npx skills update/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects non-official update manifest URLs before fetching", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("Unexpected network request");
  };
  try {
    const response = await callTool("vibooks_update_status", {
      downloadsUrl: "http://127.0.0.1:26170/private.json",
      skillManifestUrl: "https://example.com/skill.json",
      checkLocal: false,
    });
    assert.equal(response.result.isError, undefined);
    const payload = JSON.parse(response.result.content[0].text);
    assert.equal(payload.catalogs.downloads.ok, false);
    assert.equal(payload.catalogs.skill_manifest.ok, false);
    assert.match(payload.catalogs.downloads.error, /approved https:\/\/vibooks\.ai/);
    assert.match(payload.catalogs.skill_manifest.error, /approved https:\/\/vibooks\.ai/);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

async function callTool(name, args) {
  return handleRequest({
    jsonrpc: "2.0",
    id: `${name}-${Math.random()}`,
    method: "tools/call",
    params: {
      name,
      arguments: args,
    },
  });
}

async function createFakeCli() {
  const dir = await mkdtemp(join(tmpdir(), "vibooks-mcp-test-"));
  const path = join(dir, "fake-vibooks-cli.mjs");
  await writeFile(
    path,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === "doctor") {
  console.log(JSON.stringify({ api_reachable: true, token_ready: true }));
  process.exit(0);
}
if (args[0] === "describe") {
  const selector = args.find((arg) => !arg.startsWith("--") && arg !== "describe");
  const method = selector === "post-entry" ? "POST" : "GET";
  console.log(JSON.stringify({ alias: selector, method, path: method === "POST" ? "/v1/books/{book_id}/entries" : "/v1/books" }));
  process.exit(0);
}
if (args[0] === "invoke") {
  console.log(args.join(" "));
  process.exit(0);
}
console.error("unexpected args: " + args.join(" "));
process.exit(2);
`,
  );
  await chmod(path, 0o755);
  return path;
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function componentStatus(payload, name) {
  return payload.components.find((component) => component.component === name)?.status;
}

async function readInstalledPluginVersion(pluginRoot) {
  const manifestPaths = [
    "plugin.json",
    join(".codex-plugin", "plugin.json"),
    join(".claude-plugin", "plugin.json"),
  ];
  for (const manifestPath of manifestPaths) {
    try {
      const manifest = JSON.parse(await readFile(join(pluginRoot, manifestPath), "utf8"));
      if (typeof manifest.version === "string" && manifest.version.length > 0) {
        return manifest.version;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("Installed plugin manifest does not contain a version.");
}

function readOneMessage(child) {
  return new Promise((resolve, reject) => {
    let stdout = Buffer.alloc(0);
    let stderr = "";
    const timeout = setTimeout(() => {
      cleanup();
      child.kill();
      reject(new Error(`Timed out waiting for MCP response. ${stderr}`.trim()));
    }, 5_000);

    const onStderr = (chunk) => {
      stderr += chunk.toString("utf8");
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.stderr.off("data", onStderr);
      child.off("error", onError);
      child.off("exit", onExit);
      child.stdout.off("data", onStdout);
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code) => {
      if (stdout.length === 0) {
        cleanup();
        reject(new Error(`MCP server exited before responding with code ${code}. ${stderr}`.trim()));
      }
    };
    const onStdout = (chunk) => {
      stdout = Buffer.concat([stdout, chunk]);
      try {
        const parsed = extractMessages(stdout);
        if (parsed.messages.length === 0) return;
        cleanup();
        resolve(parsed.messages[0]);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    child.stderr.on("data", onStderr);
    child.once("error", onError);
    child.once("exit", onExit);
    child.stdout.on("data", onStdout);
  });
}
