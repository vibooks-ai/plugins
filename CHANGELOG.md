# Changelog

All notable changes to the Vibooks Agent Plugin are documented here.

## [Unreleased]

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

[Unreleased]: https://github.com/vibooks-ai/plugins/compare/v0.3.4...HEAD
[0.3.4]: https://github.com/vibooks-ai/plugins/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/vibooks-ai/plugins/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/vibooks-ai/plugins/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/vibooks-ai/plugins/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/vibooks-ai/plugins/releases/tag/v0.3.0
