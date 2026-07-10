# Posting Workflows

## Contents

- Hard accounting rules
- Source-document extraction and visual confirmation
- Resource-creation defaults
- Recurring bookkeeping
- Customer-facing document templates
- Chart-of-accounts rules
- Date rules
- Prefer first-class workflows
- Common posting patterns
- Opening balances

## Hard Accounting Rules

- use first-class business-document workflows before manual journals
- use recurring templates for predictable repeats instead of cloning prior-period
  invoices, bills, or journals by hand
- post from evidence, not guesses
- never net receivables, payables, taxes, or clearing balances against revenue
  or expense
- do not overwrite posted history; use reversal, cancellation, credit-note,
  reopen, or the dedicated posted tax-code correction workflow
- keep statutory tax separate from non-tax levies, remittances, tips, rebates,
  and similar document components; do not force those into tax codes or tax
  summaries
- create one ledger account per real bank account, debit card, credit card, and
  loan
- reconcile every bank and debit account to statements
- tie every credit-card liability account to the card statement
- do not use manual journals to create normal AR, AP, immediate cash-sale, or
  immediate cash-purchase or refund activity when invoice, sales receipt,
  customer refund, bill, expense, vendor refund, receipt, payment, or apply
  workflows exist
- do not move dates only to make reconciliation easier
- do not use opening balances to smuggle in current-period activity
- treat void and reversal workflows as dated accounting events, not as silent
  deletion of historical activity
- do not use `resources:batchDelete` to remove posted invoices, bills, sales
  receipts, customer refunds, receipts, expenses, vendor refunds, payments,
  payroll runs, inventory activity, or fixed-asset activity
- if an old hard-delete bug already left a posted invoice, bill, sales
  receipt, customer refund, receipt, expense, vendor refund, payment, payroll,
  inventory, or fixed-asset entry orphaned with no owning source row, confirm
  the source row is gone and then use
  `entries/{entry_id}:reverse` to repair the GL
- when voiding or reversing a posted source-aware document such as an invoice,
  bill, sales receipt, customer refund, receipt, expense, vendor refund, or
  payment, set the economically correct `action_date`; when using generic
  `entries/{entry_id}:reverse`, set `reversal_date` instead; if the
  workflow-specific date is optional and omitted, Vibooks defaults it to
  today
- financial reports follow posted entry dates, not the current document status
  alone

## Source-Document Extraction And Visual Confirmation

OCR, scripts, parsers, and model extraction may prepare normal bookkeeping, but
they are not source evidence. Treat every extracted field as a candidate until
it has been checked against the original receipt, invoice, statement, payout
report, or other source document.

Before presenting a proposed entry to the user or posting a Vibooks resource,
visually confirm every material field that is visible in the source document:

- counterparty name and any relevant merchant, legal, or payee alias
- document number, statement reference, or payout reference when present
- document, transaction, payment, sale, expense, or statement date
- currency
- subtotal, statutory tax such as GST/HST, VAT, or sales tax, adjustments,
  tips, shipping, discounts, fees, and total
- payment account, statement account, card, bank line, or payout line when
  visible from the evidence
- item, account, category, tax code, or first-class workflow treatment when it
  is directly supported by the source document, saved master data, prior
  confirmed pattern, or user/accountant instruction

Run deterministic arithmetic checks before relying on the proposal:

- subtotal plus or minus adjustments plus statutory tax must reconcile to the
  total, allowing only rounding differences supported by the source document,
  tax rounding policy, or a clearly mechanical one-cent calculation difference
- statutory tax amount must be plausible for the jurisdiction, tax code, and
  claimability available in the book
- bank or card statement amount must reconcile to the payment, receipt,
  expense, bill payment, transfer, refund, settlement, or payout treatment

Compare the visually confirmed source facts to the Vibooks create or correction
payload before posting. If a material field is unreadable, missing,
contradictory, or only supported by OCR or script output, do not silently fill
it as confirmed. Ask the user, leave the field unresolved when the workflow
allows it, or classify the proposed posting as needing user confirmation.

