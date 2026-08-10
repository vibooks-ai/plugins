# Using The Vibooks Agent Plugin

Vibooks is local-first bookkeeping software for small businesses and
bookkeeping firms. This plugin gives an AI agent the workflows and local tools
needed to turn source documents into controlled, reviewable bookkeeping.

## Start With A Task

Ask for the bookkeeping outcome directly:

- Set up Vibooks and verify it is ready.
- Record the documents in this folder in Vibooks.
- Reconcile these bank and card statements.
- Prepare this book for month end.
- Independently review the posted bookkeeping against the original evidence.

The plugin exposes task-oriented skills for setup, source-document
bookkeeping, reconciliation and close, and independent review. The bundled
`vibooks` skill supplies the detailed professional bookkeeping rules.

## Local Tool Behavior

The plugin includes local MCP tools backed by `vibooks-cli`. They use the
official Vibooks API and CLI path and do not inspect or modify Vibooks storage
directly.

- `vibooks_readiness`: verify local product, API, token, and install readiness.
- `vibooks_desktop_status`: inspect local desktop connection state.
- `vibooks_license_status`: inspect current trial or license state.
- `vibooks_update_status`: report product, CLI, skill, and plugin updates.
- `vibooks_ops`: find live Vibooks operations.
- `vibooks_describe`: inspect one operation.
- `vibooks_schemas` and `vibooks_schema`: inspect request and response schemas.
- `vibooks_verify`: run reconciliation and close-readiness checks.
- `vibooks_invoke`: call a discovered operation.

Non-read-only calls through `vibooks_invoke` require `confirmMutation: true`
after the user has authorized the specific intended write. Update checks never
perform updates, and the plugin does not bypass licensing, period controls, or
first-class bookkeeping workflows.

## Completion Standard

A bookkeeping task is not complete until source evidence is accounted for,
first-class workflows were used, bank and card balances tie to statements,
relevant reports and subledgers agree, and unresolved exceptions are reported.

Vibooks supports bookkeeping workflows and review workpapers. It does not file
tax returns, provide tax or legal advice, or issue audit or assurance opinions.
