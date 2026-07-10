import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

test("encodes and extracts JSON-RPC frames", () => {
  const frame = encodeMessage({ jsonrpc: "2.0", id: 7, result: { ok: true } });
  const parsed = extractMessages(frame);
  assert.deepEqual(parsed.messages, [{ jsonrpc: "2.0", id: 7, result: { ok: true } }]);
  assert.equal(parsed.rest.length, 0);
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
  const dir = await mkdtemp(join(tmpdir(), "vibooks-mcp-update-test-"));
  const downloadsPath = join(dir, "downloads.json");
  const skillManifestPath = join(dir, "skill-manifest.json");
  await writeFile(
    downloadsPath,
    JSON.stringify({
      version: {
        desktop: "1.2.6",
        headless: "1.2.6",
        cli: "1.1.1",
      },
    }),
  );
  await writeFile(
    skillManifestPath,
    JSON.stringify({
      version: "1.1.1",
      latest_version: "1.1.1",
      minimum_recommended_version: "1.1.1",
      critical_update: true,
      update_all_command: "npx skills update",
      update_scope: "all_installed_skills",
      blocking_update_before: ["bookkeeping_mutation_when_critical_update_is_true"],
    }),
  );

  const originalAllowFile = process.env.VIBOOKS_MCP_ALLOW_FILE_UPDATE_MANIFESTS;
  process.env.VIBOOKS_MCP_ALLOW_FILE_UPDATE_MANIFESTS = "1";
  try {
    const response = await callTool("vibooks_update_status", {
      downloadsUrl: downloadsPath,
      skillManifestUrl: skillManifestPath,
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
    restoreEnv("VIBOOKS_MCP_ALLOW_FILE_UPDATE_MANIFESTS", originalAllowFile);
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