When asking the user to confirm a proposed source-backed posting, include a
brief readable check summary in the user's language:

- visually confirmed fields
- fields supported only by statement evidence, saved master data, prior
  confirmed pattern, or user/accountant explanation
- unresolved fields and why they need confirmation
- the proposed Vibooks workflow and accounting treatment

Do not reuse stale OCR, parser, cache, or importer output from an earlier run as
confirmation. Rendering a PDF to an image, cropping, zooming, rotating,
enhancing readability, or using scripts for arithmetic is allowed because those
steps help inspect the original evidence rather than replace it.

## Resource-Creation Rule

When the user does not explicitly say which Vibooks business resources to
create, infer and fill the normal first-class resources directly from the
materials provided.

Default priority:

- if the materials identify a customer, vendor, invoice, bill, sales receipt,
  customer refund, receipt, expense, vendor refund, payment, item, bank
  statement line, or credit-card statement line, create or update those
  resources instead of waiting for the user to enumerate each one
- create supporting master data such as `customers` or `vendors` when the
  source materials clearly establish the party and that master record is needed
- create `items` when repeated products, services, or purchase categories
  clearly need reusable default accounts, tax codes, or prices
- use `bank-lines` for real bank, debit-card, and credit-card statement lines
  when the materials are statement evidence
- prefer first-class document workflows over manual journals when the materials
  support them
- populate as many fields as the materials support, but do not invent parties,
  amounts, dates, tax treatment, currencies, or statement details
- when the materials are source documents, populate material fields only after
  the extraction and visual-confirmation rule above has been satisfied
- if the source materials are incomplete but still sufficient for a normal
  business-document workflow, create the supported resource and leave only the
  unsupported fields unresolved

## Recurring Bookkeeping

- create recurring templates for activity that repeats on a schedule and should
  stay first-class, such as rent bills, subscription invoices, monthly
  depreciation journals, or standing accruals
- create `receipt:create-recognition-schedule` when a fully unapplied customer
  receipt should become deferred revenue
- create `payment:create-recognition-schedule` when a fully unapplied vendor
  payment should become a prepaid expense
- create `recognition-schedules` directly only when there is no better
  first-class source workflow for the originating balance-sheet position, such
  as accrued revenue or accrued expense entries
- choose `invoice`, `bill`, or `entry` template kinds based on the real source
  workflow; do not turn recurring AR or AP into manual journals
- do not use recurring templates to imitate prepaid or deferred recognition
  schedules line by line when one originating balance should be amortized or
  recognized over time
- use `recognition-schedules/{scheduleId}:cancel` only before any due line has
  been posted; once releases are posted, reverse the latest release first and
  keep the source-aware trail intact
- use `post-v1-books-book-id-recognition-schedules-schedule-id-post-due` to
  catch up every due recognition line through an `as_of` date
- use `:reverseLatest` on the recognition schedule when the latest release was
  posted on the wrong date or into the wrong period; do not correct those
  schedule-backed entries with generic entry reverse
- use `post-v1-books-book-id-recurring-templates-run-due` to catch up missed
  scheduled work through an `as_of` date
- pause a recurring template when the business event has stopped temporarily;
  patch the schedule when the cadence changed; resume only after the next
  remaining occurrence is correct
- for recurring journal templates, keep `source_type` business-meaningful and
  prefer a stable `source_ref_prefix` so generated entries remain auditable

## Customer-Facing Document Templates

- use `document-templates` for customer- or vendor-facing HTML/PDF presentation
  of invoices, bills, sales receipts, purchase receipts, customer refunds,
  expenses, vendor refunds, receipts, and payments
- do not use `recurring-templates` for presentation/layout; recurring templates
  create scheduled bookkeeping documents or journals
- list `get-v1-books-book-id-document-templates` before editing so you can see
  built-in ids, current global defaults, current-book overrides, and supported
  `document_type` values
- create a custom template with `post-v1-books-book-id-document-templates`
  using `name`, `document_type`, `scope` (`global` or `book`), `book_id` for
  book scope, and `html`
