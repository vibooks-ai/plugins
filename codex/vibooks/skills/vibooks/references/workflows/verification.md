# Controls And Verification

## Contents

- Tax rounding rules
- Tax rule design
- Posted tax-code corrections
- Evidence and attachments
- Reconciliation
- Month-end validation
- Completion standard

## Tax Rounding Rules

When a source bill or invoice rounds tax per line and the summed source tax
differs by a cent or two from subtotal times rate, keep the standard statutory
tax code. Do not create one-off tax codes such as `HSTX1501` only to absorb
rounding.

Use these rules:

- before posting Japanese qualified-invoice workflows, verify that the book
  policy uses `tax_rounding_scope: invoice_rate` and the accountant-approved
  `tax_rounding_mode`
- if the source shows separate taxable lines, preserve them as separate
  `lines[]` entries under the normal tax code such as `HST15`
- if line splitting still cannot match the source tax exactly, keep the normal
  tax code and use `tax_amount_override` plus `tax_override_reason` on the
  affected line
- use a short auditable reason such as `supplier_rounding`; for Japanese
  qualified-invoice per-invoice/per-rate rounding, use
  `statutory_invoice_rounding`
- if a posted bill or invoice already used the wrong tax code but the posted
  amount is otherwise correct, use `invoice:replace-tax-code` or
  `bill:replace-tax-code` to relabel the posted tax lines back to the statutory
  tax code while preserving the posted tax amount with `tax_amount_override`
  when needed
- `replace-tax-code` is only for tax classification corrections; if the
  economics, date, party, settlement, or source amount is wrong, use the normal
  reversal, void, reopen, or credit-note workflow instead
- reserve new tax-code master data for genuinely different statutory or
  contractual tax regimes

## Tax Rule Design

Use tax-code master data to describe the real statutory regime, not one-off
operator workarounds.

Rules:

- when a documented jurisdiction profile defines the expected statutory tax
  code names, rates, or control-account roles, follow that profile instead of
  inventing local aliases
- use `sales_rule` and `purchase_rule` when the tax treatment is compound,
  reverse-charge, withholding, or otherwise asymmetric between sales and
  purchases
- use one tax code for the real statutory treatment and keep claimability
  choices on the document line with `tax_claimable_ratio`; do not clone tax
  codes just to express partial recoverability
- use the stored line `tax_detail` as the authoritative explanation of the
  component-level tax posting; do not reconstruct multi-component taxes from a
  single display `rate` alone
- when a document needs grouped liability and asset tax components, keep them
  inside the same tax code rule instead of splitting the business line into
  fake mirror lines

## Posted Tax-Code Corrections

Use the dedicated correction actions only when a posted invoice or bill has the
wrong tax code tag but the posted amount itself should stay unchanged.

- `post-v1-books-book-id-invoices-invoice-id-replace-tax-code`
- `post-v1-books-book-id-bills-bill-id-replace-tax-code`

Rules:

- replace the wrong historical tax code with the correct active statutory tax
  code; do not create a near-duplicate tax code just to make the old tax amount
  appear to fit
- the replacement tax code must support the same document direction and post to
  the same tax control account
- when the replacement rate differs from the historical implied rate, provide
  `tax_override_reason` so Vibooks can preserve the already-posted tax amount
  with `tax_amount_override`
- this workflow updates tax metadata with audit history; it does not reopen
  applied receipts or payments and it does not change the posted gross amount
- if the tax amount itself was substantively wrong and should no longer remain
  on the books, do not use `replace-tax-code`; use the normal corrective
  document flow instead

## Tax Summary Review

Use `get-v1-books-book-id-tax-summary` as the authoritative tax-code summary
before tax settlement, accountant handoff, or jurisdiction-specific review.
Do not reconstruct tax totals from journal rows unless the API is unavailable.

The summary exposes, per tax code:

- `sales_base_total` and `sales_tax_total` for output-tax activity
- `purchase_base_total` and `purchase_tax_total` for claimable input-tax
  activity
- `net_tax` as sales tax less claimable purchase tax
- `source_currency`, `scale`, `posting_scale`, `reporting_scale`, and
  `calculation_scale` from the effective book policy when available
- `invoice_rate_groups` for source-document, per-tax-code review of
  invoice-rate VAT/GST/consumption-tax totals

For VAT/GST/consumption-tax profiles, use these fields to prepare review
workpapers. Keep statutory tax codes on the source documents, and use the
source document and evidence review to explain any override or partial
claimability instead of changing the tax-code master data.

