---
name: vibooks
description: >
  Installs or reuses Vibooks desktop, headless packages, or vibooks-cli;
  verifies local API readiness, first-token access, trusted company or book
  connection, and public skill-manifest freshness before high-risk writes;
  bootstraps or rebuilds small-business books with jurisdiction, accounting,
  and tax setup for covered or uncovered countries; records, corrects,
  reconciles, verifies, and closes real bookkeeping through official Vibooks
  workflows rather than direct storage edits; independently reviews
  AI-assisted Vibooks bookkeeping against original source evidence in a clean
  review workspace without reusing prior extraction artifacts.
metadata:
  skill_version: 1.1.3
  source_repo: vibooks-ai/skills
  update_check: https://vibooks.ai/skills/manifest.json
  install_command: npx skills add vibooks-ai/skills --skill vibooks -g
  update_check_command: npx skills check
  update_all_command: npx skills update
  update_scope: all_installed_skills
  web_fallback: https://vibooks.ai/skill.md
  install_sh: https://vibooks.ai/install.sh
  install_ps1: https://vibooks.ai/install.ps1
  downloads: https://vibooks.ai/downloads.json
---

# Vibooks

Use this skill when the user needs Vibooks installed or reused locally, needs
an agent connected safely to Vibooks, or wants real bookkeeping work done
inside Vibooks.

## Choose The Skill Distribution

When this skill is loaded from the official Vibooks plugin, including through
a namespaced skill such as `vibooks:setup` or `vibooks:bookkeep-documents`, the
plugin already provides the bundled Vibooks workflow. Treat the skill as
installed in plugin mode. Do not install or update a duplicate standalone copy
with `npx skills add`, `npx skills check`, or `npx skills update` merely because
an unnamespaced global `vibooks` skill is absent.

Install and update the plugin through the current agent client's plugin
directory or marketplace. After a plugin install or update, start a new task or
restart the client when required so it loads the new bundled content. The
plugin package version and `metadata.skill_version` are separate: the former
identifies the published plugin release, while the latter identifies the
bundled core workflow.

Use the standalone installation and update commands below only when the
official plugin is not loaded and the client supports the `skills` CLI
ecosystem, or when the user explicitly requests a standalone installation.

## Install This Skill

This section applies to standalone or direct-read web use, not plugin mode. For
agents that support the `skills` CLI ecosystem and have not loaded the official
Vibooks plugin, install Vibooks from the public skill source repo:

```bash
npx skills add vibooks-ai/skills --skill vibooks -g
```

Use that repo source for installation. `-g` is the recommended default so the
installed skill stays available across projects; omit it only when the user
explicitly wants a project-local install.

Best results come from installed-skill mode:

1. run `npx skills add vibooks-ai/skills --skill vibooks -g`
2. if the agent client picks up new skills live, switch to the installed
   `vibooks` skill for the current session
3. if the agent client only picks up new skills at startup, let the next
   restart pick up the installed `vibooks` skill and keep using the documented
   web copy for the current session

Treat the direct-read web copy at `https://vibooks.ai/skill.md` as a first-use
bootstrap, not as the preferred steady-state mode.

If the agent is reading `https://vibooks.ai/skill.md` and the local `vibooks`
skill is not installed yet, is missing `metadata.skill_version`, or is older
than the public manifest:

1. run `npx skills add vibooks-ai/skills --skill vibooks -g`
2. if the client picks up new skills live, switch into installed-skill mode for
   the current session
3. if the client needs a restart before new skills appear, keep using the web
   copy for the current session and use the installed `vibooks` skill after the
   next restart

Use the direct-read web copy only when local skill installation is truly
blocked or unavailable in the current client.

## Update This Skill

Treat `metadata.skill_version` as the installed skill version. The latest public
version is published at `metadata.update_check`.

In plugin mode, use `vibooks_update_status` when available and the current
client's plugin manager to check or install a plugin update. Report an available
update, but do not silently install it and do not use the standalone
`metadata.install_command` or `metadata.update_all_command`. If the bundled core
workflow is behind a critical public update and the next action is a high-risk
write, stop for confirmation and use `metadata.web_fallback` for current
instructions until the plugin has been refreshed.

The standalone refresh flow below applies only outside plugin mode.

Check for skill updates at these times:

- first entry through the web copy
- before installing Vibooks or `vibooks-cli`
- before configuring a company, book, accounting policy, tax setup, or
  jurisdiction profile
- before creating, correcting, rebuilding, migrating, reconciling, or closing
  real bookkeeping data

Recommended refresh flow:

1. run `npx skills check`
2. if the installed `vibooks` skill is missing, install it with
   `metadata.install_command`
3. if updates are available, tell the user that `metadata.update_all_command`
   refreshes all installed skills, not only `vibooks`