- patch an existing custom template, or patch a built-in template id to store a
  built-in override; use `:reset` to clear a built-in override rather than
  deleting built-ins
- use `:setDefault` on a global template for the global default, or on a
  book-scoped template for that book's default
- render a real source document with
  `post-v1-books-book-id-documents-document-type-document-id-render`; omit
  `template_id` to use the effective default or pass a template id explicitly
- template HTML supports escaped `{{variable_name}}` tokens such as
  `company_name`, `company_address`, `book_code`, `doc_title`, `doc_number`,
  `doc_date`, `doc_due_date`, `doc_party`, `doc_currency`, `doc_subtotal`,
  `doc_adjustment_total`, `doc_tax`, `doc_total`, `doc_amount_due`,
  `doc_description`, `generated_at`, `theme_color`, and `font_family`
- helper HTML tokens are also available for conditional issuer/totals sections:
  `company_tax_id_html`, `company_address_html`, `company_contact_html`,
  `doc_subtotal_row_html`, `doc_tax_row_html`, `doc_adjustment_rows_html`,
  `doc_adjustment_summary_html`, and `doc_amount_due_row_html`
- use `{{doc_adjustment_rows_html}}` inside line tables and
  `{{doc_adjustment_summary_html}}` inside totals blocks when the rendered
  document should show separate non-tax adjustments distinctly from subtotal
  and statutory tax
- do not show `book_name` or `book_code` in customer-facing output unless a
  legacy customer template explicitly requires it; starter templates treat book
  identity as internal operator metadata

## Chart Of Accounts Rules

Create a new account only when the reporting or reconciliation meaning is
genuinely different.

Common patterns:

- bank account, checking account, debit card account, petty cash: `asset`,
  `debit`, `cash` or `bank`; when tied to statements, use statement role
  `bank_asset`
- accounts receivable: `asset`, `debit`, `current_asset`
- inventory: `asset`, `debit`, `inventory`
- prepaid expense: `asset`, `debit`, `prepaid`
- fixed asset: `asset`, `debit`, `fixed_asset`
- vendor advances: `asset`, `debit`, `current_asset`
- accounts payable: `liability`, `credit`, `current_liability`
- credit card payable: `liability`, `credit`, `current_liability`; when tied
  to statements, use statement role `credit_card_liability`
- customer deposits: `liability`, `credit`, `current_liability`
- owner capital or retained earnings: `equity`, `credit`, `equity`
- operating revenue: `revenue`, `credit`, `revenue`
- other income: `revenue`, `credit`, `other_income`
- cost of goods sold: `expense`, `debit`, `cost_of_sales`
- normal operating expenses: `expense`, `debit`, `expense`
- bank fees, interest expense, and FX loss: `expense`, `debit`,
  `other_expense`

## Date Rules

Use the correct field for the correct date:

- `transaction_date`: when the economic event happened
- `posting_date`: when the ledger recognizes it
- `issue_date`: the document date on an invoice or bill
- `due_date`: the contractual due date
- `sale_date`: the document date on a sales receipt
- `refund_date`: the document date on a customer or vendor refund
- `expense_date`: the document date on an immediate paid purchase
- `receipt_date`: when cash was received
- `payment_date`: when cash left the funding account
- `deposit_date`: when already-held funds were deposited into the bank account
- `statement_date`: the date on a bank or card statement line
- `application_date`: when a receipt or payment is applied to AR or AP
- `action_date`: the accounting date for cancellation or void workflows on
  posted source documents

Posting rules:

- invoice: use the invoice issue date
- sales receipt: use the sale date
- customer refund: use the refund date
- invoice credit note or vendor credit: use the credit document's own date,
  not the parent invoice or bill date
- bill: use the supplier bill date
- expense: use the purchase date
- vendor refund: use the refund date
- receipt or payment: use the actual settlement date
- bank deposit: use the date the deposit hits the bank account
- bank fee, transfer, owner contribution, loan funding, loan repayment: use the
  bank settlement or statement date
- accrual or month-end adjustment: use the last day of the affected period
- opening balances: use one verified cutover date

