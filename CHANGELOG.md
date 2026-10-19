# Changelog

All notable changes to the Vibooks Agent Plugin are documented here.

## [Unreleased]

- Planned next release: `0.5.1`, based on the public `v0.5.0` tag: the ChatGPT
  plugin listing uses the subtitle "AI bookkeeping from documents" and links
  support at https://vibooks.ai/support/, as the OpenAI directory now requires.
- Refresh the bundled Vibooks skill (1.3.0): everything can be done through
  the API, and a token acts as its person. Weighty steps need the person's
  reason (and destructive ones the confirmation phrase from their preview);
  Light books let the person approve their own requests, and Standard or
  Strict books need another approver. Each Book has its own time zone, and
  "today" follows it. Use `vibooks-cli` 1.3.0 or later.
- Match Vibooks 1.5.0: refunds matched to the advances or deposits they
  return, approved correction of advances or deposits found in tax accounts,
  ordered tax posting runs and returns, and backup restore and other
  person-only operations left to the person.
- Foreign-currency documents and inventory cost: Vibooks places the rounding
  cent (or books it to realized exchange gain/loss), purchase returns leave
  stock at carrying cost, and the inventory valuation review stays with the
  person.
- Foreign-currency advances and deposits are used at their carrying amount,
  with the exchange difference booked by Vibooks, and foreign deposits
  recognise revenue at the deposit's rate.
- Settlements of foreign-currency invoices, bills, vendor credits and billed
  purchase receipts at their carrying amount; AR/AP aging, Overview and
  customer and vendor balances in the Book's currency; count-only tasks and
  cancelled vendor credits shown as closed.

## [0.4.0] - 2026-09-21

- Prepare the `0.4.0` release from the public `0.3.4` baseline; intermediate
  workspace version numbers were development iterations and were not releases.
- Add the complete Canadian payroll workflow to the bundled Vibooks skill,
  including authority-owned statutory release selection, employee setup, pay
  runs, vacation and insurance treatment, pay statements, retained corrections,
  remittances, year-end records, and fail-closed unsupported special-pay cases.
- Expand source-aware bookkeeping guidance for opening facts, journal currency,
  customer invoicing, accountant report access, verification, reconciliation,
  close, and immutable correction identities.
- Document Small Business trial and subscription behavior, company and Book
  capacity, country scope, quota changes, renewal, recovery, and cancellation.
- Add English Codex setup and first-use routing guidance, explain plugin skill
  updates, and honor the update-check cache without installing duplicate skills.

## [0.3.4] - 2026-08-11

- Add a repeatable OpenAI skills-only package build instead of relying on a
  hand-modified marketplace ZIP.
- Omit unsupported MCP and screenshot configuration from OpenAI ZIP uploads
  while preserving the full repository-installed Codex plugin.
- Use the upload-safe product logo for the composer icon and include supported
  OpenAI interface metadata for every bundled skill.

## [0.3.3] - 2026-08-11

- Distinguish plugin mode from standalone skill installation and updates.
- Treat the bundled Vibooks workflow as already installed for plugin users and
  route plugin updates through the host client's plugin manager.
- Clarify marketplace copy that Vibooks is professional bookkeeping software
  used with AI agents, not only a prompt or bookkeeping helper.
- Lead human-facing marketplace cards with the source-document-to-reconciled-
  books outcome while keeping manifest metadata optimized for plugin discovery.

## [0.3.2] - 2026-08-10

- Refresh the bundled Vibooks skill with jurisdiction-sensitive statement-
  evidence guidance for Canada, the United States, and uncovered countries.
- Treat bank and card statements as evidence of observable account movement and
  reconciliation without using them as blanket support for business purpose,
  recognition timing, deductions, or commodity-tax claims.
- Separate payment or receipt support, business-nature support, recognition-date
  support, and jurisdictional tax-documentation support in evidence reviews.
- Distinguish per-line transaction and posting dates from statement closing
  dates, and preserve unresolved genuine movements without guessing their
  classification or tax treatment.

## [0.3.1] - 2026-08-10

- Use newline-delimited JSON-RPC for standards-compliant MCP stdio transport.
- Restrict update manifest requests to approved Vibooks HTTPS endpoints.
- Add standalone repository licensing, security, CI, and release metadata.

## [0.3.0] - 2026-08-06

- Add the portable Agent Plugins 1.0 package.
- Package Codex and Claude Code wrappers from the shared Vibooks workflows.
- Add local MCP tools for readiness, discovery, controlled writes, review, and update status.

[Unreleased]: https://github.com/vibooks-ai/plugins/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/vibooks-ai/plugins/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/vibooks-ai/plugins/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/vibooks-ai/plugins/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/vibooks-ai/plugins/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/vibooks-ai/plugins/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/vibooks-ai/plugins/releases/tag/v0.3.0