4. if the user agrees to that all-skills refresh, run
   `metadata.update_all_command`
5. if an all-skills refresh is not appropriate, or if install or update fails,
   continue the current session with `metadata.web_fallback`

Do not silently self-update. If the manifest marks the update as critical and
the next action would mutate bookkeeping, tax, jurisdiction, migration, or
close state, stop and ask before continuing. If the manifest, install, or
refresh path cannot be completed, do not block ordinary questions; before
high-risk writes, disclose that the session is using the official web fallback
and that the latest local skill refresh could not be confirmed.

## When To Use

- install or reuse the official Vibooks desktop or headless package
- install or reuse `vibooks-cli`
- connect to a trusted local Vibooks API and verify authenticated readiness
- create, correct, or review bookkeeping records through official Vibooks
  workflows
- independently review AI-assisted Vibooks bookkeeping against original
  receipts, invoices, statements, and attachments without mutating the ledger
- bootstrap new books with the official Vibooks presets that best match the
  business
- reconcile bank, debit-card, or credit-card statement accounts
- run month-end checks, verify balances, and close readiness

Do not use this skill for generic accounting advice, spreadsheet-only work, or
direct mutation of Vibooks storage.

## Core Operating Rules

- use the official Vibooks app package for install, launch, restart, update,
  and uninstall
- when first entering through the web copy, install the local `vibooks` skill
  so later sessions can reuse it whenever the client supports local skill
  installation; prefer `metadata.install_command` as the default install path,
  but do not block the current session on a restart requirement
- check the public skill manifest before high-risk install, setup, bookkeeping,
  tax, jurisdiction, migration, reconciliation, or close work, run
  `metadata.update_check_command` when local refresh is practical, and prompt
  for an all-skills update when the installed skill is missing a version,
  outdated, or below a critical minimum
- tell the user explicitly that `metadata.update_all_command` updates all
  installed skills, not only `vibooks`
- if install, check, or update fails, use `metadata.web_fallback` and the
  matching public companion docs for the rest of the current session
- use `vibooks-cli` and official Vibooks HTTP API endpoints for bookkeeping,
  verification, token enrollment, and self-description
- do not open, query, or mutate the Vibooks database directly
- do not edit files under the runtime or data directories to bypass period
  controls, posting rules, reconciliation logic, or entitlements
- use installation state files only for connection bootstrap or token lookup;
  they are not a substitute for business data access
- start with `vibooks-cli doctor --json`
- if local loopback reachability is being checked from an agent sandbox or
  restricted execution environment, treat in-sandbox localhost failures as
  untrusted until the same check is rerun with the installed `vibooks-cli` in
  the user's normal shell or an approved unsandboxed command
- inspect discovery before mutating unfamiliar resources
- prefer first-class workflows over manual journals whenever Vibooks has a
  native workflow for the task
- treat country or region defaults as a jurisdiction profile that is separate
  from any industry preset
- use official book presets and saved master-data defaults instead of
  inventing one-off chart, dimension, or posting structures when Vibooks
  already exposes a reusable setup
- treat statements and source files as evidence and import them when the
  workflow supports attachments
- treat bank and card statements as evidence of observable account movement and
  reconciliation; treat payment or receipt as supported only when the statement
  contains the facts required for the payment method and jurisdiction, and do
  not treat statement support by itself as proof of business purpose, accounting
  classification, recognition period, deductibility, or commodity-tax
  entitlement
- when normal bookkeeping uses OCR, parsers, scripts, or model extraction to
  read a receipt, invoice, statement, or payout report, treat extracted values
  as candidates only; before presenting a proposal or posting, visually confirm
  material fields from the original evidence, compare them to the Vibooks
  payload, and leave unreadable or conflicting fields unresolved for user
  confirmation
- for independent evidence review, use a fresh working directory, a clean
  evidence bundle, and read-only Vibooks API or CLI access; do not reuse local
  OCR caches, parser outputs, classification artifacts, importer intermediates,
  or bookkeeping-agent reasoning as evidence
- for independent evidence review, default to complete item-by-item review of
  the declared scope; use sampling or aggregate-only scanning only when the
  user explicitly asks for it, label it as incomplete, and never present it as
  a full-scope review conclusion
- for independent evidence review, report item-by-item results in the user's
  language; JSON may support automation, but it is not a substitute for a
  readable review report that explains each required check and conclusion
- for independent evidence review, judge records against professional
  bookkeeping criteria, the book's accounting basis, jurisdiction profile, tax
  setup, period controls, chart of accounts, and first-class workflow rules;
  do not present the result as an audit, assurance opinion, tax filing opinion,
  or blanket accounting-standards certification
