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

- `plugins/shared/vibooks/`: shared skills, local MCP server, assets, and docs.
- `plugins/codex/vibooks/`: materialized Codex wrapper.
- `plugins/claude/vibooks/`: Claude Code wrapper.
- `plugins/submission/`: public marketplace submission materials.
- `plugins/scripts/`: synchronization and release checks.

The shared directory is the editing source of truth. After editing shared
content, refresh the Codex wrapper:

```bash
plugins/scripts/sync-codex-wrapper.sh
```

## Validate

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py" plugins/codex/vibooks
plugins/scripts/check-public-plugin-content.sh
node --test plugins/shared/vibooks/scripts/test-vibooks-mcp.mjs
claude plugin validate --strict plugins/claude/vibooks
```