For accountant handoff, use `get-v1-books-book-id-accountant-handoff` with the
true review date range. It returns financial statements, trial balance, general
ledger, journal entries, A/R and A/P aging and open items, bank reconciliation
summary, tax summary, evidence exceptions, attachment manifest, and
jurisdiction notes as review workpapers; it does not file a tax return.
Omit `sections` for the full package. When the accountant asks for a narrower
package, pass repeated `sections` values for only the needed workpapers so the
JSON payload and workbook tabs match the selected report pack.
Leave `basis` unset for the default accrual-basis package. Pass `basis = cash`
or `basis = tax` only when the accountant explicitly requests that basis; it
applies to the included Profit and Loss and Balance Sheet sections, while other
workpapers remain source-based or accrual-oriented review schedules. Tax basis
currently resolves through the cash-basis view plus tax adjustments.

When the accountant needs downloadable workpapers, use
`post-api-admin-export-accountant-package` for the same date range. Prefer
`format = xlsx` for a professional Excel workbook; use `format = zip` when the
recipient also needs each selected report as an independent XLSX workbook, the
JSON workpaper payload, and package manifest. ZIP report filenames include the
company, book, date range, and report language so extracted year-end packages do
not overwrite similarly named reports. Include a `sections` array only when the
accountant explicitly wants a subset; supported ids are
`trial_balance`, `general_ledger`, `journal_entries`,
`income_statement`, `balance_sheet`, `cash_flow`, `equity_rollforward`,
`ar_ap_aging`, `open_receivables`, `open_payables`,
`bank_reconciliation_summary`, `tax_summary`, `invoice_tax_detail`,
`evidence_exception_report`, `attachment_manifest`, and `jurisdiction_notes`.
In the desktop app, use `Reports > Accountant Package` for operator-driven
exports. Choose `Full fiscal year` for year-end handoff, `Fiscal year to date`
for interim accountant review, `Current period` for monthly close review, or
`Custom range` only when the accountant explicitly asks for a nonstandard
period. Leave all workpapers selected for the default accountant package, or
clear the reports the accountant did not request. The normal report export menu
is only a shortcut into this workflow.

## Tax Returns

Use `tax-returns` as the first-class filing workflow. Do not treat tax filing
as an ad hoc manual journal unless Vibooks truly lacks a first-class path for
the jurisdictional requirement.

Rules:

- prepare a draft return for the true filing period and review the summarized
  payable and recoverable rows before filing
- file the return only after the underlying period data is complete enough for
  filing; the filing action generates the tax settlement reclass entry
- use a dedicated clearing or settlement liability account as
  `offset_account_id`; do not point the return at a bank statement account
- keep statutory tax codes on source documents even when a purchase-side input
  tax is only partly claimable; express that by setting
  `tax_claimable_ratio` on the purchase line rather than inventing near-duplicate
  tax codes
- once a return is filed, corrections should normally happen through the
  underlying document correction flow plus a later amended return or later
  period settlement decision, not through silent mutation of the original filed
  result

## Evidence And Attachments

When the owner provides source documents, import them into Vibooks managed
evidence storage before or with the related bookkeeping work.

Use attachments for:

- supplier bills, vendor invoices, receipts, remittances, and payment
  confirmations
- customer counter receipts, POS summaries, cash-sale support, and immediate
  purchase support
- OTA statements, processor payout summaries, settlement reports, property
  owner statements, and channel remittances
- bank and card statements, statement exports, and fee notices
- contracts, loan schedules, adjustment support, and cutover trial balances
- manual journal support when no first-class document workflow exists

Do not fabricate attachments for internally generated records when no external
source file exists.

Attachment import rules:

- use `post-v1-books-book-id-attachments` to import the file into managed
  evidence storage
- for agents, CLI automation, and remote HTTP callers, prefer `name` +
  `content_base64` + `sha256` so the request does not depend on the server
  being able to read the caller's local filesystem
- local desktop or same-host callers may alternatively provide a local
  filesystem path or `file://` URI
- do not provide a remote HTTP URL
- provide the true SHA-256 of the file contents
- keep the original file content unchanged
- when the same source document already exists in Vibooks, reuse the existing
  attachment instead of importing duplicates when practical

Typical import flow:

1. compute the file's SHA-256 locally
2. if the caller is not on the same machine as Vibooks, base64-encode the file
   and include `name`
3. import the file as an attachment
4. capture the returned attachment id
5. pass that id in `attachment_ids` when creating the related invoice, sales
   receipt, customer refund, bill, expense, vendor refund, receipt, payment,
   or manual journal entry

