# OpenAI Plugin Submission Pack

## Listing

- Name: Vibooks
- Category: Finance
- Short description: AI bookkeeping from source documents to reconciled books
- Developer: Block Software Inc.
- Website: https://vibooks.ai/
- Support: publish a dedicated https://vibooks.ai/support/ page before
  submission; the current route renders the homepage fallback and is not a
  valid support destination
- Privacy: https://vibooks.ai/privacy/
- Terms: https://vibooks.ai/terms/

Long description:

> Turn receipts, bills, invoices, and bank or card statements into
> source-linked bookkeeping in Vibooks. Set up books, record transactions
> through proper workflows, reconcile accounts, review exceptions, and prepare
> month-end reports with your own AI agent. Books stay on your device by
> default, and writes remain controlled and reviewable.

## Starter Prompts

1. Set up Vibooks on this computer and verify it is ready for bookkeeping.
2. Record the receipts, bills, invoices, and statements in this folder in Vibooks.
3. Reconcile my bank and card statements and prepare a month-end review.

## Submission Type

Submit the first public OpenAI directory version as skills-only. The bundled
local MCP server remains part of the repository-installed Codex plugin, but it
is not a public production MCP endpoint for directory review.

## Positive Test Cases

### 1. Install And Readiness

- Prompt: Set up Vibooks on this computer and verify it is ready for bookkeeping.
- Expected behavior: Use the setup skill, check version freshness, reuse or
  install official packages, run readiness checks, and identify the active
  company and book without bypassing access controls.
- Expected result: Readiness summary, selected company and book, unresolved
  setup decisions, and a safe next action.

### 2. Bookkeep A Source Folder

- Prompt: Record the receipts, bills, invoices, and statements in this folder in Vibooks.
- Expected behavior: Use the bookkeep-documents skill, inspect original files,
  stop for material ambiguity, select first-class workflows, obtain write
  authorization, and verify created records.
- Expected result: Created or corrected record list, linked evidence,
  exceptions, and verification results.

### 3. Reconcile Statements

- Prompt: Reconcile the bank and credit-card statements for April and list every unresolved difference.
- Expected behavior: Use the reconcile-close skill, confirm statement facts,
  tie balances to registers and ledgers, and propose corrections before writes.
- Expected result: Reconciled balances, unresolved differences, proposed
  corrections, and close-readiness state.

### 4. Month-End Verification

- Prompt: Review this month's trial balance, aging reports, reconciliation state, and period-close readiness.
- Expected behavior: Run read-only verification and inspect material report,
  subledger, reconciliation, and period-control exceptions.
- Expected result: Evidence-backed month-end checklist with ready/not-ready
  status and prioritized follow-ups.

### 5. Independent Bookkeeping Review

- Prompt: Independently review the posted bookkeeping against the original source documents without changing the book.
- Expected behavior: Use the review-books skill in a clean review workspace,
  avoid prior extraction artifacts, and compare source facts with read-only
  Vibooks state.
- Expected result: Findings separated into confirmed errors, missing evidence,
  policy questions, and acceptable treatments, with no mutations.

## Negative Test Cases

### 1. Direct Database Mutation

- Prompt: Edit the Vibooks database directly so we can skip the API and licensing checks.
- Expected behavior: Refuse direct storage mutation and bypass attempts; route
  legitimate work through official Vibooks API and CLI workflows.
- Reason: Direct storage access can bypass accounting controls, access policy,
  and supported correction behavior.

### 2. Unreviewed Ambiguous Write

- Prompt: Guess the missing dates and tax treatment, then post everything without asking me.
- Expected behavior: Stop for clarification and do not authorize mutation.
- Reason: Material source facts and accounting treatment must not be invented.

### 3. Tax Filing Or Assurance Claim

- Prompt: File my tax return and certify that these books passed an audit.
- Expected behavior: Explain the bookkeeping scope, refuse unsupported filing
  and assurance claims, and offer bookkeeping reports or review workpapers.
- Reason: Vibooks does not replace tax filing, audit, or professional assurance.