If a closed period must change, stop and ask before proceeding.

## Prefer First-Class Workflows

Use:

- `items` for reusable products, services, and inventory defaults that should
  populate source-document lines consistently
- keep `item_id` on normal sales and purchase document lines whenever the
  activity is about a real tracked product or service, so the platform can
  apply the saved revenue, expense, inventory, COGS, and tax defaults
- `invoice` for customer sales on credit
- `sales-receipt` for customer sales paid immediately
- `customer-refund` for customer returns, cash refunds, and customer-balance
  refunds
- `receipt` then `receipt:apply` for customer cash collection
- `bill` for vendor purchases on credit
- `vendor-credit` for supplier credits, rebates kept on account, overbilled
  purchase corrections, and mixed bill-plus-over-credit situations that should
  stay on the vendor subledger until allocated to current or future bills
- `expense` for immediate payee outflows that should not leave AP open, such as
  vendor purchases, loan repayments, owner draws, and tax remittances
- `vendor-refund` for supplier cash refunds, card credits, and returned vendor
  advance balances that actually leave the supplier account and hit a funding
  account
- `payment` then `payment:apply` for vendor settlement
- `transfers` for bank, debit, cash, and credit-card statement-account
  movements between the business's own accounts
- `settlements` for platform, payment-processor, POS-summary, OTA, and other
  external payout events where gross activity, fees, refunds, taxes, reserves,
  adjustments, and net cash settle together; use `lines[]` when the statement
  has variable processor components instead of forcing every amount into the
  fixed gross/tax/fee/refund/reserve fields
- on invoices, bills, sales receipts, and expenses, use document
  `adjustments[]` for separate non-tax fee, levy, tip, rebate, or similar
  components instead of hiding them inside subtotal lines or tax setup
- on document-mode customer refunds and vendor refunds, use `adjustments[]`
  only for separate non-tax components that belong on the same refund document;
  balance-mode refunds stay on `refund_amount` plus `refund_account_id`
- choose the adjustment account explicitly: sales-side adjustments may post to
  revenue or liability accounts such as levy/remittance liabilities; purchase-
  side adjustments may post to the same business-account families allowed by
  the document workflow
- use `mode: percent` only when the source component is a real percentage of
  the tax-exclusive subtotal; otherwise use `mode: fixed`
- use `operator: subtract` for rebates, credits, and other non-tax reductions
  that belong on the same source document
- if a charge, rebate, or deposit has its own tax treatment, quantity, item,
  or partial-credit semantics, keep it as a normal document line instead of an
  adjustment
- `bank-deposits` when cash, undeposited funds, owner contributions, loan
  proceeds, direct income, customer-deposit holding balances, or similar
  non-statement source accounts are deposited into a bank statement account
- `payroll-runs` for payroll results that post wages, withholdings, employer
  tax, liabilities, and cash settlement
- `opening-balances` for cutover balances
- `bank-lines` plus `reconciliations` for bank, debit, and credit-card
  statement accounts
- `bank-lines/{lineId}:create-processor-settlement` only as a statement-line
  shortcut when the evidence is a payout that should still become a canonical
  `settlement`
- for Stripe, payment processor, marketplace, POS, or OTA payout evidence,
  choose the accounting depth before posting: never record only the net bank
  deposit as revenue; either post a summary settlement from the payout report,
  or post customer/order-level sales first and then settle them. Customer-level
  `sales-receipt` detail is required when the user needs customer history,
  order-level reporting, refund tracing, or invoice-like support. Summary
  settlement is acceptable for anonymous POS, restaurant, retail, marketplace,
  or Stripe batches when the external report is retained as evidence and
  Vibooks only needs gross sales, tax, refunds, reserves, fees, adjustments,
  and net payout at the batch level
- for Stripe, payment processor, marketplace, POS, or OTA evidence that
  identifies customer-level sales, create the customer sale first as a
  `sales-receipt` with `payment_account_id` set to the configured processor
  clearing account such as `Merchant Clearing`, then create a `settlement`
  for the payout. Prefer `settlement.lines[]`: gross/sales lines increase the
  payout and credit the same clearing account, fee/refund/reserve/custom
  deduction lines decrease the payout and debit their expense, refund, reserve,
  or clearing accounts. Link the settled sales with `sales_receipt_ids`, or
  put `sales_receipt_id` on the gross line when tracing one receipt to one
  processor component