When a supporting file arrives after the document was already posted:

- import the file first with `post-v1-books-book-id-attachments`
- then use the matching source-document `:add-attachments` action when Vibooks
  exposes one:
  - invoices, bills, sales receipts, customer refunds, expenses, vendor
    refunds, receipts, and payments
- use `entries/{entry_id}:add-attachments` only for true journal-entry-level
  evidence such as manual journals
- do not use `:replace`, `:cancel`, or reversal flows merely to add or swap
  support files when the business facts, amounts, dates, tax, and settlement
  state are unchanged
- if the new evidence shows the original economics or tax treatment was wrong,
  stop treating it as an attachment correction and use the proper document
  correction workflow instead

When a wrong or duplicate file was linked to a posted document:

- use the matching source-document `:remove-attachments` action with a short
  auditable `reason`
- do not use a reverse, replace, reopen, or batch-delete workflow merely to
  unlink evidence from a posted document
- if the removed file is still linked somewhere else, Vibooks removes only the
  current document link
- if the removed file was the last remaining document link, Vibooks may delete
  the managed attachment record and file as part of the same evidence cleanup

Example remote-safe attachment payload:

```json
{
  "name": "source-document.pdf",
  "content_base64": "<base64-encoded-file-bytes>",
  "sha256": "64-char-lowercase-hex",
  "mime": "application/pdf"
}
```

Local same-host callers may alternatively send:

```json
{
  "uri": "file:///absolute/path/to/source-document.pdf",
  "sha256": "64-char-lowercase-hex",
  "mime": "application/pdf"
}
```

Evidence-linking rules:

- invoices, sales receipts, customer refunds, bills, expenses, vendor refunds,
  receipts, payments, and manual journal entries should carry `attachment_ids`
  when supporting documents exist
- for bank or card reconciliation, import the statement file even if the
  reconciliation snapshot itself does not take `attachment_ids`
- for opening balances, attach the cutover trial balance, prior balance sheet,
  or equivalent closing package when available
- if one source document supports several transactions, link it only where the
  business relationship is real and clear

## Reconciliation

### Statement Lines

Use `post-v1-books-book-id-bank-lines` to capture imported or manually entered
bank, debit-card, and credit-card statement evidence before matching it to
posted ledger activity.

Rules:

- statement lines are statement evidence, not the primary business-document
  posting workflow
- statement evidence supports the observable account movement, amount, the
  transaction and posting dates actually shown for the individual line,
  displayed payee or memo, and reconciliation; it does not by itself prove the
  underlying business purpose, accounting classification, recognition period,
  deductibility, or commodity-tax entitlement
- create one `bank-line` per real statement line; do not collapse multiple
  lines into one net amount unless the source statement itself shows a single
  netted line
- record the line against the correct statement-backed account, with the real
  signed amount and meaningful payee or memo text from the source statement
- use the financial institution's per-line posting or clearing date as Vibooks'
  `statement_date` when the source shows both transaction and posting dates;
  retain the transaction date in the original evidence and the bank-line
  `reference` or `note`, and never substitute the statement period-end or
  closing date
- if the source shows only one per-line date, use it as `statement_date` and
  identify whether it is a transaction date, posting date, or unknown rather
  than silently relabeling it
- bank and debit accounts normally treat a positive statement line as an asset
  increase; credit-card liability accounts normally treat a positive statement
  line as a liability increase
- when matching, require the same statement account, the same source currency,
  and no duplicate reuse of an entry that is already matched to another
  statement line for the same account
- Vibooks may match within a controlled timing window around `statement_date`;
  matching does not make that field the transaction's recognition date
- one statement line may match multiple posted entries when their net movement
  on the statement account equals the signed statement amount
- when a statement line reveals a missing transaction and the full treatment is
  supported, create the appropriate formal posted receipt, payment, or journal
  entry from the bank-line workflow and let Vibooks auto-match it
- when the account movement is genuine but the offset classification or tax
  treatment is unresolved, do not invent revenue, expense, or tax: with
  explicit owner or accountant approval, use the bank-line create-entry flow to
  record the supported statement-account movement against a dedicated suspense
  or clearing balance, claim no tax, retain the source-date facts and review
  note, and auto-match the line; keep the business-nature, recognition-date, and
  tax-documentation checks unresolved until the suspense balance is
  reclassified through the normal correction or adjusting workflow
- use the temporary suspense path only when the statement-account date and
  movement are themselves supported; if they are not, or approval is absent,
  leave the line `unmatched` so reconciliation and period close remain blocked;
  do not convert a genuine unrecorded movement to `reviewed_exception`
