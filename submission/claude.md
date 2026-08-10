# Claude Plugin Submission Pack

## Listing

- Name: Vibooks
- Marketplace: vibooks
- Category: Finance
- Description: Turn receipts, bills, invoices, and statements into reviewable,
  reconciled books with Vibooks.
- Developer: Block Software Inc.
- Website: https://vibooks.ai/
- Support: https://vibooks.ai/support/
- Repository: https://github.com/vibooks-ai/plugins
- License: Apache-2.0

## Public Skill Surface

- `/vibooks:setup`
- `/vibooks:bookkeep-documents`
- `/vibooks:reconcile-close`
- `/vibooks:review-books`

The plugin also bundles a local MCP server backed by `vibooks-cli`. The task
skills describe user outcomes; MCP and API mechanics remain implementation
details.

## Community Marketplace Checklist

- validate the final plugin with `claude plugin validate --strict`
- run the public package and MCP test suites
- provide the public repository and a commit suitable for marketplace pinning
- confirm marketplace, plugin, and skill descriptions use bookkeeping task
  language rather than implementation terminology
- confirm the repository contains no developer-machine paths, secrets, private
  screenshots, or unpublished workspace dependencies
- keep explicit semantic versions current for every submitted release

If Anthropic later includes Vibooks in `claude-plugins-official`, add the
official one-time plugin recommendation marker to `vibooks-cli`. Do not emit an
official-marketplace hint before that listing exists.
