# Vibooks Agent Plugin

Vibooks turns receipts, bills, invoices, and bank or card statements into
reviewable, reconciled small-business books with your own AI agent.

The plugin helps an agent:

- install, start, or reconnect Vibooks and `vibooks-cli`
- record source-aware bookkeeping through first-class Vibooks workflows
- reconcile bank and credit-card statements and prepare for month end
- independently review posted bookkeeping against original evidence
- check product, CLI, skill, and plugin update status

Books stay on the user's device by default. The plugin uses official Vibooks
API and CLI paths, never direct database access, and requires explicit approval
before non-read-only operations.

## Install The Portable Plugin

The repository root implements the
[Agent Plugins 1.0.0 specification](https://agent-plugins.org/specification).
Compatible clients can install this Git repository directly or load the cloned
repository root as a local plugin. The portable package includes Agent Skills
and a local stdio MCP server. The MCP server requires Node.js 18 or later.

The portable package is currently intended for clients listed by the Agent
Plugins project, including VS Code, Cursor, GitHub Copilot, ChatGPT and Codex,
and Kiro. Client-specific installation and distribution remain controlled by
each client.

## Install For Codex

From the repository root:

```bash
codex plugin marketplace add .
codex plugin add vibooks@vibooks
```

Start a new task after installation, then invoke the plugin as `@vibooks` or
ask for one of its bookkeeping workflows in plain language.

## Install For Claude Code

From the repository root:

```bash
claude plugin marketplace add .
claude plugin install vibooks@vibooks
```

Reload plugins after installation. Task-oriented skills include:

- `/vibooks:setup`
- `/vibooks:bookkeep-documents`
- `/vibooks:reconcile-close`
- `/vibooks:review-books`

## Example Requests

- Set up Vibooks on this computer and verify it is ready for bookkeeping.
- Record the receipts, bills, invoices, and statements in this folder in Vibooks.
- Reconcile my bank and card statements and prepare a month-end review.
- Independently review the posted bookkeeping against the original evidence.

## Repository Layout

- `plugin.json`, `mcp.json`, `skills/`, and `runtime/`: portable Agent Plugin.
- `assets/` and `docs/`: shared public listing assets and documentation.
- `codex/vibooks/`: materialized Codex wrapper.
- `claude/vibooks/`: Claude Code wrapper linked to the portable core.
- `.agents/` and `.claude-plugin/`: standalone marketplace entries.
- `submission/`: public marketplace submission materials.
- `scripts/`: synchronization, validation, and release checks.

The repository-root portable package is the editing source of truth. After
editing shared assets, docs, runtime code, or skills, refresh the Codex wrapper:

```bash
scripts/sync-codex-wrapper.sh
```

## Validate

Install maintainer-only validation dependencies once:

```bash
npm ci
```

Then run:

```bash
npm run validate:agent-plugin
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" codex/vibooks
scripts/check-public-plugin-content.sh
node --test runtime/test-vibooks-mcp.mjs
claude plugin validate --strict claude/vibooks
```