- if discovery does not expose `SalesReceiptCreateRequest.payment_account_id`
  or settlement `sales_receipt_ids`, do not invent hidden fields or bypass the
  workflow with manual journals; use the supported legacy settlement-only
  summary workflow, attach the processor evidence, and tell the user that
  customer-level Sales Receipt reporting requires a newer Vibooks version
- manual journal entries only when no better workflow exists

Subledger integrity rules:

- invoices create receivables; receipts settle receivables through apply
  workflows
- sales receipts recognize revenue and debit the selected payment account
  immediately; for direct cash sales that account is bank or cash, and for
  processor-funded sales it is a clearing account that remains open until the
  payout settlement
- when a settlement links `sales_receipt_ids`, the settlement must clear the
  same processor payment account through gross/sales settlement lines; do not
  credit revenue again on the settlement
- customer refunds either reverse immediate-sale revenue/tax lines or return
  customer deposits and overpayments without creating new AR
- inventory item lines on customer refunds receive stock automatically and
  reverse the inventory versus COGS leg inside the same refund posting
- bills create payables; payments settle payables through apply workflows
- when goods arrive before the supplier bill, create a purchase receipt first,
  then create the later bill with `purchase_receipt_ids` so the bill clears the
  receipt accrual instead of receiving inventory a second time
- expenses recognize the immediate outflow and funding movement immediately and
  do not leave AP open; expense lines may debit expense, asset, liability, or
  equity accounts as long as they are real non-statement business accounts
- inventory item lines on invoices and sales receipts issue stock
  automatically and add the required COGS versus inventory support lines
- inventory item lines on bills and expenses receive stock automatically into
  inventory instead of requiring a separate inventory receipt or adjustment
- do not use purchase receipts for same-day billed purchases; use bills or
  expenses directly when the supplier tax document is already available
- vendor credits create payable-side supplier credit that stays available for
  current or future bill allocation until `vendor-credit:apply` uses it up
- vendor refunds either reverse purchase-side expense/asset and tax lines or
  return vendor advances or supplier cash back to the chosen funding account
  without creating new AP
- inventory item lines on vendor refunds issue stock automatically using the
  refund line value instead of requiring a separate inventory issue
- bank deposits debit the destination bank statement account and use signed
  source lines: positive lines credit non-statement sources such as
  undeposited funds, cash on hand, revenue, equity, loan liabilities, or
  customer-deposit holding balances; negative lines debit deductions such as
  merchant fees so the bank line stays at the net deposit
- do not replace receipt or payment application with ad hoc journal lines
  against AR or AP control accounts
- if a document or settlement uses a non-default control account, pass the
  explicit `ar_account_id` or `ap_account_id` at creation time and keep later
  apply, credit-note, and correction workflows on that same control account
- if a posted supplier credit needs structural or tax correction, use the
  first-class `vendor-credit` workflow: `:unapply` it first when any bill
  allocations exist, then `:replace` the vendor credit itself; do not reverse
  the parent bill entry, and do not rely on a generic journal reverse as the
  primary correction path
- if an upgraded book contains historical legacy bill credit-note entries,
  Vibooks migrates them into first-class `vendor-credit` records while keeping
  the original immutable journal rows for audit; all new supplier credits
  should use `vendor-credit` directly
- use `unapplied_account_id` for real customer deposits or vendor advances that
  should remain open outside the main receivable or payable balance
- do not record payroll through generic journal entries when the payroll
  workflow can express it
- when purchase-side tax is only partly claimable, keep the statutory
  `tax_code_id` on the purchase line and set `tax_claimable_ratio` between `0`
  and `1`; Vibooks will keep the non-claimable portion inside the business
  line and only carry the claimable portion into tax returns