- use reviewed exceptions only for lines that are explained and documented but
  cannot yet be formally matched
- when statement evidence proves only that money moved, keep the business
  nature, recognition date, and tax-documentation checks unresolved instead of
  inventing them from the bank memo

### Bank And Debit Accounts

1. map each real account to its own bank or cash asset account
2. import or create statement lines
3. match statement lines to posted entries, match them to multiple posted
   entries when the net movement ties, create a fully supported missing posted
   transaction, or—with explicit approval—record a genuine but unclassified
   movement against suspense without a tax claim; then auto-match it
4. ignore unmatched lines only with a reason
5. create a reconciliation snapshot
6. treat reconciliation as complete only when unmatched items and unexplained
   difference are zero

Statement-account review rule:

- when reviewing a bank or card account, inspect the statement account itself
  together with posted account activity, transfer journals, imported statement
  lines, and reconciliation snapshots
- do not treat a statement account as a balance-only summary

### Credit Cards

Use the same `bank-lines` plus `reconciliations` workflow for credit-card
statements, but keep the ledger account itself as a liability.

1. keep one liability account per card
2. classify statement-backed cards as `credit_card_liability`
3. post each charge to that liability account
4. post each payment against that liability account
5. import or create card statement lines for the same liability account
6. compare the liability balance to the card statement ending balance
7. investigate timing differences, missing charges, duplicate charges,
   interest, fees, and card-payment settlement timing
8. do not consider the card reconciled until the liability balance ties to the
   statement after documented timing items

Statement-balance direction rules:

- bank and debit accounts: a positive statement line normally means the asset
  increased
- credit cards: a positive statement line normally means the liability
  increased
- credit-card payments usually reduce the liability, so the statement line
  should reflect the liability decrease, not a cash increase

## Month-End Validation

Before closing a period:

1. run trial balance
2. run balance sheet
3. run income statement
4. run general ledger for review
5. review AR and AP aging when those modules are used
6. reconcile every bank and debit account
7. tie every credit card to its statement
8. confirm no unexplained unapplied receipts, unapplied payments, or orphan
   balances remain
9. when dimensions are used for departments, projects, branches, or locations,
   run grouped management reports with `group_by_dimension_id` and targeted
   slices with `dimension_filter`

Preferred verification command:

```bash
vibooks-cli verify \
  --book-id BOOK_ID \
  --as-of 2026-01-31 \
  --date-from 2026-01-01 \
  --date-to 2026-01-31
```

Use `--expect-account-balance ACCOUNT_OR_CODE=AMOUNT` when the user has a
statement ending balance that must tie exactly.

Useful report commands:

```bash
vibooks-cli invoke get-v1-books-book-id-reports-trial-balance --path bookId=BOOK_ID --query as_of=2026-01-31
vibooks-cli invoke get-v1-books-book-id-reports-balance-sheet --path bookId=BOOK_ID --query as_of=2026-01-31
vibooks-cli invoke get-v1-books-book-id-reports-income-statement --path bookId=BOOK_ID --query date_from=2026-01-01 --query date_to=2026-01-31
vibooks-cli invoke get-v1-books-book-id-reports-general-ledger --path bookId=BOOK_ID --query date_from=2026-01-01 --query date_to=2026-01-31
vibooks-cli invoke get-v1-books-book-id-reports-income-statement --path bookId=BOOK_ID --query date_from=2026-01-01 --query date_to=2026-01-31 --query group_by_dimension_id=DIMENSION_ID
vibooks-cli invoke get-v1-books-book-id-reports-trial-balance --path bookId=BOOK_ID --query as_of=2026-01-31 --query dimension_filter=DIMENSION_ID:DIMENSION_VALUE_ID
```

Treat any imbalance or statement mismatch as blocking.

## Completion Standard

The job is complete only when:

- Vibooks is installed from official Vibooks packages
- secrets are stored safely
- the local API is not unnecessarily exposed
- a saved API token exists for routine automation, or the owner explicitly
  chose another approved token
- owner-provided source documents are imported into Vibooks evidence storage and
  linked with `attachment_ids` where the workflow supports it
- every material entry has evidence or an explicit owner-confirmed explanation
  for why no source document exists, and any unmet jurisdictional documentary
  requirement remains an explicit exception rather than being cleared by that
  explanation alone
- accounts and dates follow accounting logic
- bank balances tie to statements
- credit-card liabilities tie to statements
- reports and subledgers are internally consistent
