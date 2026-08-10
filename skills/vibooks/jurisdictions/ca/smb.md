# Canada SMB Jurisdiction Profile

Profile id: `ca_smb`

Status: `skill_guided`

Scope: ordinary Canadian private-enterprise and small-business bookkeeping on
the current shipped Vibooks product. This profile is not a full handbook or tax
advice substitute.

## Use This Profile When

- the book or company `country` is Canada
- the source documents, tax registration, or user instructions clearly show the
  business keeps its books under Canadian business rules
- the business is an ordinary small business or private enterprise rather than
  a public issuer, pension plan, or specialized regulated reporting entity

Do not choose this profile merely because the operator is Canadian.

## Authority Order

Use these sources in order:

1. explicit Vibooks book or company setup already saved
2. real tax registrations and the actual operating province or territory
3. source documents and business profile details
4. explicit user instruction
5. current device country only as a last-resort bootstrap suggestion

If Canada is clear but the province or territory matters for tax setup and is
still unknown, stop and ask before creating province-specific tax codes.

## Reporting-Basis Default

Default to `ASPE` for ordinary Canadian private-enterprise books.

Use `IFRS` only when one of these is clearly true:

- the user explicitly requests IFRS
- the entity is publicly accountable or preparing IFRS financial statements
- a lender, investor, owner, or regulator explicitly requires IFRS

Stop and ask before proceeding if the book appears to be for:

- a not-for-profit organization that may need Part III guidance
- a pension plan
- a publicly accountable enterprise
- a specialized sector with external reporting requirements outside ordinary
  small-business bookkeeping

## Current-Product Routing

On the current shipped product, use the official jurisdiction-profile path for
Canada first, then keep the remaining chart and workflow choices conservative.
Use this routing:

1. create the company with `country = CA`; when known, also save the true
   province or territory and `commodity_tax_registration_status` there so new
   books inherit the same defaults
2. set or confirm `jurisdiction_profile_id = ca_smb`, the true province or
   territory, and `commodity_tax_registration_status` through the product
   create/apply flow when those facts are known and the operator explicitly
   wants the Canada profile applied
3. set the true operating currency, usually `CAD`
4. apply the nearest official Vibooks industry preset when one matches the
   business
5. review the chart of accounts and add only the Canadian statutory or common
   balances the book truly needs
6. configure tax codes only when the business is actually registered or the
   user explicitly wants tax-coded bookkeeping

Current official product path:

- set the fields at book creation when they are already known
- otherwise call `post-v1-books-book-id-jurisdiction-profile-apply`

Do not claim that Vibooks has a built-in CRA filing integration or a complete
Canadian chart package unless the shipped product actually exposes one.

## Chart-Of-Accounts Rules

Rules:

- do not use CRA GIFI as the operating chart of accounts; treat GIFI as a
  mapping or reporting layer, not as the day-to-day ledger structure
- start from the official Vibooks generic or industry preset, then add Canada-
  specific balances only where the business facts require them
- preserve one real account per real bank account, card, loan, tax balance,
  and clearing balance
- prefer current shipped-product-compatible control-account roles over
  inventing local aliases that drift from Vibooks' account semantics

Common Canadian additions that may be appropriate when the business facts
require them include:

- sales tax payable or recoverable balances
- payroll deductions payable
- shareholder loan balances
- industry-specific deposits, gift-card liabilities, or deferred revenue

Do not create these just because they are common in Canada. Create them only
when the real book needs them.

## Tax Control Accounts And Tax Codes

On the current shipped product, keep the control-account roles stable even if a
future localized UI later changes the display labels.

Current shipped-product-compatible default roles:

- payable control account:
  - new-profile default name: `GST/HST Payable`
  - legacy-compatible reused name: `Sales Tax Payable`
  - `report_category`: `tax_payable`
- recoverable control account:
  - new-profile default name: `GST/HST Recoverable`
  - legacy-compatible reused name: `Sales Tax Receivable`
  - `report_category`: `tax_receivable`

Current product behavior for explicit `ca_smb` opt-in:

- `post-v1-books` can save `country`, `region`, `jurisdiction_profile_id`,
  and `commodity_tax_registration_status`, but it does not itself create the
  Canadian tax defaults
- actual tax-control-account and tax-code creation happens only when the
  operator explicitly runs `post-v1-books-book-id-jurisdiction-profile-apply`
- if Vibooks creates the tax control accounts for a new or empty book, it uses
  the localized Canadian names above
- if the book already has compatible generic `Sales Tax Payable` /
  `Sales Tax Receivable` accounts, Vibooks reuses them without forcing a rename

Preserve the account role first and do not force a cosmetic rename over a
correct existing control account.

Tax-code rules:

- create only the real statutory tax codes the book actually needs
- keep ordinary Canadian federal GST as `GST5` with the standard statutory
  name and rate when that is the real regime
- use the real participating-province HST code only when the business truly
  operates or files under that HST regime, for example `HST13`, `HST14`, or
  `HST15` depending on the province and the current CRA rate schedule
- before creating or revising HST codes, confirm the current CRA rate for the
  province instead of assuming an older rate schedule
- do not create synthetic near-duplicate codes such as `HST1501` merely to
  absorb rounding or partial recoverability
- for partial input-tax claimability, keep the statutory tax code and use the
  normal claimability controls on the document line instead of cloning tax code
  master data
- if the business is not yet registered, keep `tax_mode` conservative and do
  not create GST, HST, PST, or QST codes pre-emptively