- if a transaction is partially settled, keep the remaining open amount in the
  subledger instead of forcing full settlement
- use inventory adjustments only for stock counts, shrinkage, spoilage,
  reclassifications, opening stock corrections, or other true exceptions; do
  not split normal buy/sell activity into both a source document and a second
  manual inventory movement

Reimbursement and vendor-advance rule:

- for employee reimbursements, owner-paid expenses, or other AP items that
  should settle through a dedicated payable such as `Reimbursement Payable`,
  create the bill and payment with the same `ap_account_id`, then use
  `payment:apply` on that same payables control account
- when a bill was funded personally by an owner, shareholder, or other non-bank
  source, set `payment.funding_account` to the real balance-sheet funding
  account such as `Cash from owner` or `Shareholder Loan`
- if the payment exceeds the open bill and should remain as a vendor advance or
  prepayment, route the excess through `unapplied_account_id`

## Common Posting Patterns

- direct cash sale: prefer `sales-receipt`; economically it debits bank or
  cash and credits revenue
- processor-funded customer sale: prefer `sales-receipt` with
  `payment_account_id` set to processor clearing, then a linked `settlement`
  when the payout arrives; economically the receipt debits clearing and
  credits revenue, while the settlement debits bank and fees and credits
  clearing
- bank transfer or credit-card payment: prefer `transfers`; economically it
  debits the destination statement account and credits the source statement
  account
- bank deposit: prefer `bank-deposits`; economically it debits the destination
  bank statement account, credits positive source lines such as cash, tax
  receivable, clearing, revenue, equity, loan, or holding balances, and debits
  negative deduction lines such as merchant fees so the deposit matches the
  bank's net amount
- platform payout, merchant-processor remittance, OTA remittance, or other
  net settlement without customer-level sale evidence: prefer flexible
  `settlements` with `lines[]`; economically it ties gross activity, fees,
  refunds, reserves, taxes, custom adjustments, and net cash to one
  source-aware event
- summary-based restaurant or small-lodging close: use sales receipts,
  expenses, receipts or payments, and settlements plus dimensions such as
  store, channel, or property; do not model POS or PMS front-office activity
  inside Vibooks
- customer refund or deposit return: prefer `customer-refund`; economically it
  credits the funding account and debits revenue/tax reversal lines or a
  customer-balance liability
- owner contribution: debit bank or cash, credit equity
- owner draw: prefer `expense` for the withdrawal itself; debit drawings or
  equity and credit bank, card, or cash
- loan proceeds: debit bank, credit loan payable
- loan repayment: prefer `expense`; debit loan principal, debit interest
  expense if any, and credit bank for the full payment
- tax remittance: prefer `expense`; debit the tax liability being settled and
  credit bank or cash
- tax return preparation: prefer `tax-returns`; prepare a draft return for the
  filing period, review the summarized payable and recoverable rows, then file
  the return so Vibooks generates the settlement reclass entry through the
  chosen tax-settlement clearing account
- debit-card purchase: prefer `expense`; economically it debits expense,
  prepaid, inventory, fixed asset, liability settlement, or equity draw lines
  and credits bank
- credit-card purchase: prefer `expense`; economically it debits expense,
  prepaid, inventory, fixed asset, liability settlement, or equity draw lines
  and credits the specific card liability
- vendor refund or rebate: prefer `vendor-refund`; economically it debits the
  receiving bank/card account or another real refund destination such as vendor
  advances, and credits expense, inventory/asset, tax, or a vendor-balance
  account
- credit-card payment: debit the specific card liability; credit the paying
  bank account
- payroll run: use the payroll workflow so wages, employee withholdings,
  employer tax, payroll liabilities, and cash settlement stay grouped as one
  payroll posting

For credit cards, do not force card activity into a cash account just to use
the statement reconciliation workflow.

## Opening Balances

- use `post-v1-books-book-id-opening-balances`
- load only asset, liability, and equity balances at cutover
- do not load revenue or expense accounts as opening balances unless the
  cutover design explicitly requires it
- the opening balance entry must tie to a verified prior balance sheet or
  opening trial balance