- for restaurant and small-lodging books, keep Vibooks on summary-based
  post-facto bookkeeping through settlements, receipts or payments, expenses,
  dimensions, and reports; do not present Vibooks as POS, PMS, or front-office
  operating software
- stop and ask when the accounting period, counterparty, evidence, or intended
  treatment is unclear

## Quickstart

1. Ensure the official Vibooks product is installed or install it from the
   official Vibooks endpoints. On macOS, prefer
   `brew install --cask vibooks-ai/tap/vibooks`.
2. Ensure `vibooks-cli` is installed. On macOS, prefer
   `brew install vibooks-ai/tap/vibooks-cli`.
3. Start or reuse the installed Vibooks app or headless service.
4. If this is a first-run local desktop install, explicitly confirm local
   desktop startup before waiting for the API.
5. Run `vibooks-cli doctor --json`. If the agent is in a restricted sandbox and
   localhost probes fail, rerun the installed CLI outside the sandbox before
   treating the result as a Vibooks bug.
6. If authenticated readiness, entitlement, or trial state is missing, follow
   the install/access reference before doing bookkeeping work.
7. Discover the API or bootstrap the book as needed, then use first-class
   workflows, attach evidence, reconcile statement accounts, and verify before
   calling the task complete.

## First Use And Reuse

- first-time use: install Vibooks and `vibooks-cli`, confirm local desktop or
  headless startup, install the local `vibooks` skill when entering from the
  web copy, run `vibooks-cli doctor --json`, complete token and entitlement
  setup, then bootstrap the company or book before routine posting
- later reuse: start by rerunning `vibooks-cli doctor --json`, confirm the
  discovered local install still belongs to the current Vibooks bundle, review
  entitlement state only when it matters, then continue with the existing book
  using first-class workflows and verification checks
- if the machine state, token source, entitlement state, or active book is
  ambiguous, stop and follow the install/access reference before mutating data

## Workflow Map

Open only the references needed for the current task:

- install, startup, authentication, licensing, and secret handling:
  [references/install-access.md](references/install-access.md)
- jurisdiction routing, support status, selection order, and research boundary:
  [jurisdictions/index.md](jurisdictions/index.md)
- when country or region defaults matter, open the matching jurisdiction profile
  directly before bootstrapping or changing tax setup:
  - `generic_global`:
    [jurisdictions/generic-global.md](jurisdictions/generic-global.md)
  - `ca_smb`:
    [jurisdictions/ca/smb.md](jurisdictions/ca/smb.md)
  - `us_smb`:
    [jurisdictions/us/smb.md](jurisdictions/us/smb.md)
  - `jp_smb`:
    [jurisdictions/jp/smb.md](jurisdictions/jp/smb.md)
- API discovery, jurisdiction selection, bootstrap, and book rebuilds:
  [references/workflows/bootstrap.md](references/workflows/bootstrap.md)
- posting rules, chart-of-accounts choices, dates, and first-class workflows:
  [references/workflows/posting.md](references/workflows/posting.md)
- tax corrections, evidence attachments, reconciliation, month-end validation,
  and completion checks:
  [references/workflows/verification.md](references/workflows/verification.md)
- independent review of AI-assisted or posted bookkeeping against original
  evidence:
  [references/workflows/evidence-review.md](references/workflows/evidence-review.md)
- uninstall paths and escalation checkpoints:
  [references/escalation.md](references/escalation.md)

In installed-skill mode, these are local companion files from the same skill
package. In direct-read web mode, use the matching public `https://vibooks.ai/`
copies.

## High-Risk Defaults

- do not invent tokens, bootstrap secrets, counterparties, dates, tax
  treatment, statement details, or opening balances
- do not keep using the direct-read web copy as the normal long-term mode when
  the client can install and reuse the official plugin or local `vibooks` skill
- do not install a duplicate standalone `vibooks` skill when the official
  Vibooks plugin already provides the bundled workflow
- do not imply that `npx skills update` refreshes only `vibooks`; it updates
  all installed skills
- do not treat a healthy localhost process as reusable until it is confirmed to
  belong to the current installed Vibooks bundle
- do not create AR or AP activity with generic journals when invoice, bill,
  receipt, payment, apply, or payroll workflows exist
- do not use opening balances to import current-period activity
- do not treat bank or card statement lines as the primary ledger workflow or
  as blanket proof of the underlying business and tax treatment; they are
  evidence of account movement that must reconcile to properly supported posted
  entries
- do not hard-delete posted business documents; use the native correction
  workflow

## Completion Snapshot

The task is not complete until:

- Vibooks is installed from official packages
- authenticated API access is ready and secrets are stored safely
- source documents are imported and linked when the workflow supports it
- accounts, dates, and subledgers follow bookkeeping logic
- bank balances and card liabilities tie to statements
- reports and subledgers are internally consistent