Quebec, PST, and other province-specific commodity-tax setups can require extra
jurisdiction detail. Stop and ask before creating them when the obligation is
not explicit.

## Accountant Handoff Package

For Canadian books, the accountant handoff is a bookkeeping workpaper package,
not a CRA filing output.

Use `get-v1-books-book-id-accountant-handoff` for the review date range to
prepare the accountant-facing financial statements, trial balance, general
ledger, journal entries, A/R and A/P aging and open items, bank reconciliation
summary, GST/HST summary, evidence review, attachment manifest, and Canada
jurisdiction notes.

Use `post-api-admin-export-accountant-package` when the accountant needs files:

- `format = xlsx` creates the styled Excel workbook intended for accountant
  review
- `format = zip` includes the full Excel workbook, each selected report as an
  independent XLSX workbook, the JSON workpaper payload, and package manifest
  with report filenames that include company, book, date range, and report
  language
- omit `sections` for the default full report pack; pass `sections` only when
  the accountant asks for selected workpapers, so the workbook tabs,
  independent report files, and JSON payload include only those reports
- leave `basis` unset for the normal accrual-basis package; pass `basis = cash`
  or `basis = tax` only when the accountant explicitly requests that basis for
  the Profit and Loss and Balance Sheet sections
- in the desktop app, use `Reports > Accountant Package`; choose `Full fiscal
  year` for year-end handoff or `Fiscal year to date` for interim review, then
  leave all workpapers selected or clear reports the accountant did not request

Do not claim that the package files a GST/HST return, T2, T1 business schedule,
payroll return, or other CRA filing.

## Suggested Optional Accounts

When the product applies `ca_smb`, it may also surface optional chart
recommendations instead of auto-creating them.

Common high-signal suggestions include:

- `2210 Payroll Deductions Payable`
- `2400 Shareholder Loan`

Treat these as operator-reviewed suggestions, not mandatory defaults. Create
them only when the real business facts require them.

## Account Numbering Guidance

Account numbering is recommended, not mandatory.

Use a stable Canadian-style numbering range when the book wants numbered
accounts, but do not renumber an existing clean chart solely to match a
template. A practical small-business default is:

- `1000-1999`: assets
- `2000-2999`: liabilities
- `3000-3999`: equity
- `4000-4999`: revenue
- `5000-5999`: cost of sales or direct costs
- `6000-7999`: operating expenses
- `8000-8999`: other income and other expense

Prefer stable numbers that match the current book structure over performative
re-numbering.

## Units Of Measure

Canada may require metric and non-metric units to coexist in practice. If the
book uses item quantities or inventory-style units:

- keep one base unit plus any related purchase, sales, or shipping units
- record the true unit used by the source documents and operations
- define explicit conversions instead of freehand mental conversion
- do not assume that every Canadian business uses metric-only units
- do not rename an existing base unit into a different physical unit once
  transactions rely on it; create a new unit set instead

## Do Not Do

- do not choose this profile from operator nationality alone
- do not treat CRA GIFI codes as the live operating account list
- do not mix jurisdiction rules into industry preset ids
- do not create province-specific tax codes without the actual province or
  territory context
- do not create cosmetic near-duplicate tax codes or control accounts
- do not imply that current shipped Vibooks automatically files Canadian tax
  returns unless the product actually exposes that first-class workflow

## Future Product Mapping

When Vibooks later ships deeper first-class Canada localization beyond the
current jurisdiction-profile routing, keep this profile id and prefer the
official product setup. The skill should then switch from manual guidance to:

1. choosing the official `ca_smb` or equivalent product-native setup
2. reusing the product's official Canadian chart and tax defaults
3. keeping this document as a safety and interpretation layer, not as the
   primary creator of Canadian master data

## Reference Points

- CRA IFRS and taxable-income guidance:
  [canada.ca IFRS](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/international-financial-reporting-standards-ifrs.html)
  and
  [CRA taxable income](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/international-financial-reporting-standards-ifrs/impact-ifrs-on-taxable-income.html)
- CRA GIFI reporting guidance:
  [CRA GIFI](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/corporation-income-tax-return/completing-your-corporation-income-tax-t2-return/general-index-financial-information-gifi/preparing-your-financial-statements-using-gifi.html)
- CRA GST/HST rates and place-of-supply rules:
  [CRA GST/HST rates](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-place-supply.html)
- Canadian reporting-framework overview:
  [BDC IFRS and Canadian GAAP overview](https://www.bdc.ca/en/articles-tools/entrepreneur-toolkit/templates-business-guides/glossary/international-financial-reporting-standards)
  and
  [FRAS Canada consultation paper](https://www.frascanada.ca/-/media/frascanada/aspe/documents/acsb-cp-exploring-scalability-canada-2023.pdf)
- Canadian measurement-law basis:
  [Weights and Measures Act](https://laws-lois.justice.gc.ca/eng/acts/W-6/page-7.html)
- mainstream Canadian SMB software alignment:
  [QuickBooks Canada sales tax setup](https://quickbooks.intuit.com/learn-support/en-ca/help-article/sales-taxes/set-collect-sales-tax-quickbooks-online/L1Nu6wYj7_CA_en_CA)
  and
  [QuickBooks Canada account numbers](https://quickbooks.intuit.com/learn-support/en-ca/help-article/chart-accounts/use-account-numbers-chart-accounts-quickbooks/L7lRLN0Do_CA_en_CA)
